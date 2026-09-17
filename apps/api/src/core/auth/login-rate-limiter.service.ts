import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import type Redis from "ioredis";
import { REDIS_CONNECTION } from "../cache/cache.constants";

const IP_MAX_ATTEMPTS = 20;
const IP_WINDOW_SECONDS = 15 * 60;
const EMAIL_MAX_FAILURES = 5;
const EMAIL_WINDOW_SECONDS = 15 * 60;

/**
 * ARCHITECTURE.md madde "Rate limiting & brute-force: Redis token bucket
 * (/auth/login, AI, scraper endpoint'lerinde)" — this was the one listed
 * endpoint that never actually got one. Two independent limits, both
 * Redis `INCR`+`EXPIRE` fixed-window counters (same mechanism as
 * core-scraper-kit's RateLimiter, reimplemented here rather than
 * importing the scraper package into Auth — the two are conceptually
 * unrelated and shouldn't be coupled just to save ~15 lines):
 *   - per-IP: throttles scripted/distributed abuse regardless of which
 *     account is being tried.
 *   - per-email: throttles targeted brute-forcing of one account, and
 *     only counts *failures* (a burst of correct-password requests from
 *     double-clicks or multiple tabs never locks a real user out).
 */
@Injectable()
export class LoginRateLimiterService {
  constructor(@Inject(REDIS_CONNECTION) private readonly redis: Redis) {}

  async assertNotRateLimited(ipAddress: string, email: string): Promise<void> {
    const ipKey = `auth:login:ip:${ipAddress}`;
    const emailKey = this.emailKey(email);

    const [ipCount, emailFailures] = await Promise.all([this.redis.get(ipKey), this.redis.get(emailKey)]);

    if (Number(ipCount) >= IP_MAX_ATTEMPTS) {
      throw new HttpException("Too many login attempts, try again later", HttpStatus.TOO_MANY_REQUESTS);
    }
    if (Number(emailFailures) >= EMAIL_MAX_FAILURES) {
      throw new HttpException("Too many failed attempts for this account, try again later", HttpStatus.TOO_MANY_REQUESTS);
    }

    const count = await this.redis.incr(ipKey);
    if (count === 1) await this.redis.expire(ipKey, IP_WINDOW_SECONDS);
  }

  async recordFailure(email: string): Promise<void> {
    const key = this.emailKey(email);
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, EMAIL_WINDOW_SECONDS);
  }

  async recordSuccess(email: string): Promise<void> {
    await this.redis.del(this.emailKey(email));
  }

  private emailKey(email: string): string {
    return `auth:login:email:${email.toLowerCase()}`;
  }
}
