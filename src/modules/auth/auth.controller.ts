import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { Response } from 'express';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto, LoginVerifyDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  async sendOtp(@Body() data: CreateAuthDto) {
    const response = await this.authService.sendOtpUser(data);

    return response;
  }
  @Post('verify-otp')
  async verifyOtp(
    @Body() data: VerifyOtpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return await this.authService.verifyOtp(data);
  }

  @Post('register')
  async register(
    @Body() data: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await this.authService.register(data);
    res.cookie('token', {
      maxAge: 2 * 60 * 60 * 1000,
      httpOnly: true,
    });
    return response;
  }

  @Post('login')
  async login(@Body() data: LoginDto) {
    return await this.authService.login(
      data.phone_number as string,
      data.password,
    );
  }

  @Post('login-verify')
  async loginVerify(@Body() data: LoginVerifyDto) {
    return await this.authService.loginVerify(
      data.code,
      data.phone_number as string,
    );
  }
}
