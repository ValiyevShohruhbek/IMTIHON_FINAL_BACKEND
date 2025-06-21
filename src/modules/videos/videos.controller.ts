import { VideosService } from './videos.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  SetMetadata,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path from 'path';
import { Request, Response } from 'express';
import { CreateVideoDto } from './dto/create-video.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { UpdateVideoDto } from './dto/update-video.dto';

@Controller('video')
@UseGuards(AuthGuard, RoleGuard)
@SetMetadata('roles', ['USER', 'ADMIN'])
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads/videos',
        filename: (req, file, callback) => {
          const mimeType = path.extname(file.originalname);
          const fileName = `${Date.now()}${mimeType}`;
          callback(null, fileName);
        },
      }),
    }),
  )
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() data: CreateVideoDto,
    @Req() request: Request,
  ) {
    const { id } = request['user'];
    return await this.videosService.uploadVideo(file, data, id);
  }
  @Get()
  async getVideoPage(
    @Query('limit') limit: string,
    @Query('page') page: string,
  ) {
    return await this.videosService.getVideoPage(+limit, +page);
  }

  @Get('watch/:id')
  async watchVideo(
    @Param('id') id: string,
    @Query('quality') quality: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const param = id;
    const contentRange = req.headers.range;
    const userId = req['user']['id'];

    // console.log(contentRange);
    return await this.videosService.watchVideo(
      userId,
      param,
      quality,
      contentRange as string,
      res,
    );
  }

  @Get('/:id')
  async getVideoDetails(@Param('id') id: string) {
    return await this.videosService.getVideoDetails(id);
  }

  @Put('/:id')
  async updateVideos(@Param('id') id: string, @Body() data: UpdateVideoDto) {
    return await this.videosService.updateVideo(data, id);
  }

  @Delete('/:id')
  async deleteVideo(@Param('id') id: string) {
    return await this.videosService.deleteVideo(id);
  }
}
