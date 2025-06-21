import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  Put,
} from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import {
  CreatePlaylistDto,
  CreatePlaylistVideoDto,
} from './dto/create-playlist.dto';
import { Request } from 'express';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';

@Controller()
@UseGuards(AuthGuard)
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Post('playlists')
  async addPlaylists(@Body() data: CreatePlaylistDto, @Req() request: Request) {
    const { id } = request['user'];
    return await this.playlistsService.addPlaylists(data, id);
  }

  @Post('playlists/:id/videos')
  async addVideoToPlaylist(
    @Param('id') playlistId: string,
    @Body() data: CreatePlaylistVideoDto,
  ) {
    return await this.playlistsService.addPlaylistVideo(playlistId, data);
  }
  @Get('playlists/:id')
  async getPlaylist(@Param('id') id: string) {
    return await this.playlistsService.getPlaylists(id);
  }

  @Get('/users/:userId/playlists')
  async getUserPlaylists(
    @Param('userId') userId: string,
    @Query('limit') limit: string,
    @Query('page') page: string,
  ) {
    return await this.playlistsService.getUserPlaylists(userId, +limit, +page);
  }

  @Put('/playlists/:id')
  async updatePlaylist(
    @Param('id') playlistId: string,
    @Body() data: UpdatePlaylistDto,
    @Req() request: Request,
  ) {
    const { id } = request['user'];
    return await this.playlistsService.updatePlaylists(id, playlistId, data);
  }

  @Delete('playlists/:id/videos/:videoId')
  async deletePlaylistAndVideo(
    @Param('id') playlistId: string,
    @Param('videoId') videoid: string,
  ) {
    return await this.playlistsService.deletePlaylists(playlistId, videoid);
  }
}
