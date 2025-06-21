import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { PrismaService } from 'src/core/database/prisma.service';
import VideoService from 'src/core/video.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
@Injectable()
export class VideosService {
  constructor(
    private videoService: VideoService,
    private prismaService: PrismaService,
  ) {}
  async uploadVideo(
    file: Express.Multer.File,
    data: CreateVideoDto,
    id: string,
  ) {
    const fileName = file.filename;
    const videoPath = path.join(process.cwd(), 'uploads/videos', fileName);
    const resolution: any =
      await this.videoService.getVideoResolution(videoPath);
    const resolutions = [
      { height: 240 },
      { height: 360 },
      { height: 480 },
      { height: 720 },
      { height: 1080 },
    ];

    const validResolutions = resolutions.filter(
      (r) => r.height <= resolution.height + 6,
    );

    if (validResolutions.length > 0) {
      fs.mkdir(
        path.join(process.cwd(), 'uploads', 'videos', fileName.split('.')[0]),
        {
          recursive: true,
        },
        (err) => {
          if (err) throw new InternalServerErrorException(err);
        },
      );
      await Promise.all(
        this.videoService.convertToResolutions(
          videoPath,
          path.join(process.cwd(), 'uploads', 'videos', fileName.split('.')[0]),
          validResolutions,
        ),
      );
      fs.unlinkSync(videoPath);
      const res = await this.prismaService.video.create({
        data: {
          videoUrl: fileName,
          duration: +data.duration,
          title: data.title,
          author: { connect: { id } },
        },
      });
      return {
        message: 'success',
        data: res,
      };
    } else {
      console.log('❗ Video juda past sifatli, convert qilish kerak emas.');
    }
  }

  async watchVideo(id: string, quality: string, range: string, res: Response) {
    const fileName = id;
    const baseQuality = `${quality}p.mp4`;
    const basePath = path.join(process.cwd(), 'uploads', 'videos');
    const readDir = fs.readdirSync(basePath);
    const videoActivePath = path.join(basePath, fileName, baseQuality);
    if (!readDir.includes(fileName))
      throw new NotFoundException('video not found');
    const innerVideoDir = fs.readdirSync(path.join(basePath, fileName));
    if (!innerVideoDir.includes(baseQuality))
      throw new NotFoundException('video quality not found');
    const { size } = fs.statSync(videoActivePath);
    const { start, end } = this.videoService.getChunkProps(range, size);
    if (!range) {
      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      });
      const videoStream = fs.createReadStream(videoActivePath, {
        start,
        end,
        highWaterMark: 10 * 1024,
      });
      videoStream.pipe(res);
    } else {
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Accept-Ranges': 'bytes',
        'Content-Type': 'video/mp4',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      });
      const videoStream = fs.createReadStream(videoActivePath, {
        start,
        end,
      });
      videoStream.pipe(res);
    }
  }

  async getVideoPage(limit: number, page: number) {
    const skip = (page - 1) * limit;

    const res = await this.prismaService.video.findMany({ skip, take: limit });

    return { data: res };
  }

  async getVideoDetails(id: string) {
    const checkVideo = await this.prismaService.video.findFirst({
      where: { id },
      include: { author: true },
    });
    if (!checkVideo) throw new NotFoundException('Video not found');
    return checkVideo;
  }

  async updateVideo({ title, description }: UpdateVideoDto, id: string) {
    const checkVideo = await this.prismaService.video.findFirst({
      where: { id },
    });
    if (!checkVideo) throw new NotFoundException('Video not found');
    return await this.prismaService.video.update({
      where: { id },
      data: { title, description },
    });
  }

  async deleteVideo(id: string) {
    const checkVideo = await this.prismaService.video.findFirst({
      where: { id },
    });
    if (!checkVideo) throw new NotFoundException('Video not found');

    await this.prismaService.video.delete({ where: { id } });

    return { message: 'deleted' };
  }
}
