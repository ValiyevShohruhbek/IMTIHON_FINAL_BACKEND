import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import VideoService from './video.service';
import { ResendModule } from 'nestjs-resend';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get('JWT_SECRET'),
          signOptions: { expiresIn: '3h' },
        };
      },
    }),
    ResendModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        apiKey: configService.get('RESEND_API_KEY') as string,
      }),
    }),
  ],
  providers: [VideoService],
  exports: [DatabaseModule, JwtModule, VideoService],
})
export class CoreModule {}
