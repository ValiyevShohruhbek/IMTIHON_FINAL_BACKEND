import { IsNumber, IsString } from 'class-validator';

export class CreateVideoDto {
  @IsString()
  title: string;

  @IsString()
  duration: string;
}
