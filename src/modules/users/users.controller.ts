import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  Put,
  Req,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path from 'path';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';

@Controller('users')
@UseGuards(AuthGuard, RoleGuard)
@SetMetadata('roles', ['USER'])
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  @SetMetadata('roles', ['ADMIN'])
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return await this.usersService.verifyEmail(token);
  }

  @Get('me')
  getMe(@Req() req: Request) {
    const user = req['user'];
    return this.usersService.getMe(user);
  }

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads/images',
        filename: (req, file, callback) => {
          const mimeType = path.extname(file.originalname);
          const fileName = `${Date.now()}${mimeType}`;
          callback(null, fileName);
        },
      }),
    }),
  )
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.update(id, updateUserDto, file.filename as string);
  }

  @Post('email')
  async sendEmail(@Body('email') email: string) {
    return await this.usersService.sendEmail(email);
  }
}
