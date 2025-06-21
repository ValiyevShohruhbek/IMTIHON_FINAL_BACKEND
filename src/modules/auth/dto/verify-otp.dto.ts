import { IsString } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  phone_number: string;

  @IsString()
  code: string;
}
