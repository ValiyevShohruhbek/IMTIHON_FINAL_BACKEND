import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, Observable } from 'rxjs';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const handler = context.getHandler();
    const isFreeResponse = this.reflector.get('isFreeResponse', handler);

    const statusCode = response.statusCode;

    if (!isFreeResponse) {
      return next.handle().pipe(
        map((data) => {
          return {
            status: statusCode,
            message: 'success',
            ...(typeof data !== 'object' || Array.isArray(data)
              ? { data }
              : data),
          };
        }),
      );
    }

    return next.handle();
  }
}
