/**
 * Seller Notification Email Templates
 *
 * This module exports all seller-related email templates for the monthly credit system.
 * Use these templates with the EmailService to send notifications to sellers.
 *
 * @module seller-notifications
 */

export { sellerApprovedTemplate } from './seller-approved.template';
export { sellerRejectedTemplate } from './seller-rejected.template';
export { sellerSuspendedTemplate } from './seller-suspended.template';
export { creditsPurchasedTemplate } from './credits-purchased.template';
export { creditsLowWarningTemplate } from './credits-low-warning.template';
export { creditsDepletedTemplate } from './credits-depleted.template';
export { gracePeriodEndingTemplate } from './grace-period-ending.template';
