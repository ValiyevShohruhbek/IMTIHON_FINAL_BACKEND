import { UsersService } from 'src/modules/users/users.service';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/core/database/prisma.service';
import { RedisService } from 'src/core/database/redis.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import bcrypt from 'bcrypt';
import { OtpService } from './otp.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { EmailOtpService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
    private prismaService: PrismaService,
    private otpService: OtpService,
    private usersService: UsersService,
    private emailOtpService: EmailOtpService,
  ) {}
  async sendOtpUser(data: CreateAuthDto) {
    const findUser = await this.usersService.findPhoneNumber(data.phone_number);

    if (findUser)
      throw new ConflictException('Phone Number already exists !!!');

    const res = await this.otpService.sendOtp(data.phone_number);

    if (!res) {
      throw new InternalServerErrorException('Server error');
    }
    return {
      message: 'Code sended',
    };
  }

  async verifyOtp(data: VerifyOtpDto) {
    const key = `user:${data.phone_number}`;
    const sessionToken = await this.otpService.verifyOtpSendedUser(
      key,
      data.code,
      data.phone_number,
    );

    return {
      message: 'success',
      statusCode: 200,
      session_token: sessionToken,
    };
  }

  async register(data: CreateUserDto) {
    const findUser = await this.usersService.findPhoneNumber(data.phone_number);

    if (findUser)
      throw new InternalServerErrorException('phone_number already exists');

    const key = `session_token:${data.phone_number}`;
    await this.otpService.checkSessionTokenUser(key, data.session_token);

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await this.usersService.create(data);
    const token = await this.jwtService.signAsync({
      id: user.user.id,
      role: user.user.role,
    });

    await this.redisService.delOtp(key);

    return { token };
  }
  async login(phone_number: string, password: string) {
    const findUser = await this.usersService.findPhoneNumber(phone_number);
    if (!findUser) throw new ConflictException('Phone number not found ');
    const sendOtp = await this.otpService.sendOtp(phone_number);
    return true;
  }

  async loginVerify(code: string, phone_number: string) {
    const key = `user:${phone_number}`;
    await this.otpService.verifyOtpSendedUser(key, code, phone_number);
    const checkPhoneNumber = await this.prismaService.user.findFirst({
      where: { phone_number },
    });
    if (!checkPhoneNumber)
      throw new ConflictException('Phone number not found');
    const token = await this.jwtService.signAsync({
      id: checkPhoneNumber.id,
      role: checkPhoneNumber.role,
    });
    return { token };
  }

  async sendEmailVerificationLink(email: string) {
    await this.emailOtpService.sendEmailLink(email);
    return { message: 'link sended' };
  }

  async verifyEmail(token: string) {
    const data = await this.emailOtpService.getEmailToken(token);
    const email = JSON.parse(data as string).email;
    const user = await this.prismaService.user.findFirst({
      where: { email },
    });
    await this.prismaService.user.update({
      where: { id: user?.id },
      data: { is_email_verified: true },
    });
  }
}
