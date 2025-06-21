import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateChannelDto {
  @IsString()
  @IsOptional()
  channelName: string;

  @IsString()
  @IsOptional()
  channelDescription: string;

  @IsString()
  @IsOptional()
  channelUsername: string;
}
