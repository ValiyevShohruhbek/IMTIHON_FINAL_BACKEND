import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private logger: Logger = new Logger();
  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Prisma connected');
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  }
}
