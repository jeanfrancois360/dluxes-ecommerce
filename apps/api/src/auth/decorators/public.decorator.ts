import { SetMetadata } from '@nestjs/common';

/**
 * Public route decorator
 * Use this to mark routes that don't require authentication
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
