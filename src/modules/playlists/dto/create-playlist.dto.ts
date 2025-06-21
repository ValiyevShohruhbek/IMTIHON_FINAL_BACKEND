import { Visibility } from '@prisma/client';
import { IsEnum, IsNumber, IsString } from 'class-validator';

export class CreatePlaylistDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(Visibility)
  visibility: Visibility;
}

export class CreatePlaylistVideoDto {
  @IsString()
  videoId: string;

  @IsNumber()
  position: number;
}
