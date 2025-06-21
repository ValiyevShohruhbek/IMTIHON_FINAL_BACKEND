import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelService {
  constructor(private readonly prismaService: PrismaService) {}

  async updateChannel(id: string, filename: string, data: UpdateChannelDto) {
    const checkUser = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!checkUser) throw new NotFoundException('User not found');

    const result = await this.prismaService.user.update({
      where: { id },
      data: { channelBanner: filename, ...data },
    });
    return result;
  }

  async getChannel(username: string) {
    const channel = await this.prismaService.user.findUnique({
      where: { channelUsername: username },
    });
    if (!channel) throw new NotFoundException('Channel not found');
    return { data: channel };
  }

  async subscribe(userId: string, subscribeId: string) {
    const result = await this.prismaService.subscription.create({
      data: { channelId: userId, subscriberId: subscribeId },
      include: { channel: true, subscriber: true },
    });
    const {
      channel: { password: channelPassword, ...channelRest },
      subscriber: { password: subscriberPassword, ...subscriberRest },
      ...rest
    } = result;

    const userInfo = {
      ...rest,
      channel: channelRest,
      subscriber: subscriberRest,
    };

    return { data: userInfo };
  }

  async unsubscribe(userId: string, subscriptionId: string) {
    const checkSubscription = await this.prismaService.subscription.findFirst({
      where: { subscriberId: subscriptionId },
    });
    if (!checkSubscription) throw new NotFoundException('Channel not found');

    await this.prismaService.subscription.delete({
      where: { id: checkSubscription.id },
    });

    return { message: 'channel deleted' };
  }

  async getSubscription(userId: string, limit: string, page: string) {
    const skip = (+page - 1) * +limit;

    return this.prismaService.subscription.findMany({
      where: {
        subscriberId: userId,
      },
      include: {
        channel: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      skip,
      take: +limit,
    });
  }
  async getSubscriptionFeed(userId: string, limit: string, page: string) {
    const skip = (+page - 1) * +limit;

    const subscriptions = await this.prismaService.subscription.findMany({
      where: { subscriberId: userId },
      select: { channelId: true },
    });

    const channelIds = subscriptions.map((sub) => sub.channelId);

    if (channelIds.length === 0) return [];

    return this.prismaService.video.findMany({
      where: {
        authorId: { in: channelIds },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: +limit,
    });
  }
}
