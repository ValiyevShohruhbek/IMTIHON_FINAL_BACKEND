import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/modules/users/users.service';
import { PrismaService } from '../prisma.service';
import bcrypt from 'bcrypt';

@Injectable()
export class SeedersService implements OnModuleInit {
  private logger: Logger = new Logger();
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
    private readonly prismaServise: PrismaService,
  ) {}
  async seedAll() {
    await this.createSuperadmin();
  }
  async createSuperadmin() {
    const phoneNumber = this.configService.get('SUPERADMIN_PHONENUMBER');
    const email = this.configService.get('SUPERADMIN_EMAIL');
    const checkSuperadmin = await this.userService.findPhoneNumber(phoneNumber);
    const checkEmail = await this.prismaServise.user.findFirst({
      where: { email },
    });

    if (checkSuperadmin || checkEmail)
      return this.logger.log('SuperAdmin yaratilgan');

    const firstName = this.configService.get('SUPERADMIN_FIRSTNAME');
    const lastName = this.configService.get('SUPERADMIN_LASTNAME');
    const password = this.configService.get('SUPERADMIN_PASSWORD');
    const userName = this.configService.get('SUPERADMIN_USERNAME');
    const hashedPassword = await bcrypt.hash(password, 12);

    await this.prismaServise.user.create({
      data: {
        email: email,
        phone_number: phoneNumber,
        firstName: firstName,
        lastName: lastName,
        password: hashedPassword,
        username: userName,
        role: 'SUPERADMIN',
      },
    });

    return this.logger.log('Superadmin yaratildi');
  }
  async onModuleInit() {
    await this.seedAll();
  }
}
