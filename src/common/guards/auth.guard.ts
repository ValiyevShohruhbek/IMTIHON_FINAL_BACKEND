import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['authorization']?.split(' ')[1];

    try {
      const { id, role } = await this.jwtService.verifyAsync(token);
      request.user = { id, role };
      return true;
    } catch (error) {
      throw new ForbiddenException('Token invalid');
    }
  }
}
