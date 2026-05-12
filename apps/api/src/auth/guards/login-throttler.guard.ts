import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Login-specific throttler guard.
 *
 * The default ThrottlerGuard keys by IP address, which means failed login
 * attempts from one user can throttle (HTTP 429) every other user behind the
 * same NAT/VPN/corporate router.
 *
 * This guard keys by email instead, so each account has its own independent
 * request bucket and users never interfere with each other.
 */
@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected generateKey(context: ExecutionContext, suffix: string, throttlerName: string): string {
    const request = context.switchToHttp().getRequest();
    const email = (request.body?.email ?? '').toLowerCase().trim();

    // Fall back to IP if body hasn't been parsed yet (shouldn't happen for POST /login)
    if (!email) {
      return super.generateKey(context, suffix, throttlerName);
    }

    return `login_throttle:${email}:${suffix}`;
  }
}
