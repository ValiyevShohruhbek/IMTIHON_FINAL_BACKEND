import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Request } from 'express';
import { AuthGuard } from 'src/common/guards/auth.guard';

@Controller()
@UseGuards(AuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('videos/:videoid/comments')
  async addComments(
    @Param('videoid') videoId: string,
    @Body() data: CreateCommentDto,
    @Req() request: Request,
  ) {
    const { id } = request['user'];

    return await this.commentsService.addComments(data, videoId, id);
  }

  @Get('videos/:videoid/comments')
  async getComments(
    @Param('videoid') videoId: string,
    @Query('limit') limit: string,
    @Query('page') page: string,
  ) {
    return await this.commentsService.getComments(videoId, +limit, +page);
  }

  @Post('comments/:id/like')
  async addLike(@Param('id') commentId: string, @Req() request: Request) {
    const { id } = request['user'];
    return await this.commentsService.addLike(id, commentId);
  }

  @Post('comments/:id/dislike')
  async addDislike(@Param('id') commentId: string, @Req() request: Request) {
    const { id } = request['user'];
    return await this.commentsService.addDislike(id, commentId);
  }

  @Delete('comments/:id/like')
  async deleteLike(@Param('id') commentId: string, @Req() request: Request) {
    const { id } = request['user'];
    return await this.commentsService.deleteLike(id, commentId);
  }
  @Delete('comments/:id/dislike')
  async deleteDislike(@Param('id') commentId: string, @Req() request: Request) {
    const { id } = request['user'];
    return await this.commentsService.deleteDislike(id, commentId);
  }
}
