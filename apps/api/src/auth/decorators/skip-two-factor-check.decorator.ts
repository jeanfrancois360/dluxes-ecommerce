import { SetMetadata } from '@nestjs/common';

export const SKIP_TWO_FACTOR_CHECK_KEY = 'skipTwoFactorCheck';

/**
 * Mark a route or controller to bypass the TwoFactorEnforcementGuard.
 * Use this on 2FA setup endpoints and auth endpoints that must remain
 * accessible before 2FA is configured.
 */
export const SkipTwoFactorCheck = () => SetMetadata(SKIP_TWO_FACTOR_CHECK_KEY, true);
