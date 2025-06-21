import { Module } from '@nestjs/common';
import { UsersModule } from 'src/modules/users/users.module';
import { SeedersService } from './seeders.service';

@Module({
  imports: [UsersModule],
  providers: [SeedersService],
  exports: [],
})
export class SeedersModule {}
