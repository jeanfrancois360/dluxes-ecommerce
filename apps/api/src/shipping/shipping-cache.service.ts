import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * ShippingCacheService
 *
 * Redis-backed cache for shipping rate responses.
 * Prevents redundant API calls to EasyPost, SendCloud, EasyShip, and DHL
 * when the same origin→destination+weight combination is requested repeatedly
 * (e.g. multiple tabs open on checkout, or rapid page refreshes).
 *
 * TTL: 10 minutes — rates are stable on this timescale; providers' pricing
 * engines don't change within a checkout session.
 *
 * Failure mode: if Redis is unavailable, every method is a silent no-op so
 * the shipping cascade continues without caching rather than failing.
 */
@Injectable()
export class ShippingCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(ShippingCacheService.name);
  private readonly redis: Redis;
  private redisAvailable = true;

  /** Cache TTL in seconds. Rates are stable within a checkout session. */
  private readonly TTL_SECONDS = 600; // 10 minutes

  /** Weight is bucketed to the nearest N oz to limit key space. */
  private readonly WEIGHT_BUCKET_OZ = 100; // ~2.8 kg granularity

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      // Don't buffer commands when Redis is down — fail fast so callers fall through
      enableOfflineQueue: false,
      connectTimeout: 3000,
    });

    this.redis.on('error', (err) => {
      if (this.redisAvailable) {
        this.logger.warn(`[ShippingCache] Redis unavailable — caching disabled: ${err.message}`);
        this.redisAvailable = false;
      }
    });

    this.redis.on('connect', () => {
      if (!this.redisAvailable) {
        this.logger.log('[ShippingCache] Redis reconnected — caching re-enabled');
        this.redisAvailable = true;
      }
    });
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  /**
   * Build a deterministic cache key for a shipping rate request.
   * Weight is bucketed (nearest 100 oz) to reduce key proliferation while
   * remaining meaningful for rate differences.
   */
  buildKey(
    provider: string,
    originCountry: string,
    destCountry: string,
    destPostal: string,
    weightOz: number
  ): string {
    const bucket = Math.ceil(weightOz / this.WEIGHT_BUCKET_OZ) * this.WEIGHT_BUCKET_OZ;
    // Normalize inputs to lower-case for consistent key hits
    return [
      'shipping:rates',
      provider.toLowerCase(),
      originCountry.toLowerCase(),
      destCountry.toLowerCase(),
      (destPostal || '').toLowerCase(),
      bucket,
    ].join(':');
  }

  /**
   * Retrieve cached shipping options. Returns null on cache miss or Redis error.
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redisAvailable) return null;
    try {
      const raw = await this.redis.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  /**
   * Store shipping options in cache. Silently ignores Redis errors.
   */
  async set(key: string, value: unknown): Promise<void> {
    if (!this.redisAvailable) return;
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', this.TTL_SECONDS);
    } catch {
      // Non-fatal — caller continues without caching
    }
  }

  /**
   * Invalidate all shipping rate cache entries (e.g. after carrier config change).
   * Uses SCAN to avoid blocking Redis with KEYS.
   */
  async invalidateAll(): Promise<void> {
    if (!this.redisAvailable) return;
    try {
      const pattern = 'shipping:rates:*';
      let cursor = '0';
      let deleted = 0;
      do {
        const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.redis.del(...keys);
          deleted += keys.length;
        }
      } while (cursor !== '0');
      this.logger.log(`[ShippingCache] Invalidated ${deleted} cached rate entries`);
    } catch (err) {
      this.logger.warn(`[ShippingCache] Failed to invalidate cache: ${err.message}`);
    }
  }
}
