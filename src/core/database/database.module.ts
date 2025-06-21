import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { PrismaService } from './prisma.service';
import { SeedersModule } from './seeders/seeders.module';

@Global()
@Module({
  imports: [SeedersModule],
  providers: [RedisService, PrismaService],
  exports: [PrismaService, RedisService],
})
export class DatabaseModule {}
