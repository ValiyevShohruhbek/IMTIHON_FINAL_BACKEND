import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ChannelModule } from './modules/channel/channel.module';
import { VideosModule } from './modules/videos/videos.module';
import { CommentsModule } from './modules/comments/comments.module';
import { LikesModule } from './modules/likes/likes.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [CoreModule, AuthModule, UsersModule, VideosModule, ChannelModule, CommentsModule, LikesModule, AdminModule],
  controllers: [],
  providers: [{ provide: APP_INTERCEPTOR, useClass: TransformInterceptor }],
})
export class AppModule {}
