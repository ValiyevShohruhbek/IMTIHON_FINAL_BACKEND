import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreatePlaylistDto,
  CreatePlaylistVideoDto,
} from './dto/create-playlist.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';

@Injectable()
export class PlaylistsService {
  constructor(private readonly prismaService: PrismaService) {}

  async addPlaylists(data: CreatePlaylistDto, authorId: string) {
    const res = await this.prismaService.playlist.create({
      data: {
        ...data,
        authorId,
      },
    });

    return { data: res };
  }

  async addPlaylistVideo(playlistId: string, data: CreatePlaylistVideoDto) {
    const checkPlaylist = await this.prismaService.playlist.findFirst({
      where: { id: playlistId },
    });

    const checkVideo = await this.prismaService.video.findFirst({
      where: { id: data.videoId },
    });

    if (!checkPlaylist || !checkVideo)
      throw new NotFoundException('Video or playlist not found');
    const res = await this.prismaService.playlistVideo.create({
      data: {
        ...data,
        playlistId,
      },
    });

    return { data: res };
  }

  async getPlaylists(id: string) {
    const checkPlaylist = await this.prismaService.playlist.findFirst({
      where: { id },
    });

    if (!checkPlaylist) throw new NotFoundException('Playlist not found');

    return { data: checkPlaylist };
  }

  async getUserPlaylists(userId: string, limit: number, page: number) {
    const checkUser = await this.prismaService.user.findFirst({
      where: { id: userId },
    });
    if (!checkUser) throw new NotFoundException('User not found');

    const skip = (page - 1) * limit;

    const res = await this.prismaService.playlist.findMany({
      where: { authorId: userId },
      take: limit,
      skip,
    });

    return res;
  }

  async updatePlaylists(
    id: string,
    playlistId: string,
    data: UpdatePlaylistDto,
  ) {
    const checkPlaylist = await this.prismaService.playlist.findFirst({
      where: { id: playlistId },
    });
    if (!checkPlaylist) throw new NotFoundException('Playlist not found');

    const res = await this.prismaService.playlist.update({
      where: { id: playlistId },
      data: { ...data, authorId: id },
    });

    return { data: res };
  }

  async deletePlaylists(playlistId: string, videoId: string) {
    const checkPlaylist = await this.prismaService.playlist.findFirst({
      where: { id: playlistId },
    });

    if (!checkPlaylist) throw new NotFoundException('Playlist not found');

    await this.prismaService.playlist.delete({ where: { id: playlistId } });

    return { message: 'Deleted playlist' };
  }
}
