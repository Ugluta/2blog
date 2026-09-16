interface RedisLike {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
}

/**
 * Domain-bucketed rate limiting (ARCHITECTURE.md madde 10: "domain bazlı
 * token bucket, Redis"). Implemented as a fixed-window counter rather than
 * a literal leaky/token bucket — simpler, and Redis's `INCR`+`EXPIRE` makes
 * it atomic-enough for this use without a Lua script; the effect (at most N
 * requests per host per window) is the same guarantee a scraper needs.
 */
export class RateLimiter {
  constructor(
    private readonly redis: RedisLike,
    private readonly maxRequests: number,
    private readonly windowSeconds: number,
  ) {}

  /** Returns true if the request is allowed and has been counted against the window. */
  async tryConsume(hostname: string): Promise<boolean> {
    const key = `scraper:ratelimit:${hostname}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, this.windowSeconds);
    }
    return count <= this.maxRequests;
  }
}
