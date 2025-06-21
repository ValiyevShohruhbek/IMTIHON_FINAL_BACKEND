import { Module } from '@nestjs/common';
import VideoService from 'src/core/video.service';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';

@Module({
  controllers: [VideosController],
  providers: [VideosService, VideoService],
})
export class VideosModule {}
