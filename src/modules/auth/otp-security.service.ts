import { BadRequestException, Injectable } from '@nestjs/common';
import { RedisService } from 'src/core/database/redis.service';

@Injectable()
export class OtpSecurity {
  private maxAttemptsOtp: number = 3;
  private blockedDuration: number = 3600;
  private otpAttemptsDuration: number = 1050;
  constructor(private redisService: RedisService) {}
  async recordFailedDuration(phone_number: string) {
    const key = `otp_attempts:${phone_number}`;
    const checkExistsKey = await this.redisService.redis.exists(key);
    if (!checkExistsKey) {
      await this.redisService.redis.incr(key);
      await this.redisService.redis.expire(key, this.otpAttemptsDuration);
    } else {
      await this.redisService.redis.incr(key);
    }

    const attempts = +((await this.redisService.getKey(key)) as string);
    const res = this.maxAttemptsOtp - attempts;
    if (res === 0) await this.tempororyBlockUser(phone_number, attempts);

    return res;
  }

  async tempororyBlockUser(phone_number: string, attempts: number) {
    const key = `temporory_blocked_user:${phone_number}`;
    const date = Date.now();
    await this.redisService.redis.setex(
      key,
      this.blockedDuration,
      JSON.stringify({
        blocked_at: date,
        attempts,
        reason: 'To many attempts',
        un_blocked_at: date + this.blockedDuration * 1000,
      }),
    );
  }

  async checkIfTempororyBlockedUser(phone_number: string) {
    const key = `temporory_blocked_user:${phone_number}`;
    const data = await this.redisService.getKey(key);
    if (data) {
      const ttlKey = await this.redisService.getTtlKey(key);
      throw new BadRequestException({
        message: `You tried too much please try again after ${Math.floor(ttlKey / 60)} minutes`,
      });
    }
    return data;
  }
}
