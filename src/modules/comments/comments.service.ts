import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private readonly prismaService: PrismaService) {}

  async addComments(data: CreateCommentDto, videoId: string, userId: string) {
    const checkUser = await this.prismaService.user.findFirst({
      where: { id: userId },
    });
    const checkVideo = await this.prismaService.video.findFirst({
      where: { id: videoId },
    });
    if (!checkUser || !checkVideo) {
      throw new NotFoundException('Video or User not found');
    }

    const res = await this.prismaService.comment.create({
      data: {
        content: data.content,
        authorId: userId,
        videoId: videoId,
      },
      select: {
        content: true,
        author: {
          select: {
            id: true,
            avatar: true,
            username: true,
          },
        },
      },
    });

    return { data: res };
  }

  async getComments(videoId: string, limit: number, page: number) {
    const checkVideo = await this.prismaService.video.findFirst({
      where: { id: videoId },
    });
    if (!checkVideo) throw new NotFoundException('Video not found');

    const skip = (page - 1) * limit;

    const totalCount = await this.prismaService.comment.count({
      where: { videoId },
    });

    const res = await this.prismaService.comment.findMany({
      skip,
      take: limit,
      where: {
        videoId,
      },
      include: {
        author: {
          select: {
            id: true,
            avatar: true,
            username: true,
          },
        },
      },
    });

    return { data: res, totalComments: totalCount };
  }

  async addLike(userId: string, commentId: string) {
    const checkUser = await this.prismaService.user.findFirst({
      where: { id: userId },
    });
    const checkComment = await this.prismaService.comment.findFirst({
      where: { id: commentId },
    });

    if (!checkUser || !checkComment)
      throw new NotFoundException('User or comment not found');

    const likeComment = await this.prismaService.like.create({
      data: { commentId, userId, type: 'LIKE', videoId: checkComment.videoId },
    });

    return { data: likeComment };
  }

  async addDislike(userId: string, commentId: string) {
    const checkUser = await this.prismaService.user.findFirst({
      where: { id: userId },
    });
    const checkComment = await this.prismaService.comment.findFirst({
      where: { id: commentId },
    });

    if (!checkUser || !checkComment)
      throw new NotFoundException('User or comment not found');
    const dislikeComment = await this.prismaService.like.create({
      data: {
        commentId,
        userId,
        type: 'DISLIKE',
        videoId: checkComment.videoId,
      },
    });

    return { data: dislikeComment };
  }

  async deleteLike(userId: string, commentId: string) {
    const checkUser = await this.prismaService.user.findFirst({
      where: { id: userId },
    });
    const checkComment = await this.prismaService.comment.findFirst({
      where: { id: commentId },
    });

    if (!checkUser || !checkComment)
      throw new NotFoundException('User or comment not found');

    const deleteLike = await this.prismaService.like.delete({
      where: {
        userId_commentId_type: {
          userId,
          commentId,
          type: 'LIKE',
        },
      },
    });

    return { message: 'like deleted' };
  }
  async deleteDislike(userId: string, commentId: string) {
    const checkUser = await this.prismaService.user.findFirst({
      where: { id: userId },
    });
    const checkComment = await this.prismaService.comment.findFirst({
      where: { id: commentId },
    });

    if (!checkUser || !checkComment)
      throw new NotFoundException('User or comment not found');

    const deleteLike = await this.prismaService.like.delete({
      where: {
        userId_commentId_type: {
          userId,
          commentId,
          type: 'DISLIKE',
        },
      },
    });

    return { message: 'like deleted' };
  }
}
