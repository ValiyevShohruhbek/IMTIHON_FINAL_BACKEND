import { IsString } from 'class-validator';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import bcrypt from 'bcrypt';
import { EmailOtpService } from '../auth/email.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly emailService: EmailOtpService,
    private readonly jwtService: JwtService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const checkPhoneNumber = await this.prismaService.user.findUnique({
      where: { phone_number: createUserDto.phone_number },
    });
    if (checkPhoneNumber)
      throw new ConflictException('Phone number already exists');
    const checkUserName = await this.prismaService.user.findUnique({
      where: { username: createUserDto.username },
    });
    if (checkUserName) throw new ConflictException('Username already exists');
    const checkEmail = await this.prismaService.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (checkEmail) throw new ConflictException('Email already exists');

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    const { session_token, ...data } = createUserDto;
    const { password, ...userInfo } = await this.prismaService.user.create({
      data: { ...data, password: hashedPassword },
    });

    return { user: userInfo };
  }

  async getMe({ id }: { id: string }) {
    let user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    const { password, ...userInfo } = user;
    return userInfo;
  }

  async update(id: string, updateUserDto: UpdateUserDto, filename: string) {
    const findUser = await this.prismaService.user.findFirst({ where: { id } });
    if (!findUser) throw new InternalServerErrorException('user not found');
    const update = await this.prismaService.user.update({
      where: { id },
      data: { ...updateUserDto, avatar: filename },
    });

    return { data: update };
  }

  async findPhoneNumber(phoneNumber: string) {
    return await this.prismaService.user.findFirst({
      where: { phone_number: phoneNumber },
    });
  }

  async sendEmail(email: string) {
    await this.emailService.sendEmailLink(email);
  }

  async verifyEmail(token: string) {
    const redisToken = await this.emailService.getEmailToken(token);

    if (redisToken) {
      const { email } = await this.jwtService.verifyAsync(token);

      await this.prismaService.user.update({
        where: { email },
        data: { is_email_verified: true },
      });
    } else {
      throw new InternalServerErrorException('Token Kelmadi');
    }
  }
}
