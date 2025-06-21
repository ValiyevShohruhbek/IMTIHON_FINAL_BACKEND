import { IsString } from 'class-validator';
import { SrvRecord } from 'dns';

export class CreateUserDto {
  @IsString()
  email: string;

  @IsString()
  username: string;

  @IsString()
  phone_number: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  password: string;

  @IsString()
  session_token: string;
}
