import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT Auth Guard
 * Allows unauthenticated access but still attaches user if token is valid
 * Useful for endpoints that show different content to logged-in vs anonymous users
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // Don't throw error if authentication fails
    // Just return null user so the request can continue
    return user || null;
  }
}
