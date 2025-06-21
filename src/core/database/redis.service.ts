import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  private logger: Logger = new Logger();
  private duration: number = 180;
  public redis: Redis;
  constructor() {
    this.redis = new Redis({
      port: +(process.env.REDIS_PORT as string),
      host: process.env.REDIS_HOST as string,
    });
    this.redis.on('connect', () => {
      this.logger.log('Redis connected');
    });
    this.redis.on('error', () => {
      this.logger.log('Redis disconnected');
      this.redis.quit();
    });
  }

  async setOtp(phone_number: string, otp: string): Promise<string> {
    const key = `user:${phone_number}`;
    const result = await this.redis.setex(key, this.duration, otp);
    return result;
  }

  async getOtp(key: string) {
    const otp = await this.redis.get(key);
    return otp;
  }

  async getTtlKey(key: string) {
    const ttl = this.redis.ttl(key);
    return ttl;
  }

  async delOtp(key: string) {
    const delKey = await this.redis.del(key);
  }

  async setSessionToken(phone_number: string, session_token: string) {
    await this.redis.setex(`session_token:${phone_number}`, 300, session_token);
  }

  async getKey(key: string) {
    const otp = await this.redis.get(key);
    return otp;
  }
}
