import { Visibility } from '@prisma/client';
import { IsEnum, IsNumber, IsString } from 'class-validator';

export class UpdatePlaylistDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(Visibility)
  visibility: Visibility;
}
