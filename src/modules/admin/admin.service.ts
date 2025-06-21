import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import dayjs from 'dayjs';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const todayStart = dayjs().startOf('day').toDate();

    const [
      totalUsers,
      totalVideos,
      totalViews,
      totalWatchTime,
      newUsersToday,
      newVideosToday,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.video.count(),
      this.prisma.video.aggregate({ _sum: { viewsCount: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.video.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.video.aggregate({
        _sum: { viewsCount: true },
        where: { createdAt: { gte: todayStart } },
      }),
    ]);

    return {
      totalUsers,
      totalVideos,
      totalViews: totalViews._sum.viewsCount || 0,
      newUsersToday,
      newVideosToday,
      storageUsed: '500TB', // bu yerga real hisob-kitob yoki dummy qiymat
      bandwidthUsed: '50TB', // bu ham
    };
  }
}
