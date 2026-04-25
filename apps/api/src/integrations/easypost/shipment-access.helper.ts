import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../../common/authorization/order-access.helper';

/**
 * Verifies that the given user may act on the given shipment.
 *
 * Access rules:
 *   - ADMIN and SUPER_ADMIN: always allowed
 *   - Seller: allowed if shipment.sellerId === user.id
 *   - Everyone else: denied
 *
 * Throws ForbiddenException if user lacks access.
 *
 * Note: This helper is intentionally separate from assertOrderAccess because
 * shipments are owned by sellers (via sellerId), not by buyer/seller pairs
 * like orders. The two helpers share the AuthenticatedUser type.
 */
export function assertShipmentAccess(
  shipment: { sellerId: string },
  user: AuthenticatedUser
): void {
  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
    return;
  }
  const userId = user.id ?? user.userId;
  if (!userId) {
    throw new ForbiddenException('Invalid authentication context');
  }
  if (shipment.sellerId !== userId) {
    throw new ForbiddenException('You do not have access to this shipment');
  }
}
