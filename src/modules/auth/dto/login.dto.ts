import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  phone_number: String;

  @IsString()
  password: string;
}

export class LoginVerifyDto {
  @IsString()
  phone_number: String;

  @IsString()
  code: string;
}
