export * from './client';
export * from './auth';
export * from './products';
export * from './cart';
export * from './orders';
export * from './admin';
export * from './addresses';
export * from './subscription';
export * from './credits';

// Advertisement module exports (with explicit naming to avoid conflicts)
export {
  advertisementsApi,
  type Advertisement as AdvertisementDetail,
  type AdPlacement,
  type AdPricingModel,
  type AdStatus,
  type AdPaymentStatus,
  type CreateAdvertisementDto,
  type UpdateAdvertisementDto,
  type AdAnalytics,
  type AdAnalyticsSummary,
} from './advertisements';

export {
  advertisementPlansApi,
  type AdvertisementPlan,
  type AdPlanSubscription,
  type SubscribeToPlanDto,
} from './advertisement-plans';
