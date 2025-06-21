import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseInterceptors,
  UploadedFile,
  Req,
  UseGuards,
  SetMetadata,
  Query,
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path from 'path';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { ConfigService } from '@nestjs/config';

@Controller('channels')
@UseGuards(AuthGuard, RoleGuard)
@SetMetadata('roles', ['ADMIN', 'USER'])
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}
  @Put('update/channel')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads/channel-banner',
        filename: (req, file, callback) => {
          const mimeType = path.extname(file.originalname);
          const fileName = `${Date.now()}${mimeType}`;
          callback(null, fileName);
        },
      }),
    }),
  )
  async updateChannel(
    @UploadedFile('file') file: Express.Multer.File,
    @Body() data: UpdateChannelDto,
    @Req() request: Request,
  ) {
    const filename = `/uploads/channel-banner/${file.filename}`;
    const { id } = request['user'];
    return await this.channelService.updateChannel(id, filename, data);
  }

  @Get('/:username')
  async getChannel(@Param('username') username: string) {
    return await this.channelService.getChannel(username);
  }

  @Post(':userid/subscribe')
  async subscribe(@Param('userid') userId: string, @Req() request: Request) {
    const subscriberId = request['user']['id'];
    return await this.channelService.subscribe(userId, subscriberId);
  }

  @Delete(':userid/subscribe')
  async unsubscribe(@Param('userid') userId: string, @Req() request: Request) {
    const subscriberId = request['user']['id'];
    return await this.channelService.unsubscribe(userId, subscriberId);
  }

  @Get('subscriptions')
  async getSubscription(
    @Query('limit') limit: string,
    @Query('page') page: string,
    @Req() request: Request,
  ) {
    const userId = request['user']['id'];
    return await this.channelService.getSubscription(userId, limit, page);
  }
  @Get('subscriptions')
  async getSubscriptionFeed(
    @Query('limit') limit: string,
    @Query('page') page: string,
    @Req() request: Request,
  ) {
    const userId = request['user']['id'];
    return await this.channelService.getSubscriptionFeed(userId, limit, page);
  }
}
