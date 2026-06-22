import { UserRole } from '@prisma/client';

/**
 * Roles for which 2FA is supported and enforced.
 * BUYER and CUSTOMER are explicitly excluded — they must never be enrolled.
 *
 * Single source of truth used by:
 *  - TwoFactorEnforcementGuard  (blocks unprotected API calls after grace expires)
 *  - AuthCoreService            (auto-enables email OTP on registration)
 *  - TwoFactorService           (rejects setup/enable calls from ineligible roles)
 *  - EnhancedAuthController     (route-level RolesGuard)
 */
export const TWO_FA_ALLOWED_ROLES: UserRole[] = [
  UserRole.SELLER,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.DELIVERY_PARTNER,
];

/** Set for O(1) membership checks in guards and services. */
export const TWO_FA_ALLOWED_ROLES_SET = new Set<string>(TWO_FA_ALLOWED_ROLES);
