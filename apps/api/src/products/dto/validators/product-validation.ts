import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PurchaseType } from '@prisma/client';

/**
 * Custom validator to ensure INSTANT purchase type products have a price
 */
@ValidatorConstraint({ name: 'requiresPriceForInstant', async: false })
export class RequiresPriceForInstantConstraint implements ValidatorConstraintInterface {
  validate(price: any, args: ValidationArguments) {
    const object = args.object as any;
    const purchaseType = object.purchaseType || PurchaseType.INSTANT;

    // If purchase type is INSTANT, price is required
    if (purchaseType === PurchaseType.INSTANT) {
      return price !== undefined && price !== null && price >= 0;
    }

    // For INQUIRY type, price is optional
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Price is required for INSTANT purchase type products';
  }
}

export function RequiresPriceForInstant(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: RequiresPriceForInstantConstraint,
    });
  };
}

/**
 * Custom validator to ensure INSTANT purchase type products have inventory
 */
@ValidatorConstraint({ name: 'requiresInventoryForInstant', async: false })
export class RequiresInventoryForInstantConstraint implements ValidatorConstraintInterface {
  validate(inventory: any, args: ValidationArguments) {
    const object = args.object as any;
    const purchaseType = object.purchaseType || PurchaseType.INSTANT;

    // If purchase type is INSTANT, inventory is required
    if (purchaseType === PurchaseType.INSTANT) {
      return inventory !== undefined && inventory !== null && inventory >= 0;
    }

    // For INQUIRY type, inventory is optional
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Inventory is required for INSTANT purchase type products';
  }
}

export function RequiresInventoryForInstant(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: RequiresInventoryForInstantConstraint,
    });
  };
}
