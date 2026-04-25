import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { assertOrderAccess, OrderAccessMode } from './order-access.helper';

export const ORDER_ACCESS_KEY = 'orderAccess';
export const ORDER_ID_PARAM_KEY = 'orderIdParam';

export const CheckOrderOwnership = (
  paramName: string = 'orderId',
  mode: OrderAccessMode = 'any'
) => {
  return (target: any, key?: any, descriptor?: any) => {
    SetMetadata(ORDER_ACCESS_KEY, mode)(target, key, descriptor);
    SetMetadata(ORDER_ID_PARAM_KEY, paramName)(target, key, descriptor);
    return descriptor;
  };
};

@Injectable()
export class OrderOwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const mode = this.reflector.get<OrderAccessMode>(ORDER_ACCESS_KEY, context.getHandler());

    if (!mode) return true;

    const paramName =
      this.reflector.get<string>(ORDER_ID_PARAM_KEY, context.getHandler()) || 'orderId';

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orderId = request.params[paramName];

    if (!user) return false;
    if (!orderId) return false;

    await assertOrderAccess(this.prisma, orderId, user, mode);
    return true;
  }
}
