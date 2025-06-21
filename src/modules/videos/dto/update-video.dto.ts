import { IsOptional, IsString } from 'class-validator';

export class UpdateVideoDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description: string;
}
