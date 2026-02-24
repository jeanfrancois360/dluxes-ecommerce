'use client';

/**
 * Product Form Component - Production Ready
 *
 * Fully functional form for creating and editing products with:
 * - Dynamic category fetching
 * - Auto-slug generation
 * - Comprehensive validation
 * - All product fields
 * - Excellent UX/UI
 */

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { AdminProduct } from '@/lib/api/admin';
import {
  adminCategoriesApi,
  adminStoresApi,
  type Category,
  type AdminStore,
} from '@/lib/api/admin';
import { gelatoApi } from '@/lib/api/gelato';
import { VariantManager } from './variant-manager';
import { StockLevelIndicator } from './stock-status-badge';
import { INVENTORY_DEFAULTS } from '@/lib/constants/inventory';
import { useInventorySettings } from '@/hooks/use-inventory-settings';
import {
  RealEstateFields,
  VehicleFields,
  DigitalFields,
  ServiceFields,
  RentalFields,
} from './product-type-fields';
import { PodConfigurationSection } from '../gelato/pod-configuration-section';
import { toast } from '@/lib/utils/toast';

// Dynamically import EnhancedImageUpload to avoid SSR issues with framer-motion
const EnhancedImageUpload = dynamic(() => import('../products/EnhancedImageUpload'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />,
});

interface ProductFormProps {
  product?: AdminProduct;
  onSubmit: (data: Partial<AdminProduct>) => Promise<void>;
  onCancel: () => void;
}

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  // Inventory settings for auto-SKU generation
  const { settings: inventorySettings, loading: loadingInventorySettings } = useInventorySettings();

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Stores state
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);

  // Form state
  const [formData, setFormData] = useState<any>({
    name: product?.name || '',
    slug: product?.slug || '',
    sku: product?.sku || '',
    description: product?.description || '',
    shortDescription: (product as any)?.shortDescription || '',
    price: product?.price || undefined,
    compareAtPrice: product?.compareAtPrice || undefined,
    // Extract category slug for backend (backend expects slug, not ID)
    category:
      (product?.category &&
        typeof product.category === 'object' &&
        (product.category as any).slug) ||
      (typeof product?.category === 'string' ? product.category : '') ||
      '',
    storeId: (product as any)?.storeId || (product as any)?.store?.id || '',
    images: product?.images || [],
    stock: product?.stock || undefined,
    status: product?.status || 'DRAFT',
    tags: product?.tags || [],
    productType: (product as any)?.productType || 'PHYSICAL',
    purchaseType: (product as any)?.purchaseType || 'INSTANT',
    // SEO fields
    metaTitle: (product as any)?.metaTitle || '',
    metaDescription: (product as any)?.metaDescription || '',
    seoKeywords: (product as any)?.seoKeywords || '',
    // Attributes
    badges: (product as any)?.badges || [],
    colors: (product as any)?.colors || [],
    sizes: (product as any)?.sizes || [],
    materials: (product as any)?.materials || [],
    // Additional fields
    featured: (product as any)?.featured || false,
    weight: (product as any)?.weight || undefined,
    // Real Estate Fields
    propertyType: (product as any)?.propertyType || '',
    bedrooms: (product as any)?.bedrooms || undefined,
    bathrooms: (product as any)?.bathrooms || undefined,
    squareFeet: (product as any)?.squareFeet || undefined,
    lotSize: (product as any)?.lotSize || undefined,
    yearBuilt: (product as any)?.yearBuilt || undefined,
    parkingSpaces: (product as any)?.parkingSpaces || undefined,
    amenities: (product as any)?.amenities || [],
    propertyAddress: (product as any)?.propertyAddress || '',
    propertyCity: (product as any)?.propertyCity || '',
    propertyState: (product as any)?.propertyState || '',
    propertyCountry: (product as any)?.propertyCountry || '',
    propertyZipCode: (product as any)?.propertyZipCode || '',
    propertyLatitude: (product as any)?.propertyLatitude || undefined,
    propertyLongitude: (product as any)?.propertyLongitude || undefined,
    virtualTourUrl: (product as any)?.virtualTourUrl || '',
    // Vehicle Fields
    vehicleMake: (product as any)?.vehicleMake || '',
    vehicleModel: (product as any)?.vehicleModel || '',
    vehicleYear: (product as any)?.vehicleYear || undefined,
    vehicleMileage: (product as any)?.vehicleMileage || undefined,
    vehicleVIN: (product as any)?.vehicleVIN || '',
    vehicleCondition: (product as any)?.vehicleCondition || '',
    vehicleTransmission: (product as any)?.vehicleTransmission || '',
    vehicleFuelType: (product as any)?.vehicleFuelType || '',
    vehicleBodyType: (product as any)?.vehicleBodyType || '',
    vehicleExteriorColor: (product as any)?.vehicleExteriorColor || '',
    vehicleInteriorColor: (product as any)?.vehicleInteriorColor || '',
    vehicleDrivetrain: (product as any)?.vehicleDrivetrain || '',
    vehicleEngine: (product as any)?.vehicleEngine || '',
    vehicleFeatures: (product as any)?.vehicleFeatures || [],
    vehicleHistory: (product as any)?.vehicleHistory || '',
    vehicleWarranty: (product as any)?.vehicleWarranty || '',
    vehicleTestDriveAvailable: (product as any)?.vehicleTestDriveAvailable ?? true,
    // Digital Fields
    digitalFileUrl: (product as any)?.digitalFileUrl || '',
    digitalFileSize: (product as any)?.digitalFileSize || undefined,
    digitalFileFormat: (product as any)?.digitalFileFormat || '',
    digitalFileName: (product as any)?.digitalFileName || '',
    digitalVersion: (product as any)?.digitalVersion || '',
    digitalLicenseType: (product as any)?.digitalLicenseType || '',
    digitalDownloadLimit: (product as any)?.digitalDownloadLimit || undefined,
    digitalPreviewUrl: (product as any)?.digitalPreviewUrl || '',
    digitalRequirements: (product as any)?.digitalRequirements || '',
    digitalInstructions: (product as any)?.digitalInstructions || '',
    digitalUpdatePolicy: (product as any)?.digitalUpdatePolicy || '',
    digitalSupportEmail: (product as any)?.digitalSupportEmail || '',
    // Service Fields
    serviceType: (product as any)?.serviceType || '',
    serviceDuration: (product as any)?.serviceDuration || undefined,
    serviceDurationUnit: (product as any)?.serviceDurationUnit || '',
    serviceLocation: (product as any)?.serviceLocation || '',
    serviceArea: (product as any)?.serviceArea || '',
    serviceAvailability: (product as any)?.serviceAvailability || '',
    serviceBookingRequired: (product as any)?.serviceBookingRequired ?? true,
    serviceBookingLeadTime: (product as any)?.serviceBookingLeadTime || undefined,
    serviceProviderName: (product as any)?.serviceProviderName || '',
    serviceProviderBio: (product as any)?.serviceProviderBio || '',
    serviceProviderImage: (product as any)?.serviceProviderImage || '',
    serviceProviderCredentials: (product as any)?.serviceProviderCredentials || [],
    serviceMaxClients: (product as any)?.serviceMaxClients || undefined,
    serviceCancellationPolicy: (product as any)?.serviceCancellationPolicy || '',
    serviceIncludes: (product as any)?.serviceIncludes || [],
    serviceExcludes: (product as any)?.serviceExcludes || [],
    serviceRequirements: (product as any)?.serviceRequirements || '',
    // Rental Fields
    rentalPeriodType: (product as any)?.rentalPeriodType || '',
    rentalMinPeriod: (product as any)?.rentalMinPeriod || undefined,
    rentalMaxPeriod: (product as any)?.rentalMaxPeriod || undefined,
    rentalPriceHourly: (product as any)?.rentalPriceHourly || undefined,
    rentalPriceDaily: (product as any)?.rentalPriceDaily || undefined,
    rentalPriceWeekly: (product as any)?.rentalPriceWeekly || undefined,
    rentalPriceMonthly: (product as any)?.rentalPriceMonthly || undefined,
    rentalSecurityDeposit: (product as any)?.rentalSecurityDeposit || undefined,
    rentalPickupLocation: (product as any)?.rentalPickupLocation || '',
    rentalDeliveryAvailable: (product as any)?.rentalDeliveryAvailable ?? false,
    rentalDeliveryFee: (product as any)?.rentalDeliveryFee || undefined,
    rentalLateReturnFee: (product as any)?.rentalLateReturnFee || undefined,
    rentalConditions: (product as any)?.rentalConditions || '',
    rentalAvailability: (product as any)?.rentalAvailability || '',
    rentalInsuranceRequired: (product as any)?.rentalInsuranceRequired ?? false,
    rentalInsuranceOptions: (product as any)?.rentalInsuranceOptions || '',
    rentalAgeRequirement: (product as any)?.rentalAgeRequirement || undefined,
    rentalIdRequired: (product as any)?.rentalIdRequired ?? true,
    rentalIncludes: (product as any)?.rentalIncludes || [],
    rentalExcludes: (product as any)?.rentalExcludes || [],
    rentalNotes: (product as any)?.rentalNotes || '',
    // Gelato POD fields
    fulfillmentType: (product as any)?.fulfillmentType || 'SELF_FULFILLED',
    gelatoProductUid: (product as any)?.gelatoProductUid || '',
    designFileUrl: (product as any)?.designFileUrl || '',
    baseCost: (product as any)?.baseCost || undefined,
    markupPercentage: (product as any)?.markupPercentage || undefined,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [newTag, setNewTag] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoadingCategories(true);
        const data = await adminCategoriesApi.getAll();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  // Fetch stores
  useEffect(() => {
    async function fetchStores() {
      try {
        setLoadingStores(true);
        const data = await adminStoresApi.getAll({ status: 'ACTIVE' });
        setStores(data);
      } catch (error) {
        console.error('Failed to fetch stores:', error);
      } finally {
        setLoadingStores(false);
      }
    }
    fetchStores();
  }, []);

  // Update form data when product prop changes (for edit mode)
  useEffect(() => {
    if (product) {
      const imageArray = Array.isArray(product.images) ? product.images : [];

      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        sku: product.sku || '',
        description: product.description || '',
        shortDescription: (product as any)?.shortDescription || '',
        price: product.price || undefined,
        compareAtPrice: product.compareAtPrice || undefined,
        category: product.category || '',
        storeId: (product as any)?.storeId || (product as any)?.store?.id || '',
        images: imageArray,
        stock: product.inventory || product.stock || undefined,
        status: product.status || 'DRAFT',
        tags: product.tags || [],
        productType: (product as any)?.productType || 'PHYSICAL',
        purchaseType: (product as any)?.purchaseType || 'INSTANT',
        metaTitle: (product as any)?.metaTitle || '',
        metaDescription: (product as any)?.metaDescription || '',
        seoKeywords: (product as any)?.seoKeywords || '',
        badges: (product as any)?.badges || [],
        colors: (product as any)?.colors || [],
        sizes: (product as any)?.sizes || [],
        materials: (product as any)?.materials || [],
        featured: (product as any)?.featured || false,
        weight: (product as any)?.weight || undefined,
        // Real Estate Fields
        propertyType: (product as any)?.propertyType || '',
        bedrooms: (product as any)?.bedrooms || undefined,
        bathrooms: (product as any)?.bathrooms || undefined,
        squareFeet: (product as any)?.squareFeet || undefined,
        lotSize: (product as any)?.lotSize || undefined,
        yearBuilt: (product as any)?.yearBuilt || undefined,
        parkingSpaces: (product as any)?.parkingSpaces || undefined,
        amenities: (product as any)?.amenities || [],
        propertyAddress: (product as any)?.propertyAddress || '',
        propertyCity: (product as any)?.propertyCity || '',
        propertyState: (product as any)?.propertyState || '',
        propertyCountry: (product as any)?.propertyCountry || '',
        propertyZipCode: (product as any)?.propertyZipCode || '',
        propertyLatitude: (product as any)?.propertyLatitude || undefined,
        propertyLongitude: (product as any)?.propertyLongitude || undefined,
        virtualTourUrl: (product as any)?.virtualTourUrl || '',
        // Vehicle Fields
        vehicleMake: (product as any)?.vehicleMake || '',
        vehicleModel: (product as any)?.vehicleModel || '',
        vehicleYear: (product as any)?.vehicleYear || undefined,
        vehicleMileage: (product as any)?.vehicleMileage || undefined,
        vehicleVIN: (product as any)?.vehicleVIN || '',
        vehicleCondition: (product as any)?.vehicleCondition || '',
        vehicleTransmission: (product as any)?.vehicleTransmission || '',
        vehicleFuelType: (product as any)?.vehicleFuelType || '',
        vehicleBodyType: (product as any)?.vehicleBodyType || '',
        vehicleExteriorColor: (product as any)?.vehicleExteriorColor || '',
        vehicleInteriorColor: (product as any)?.vehicleInteriorColor || '',
        vehicleDrivetrain: (product as any)?.vehicleDrivetrain || '',
        vehicleEngine: (product as any)?.vehicleEngine || '',
        vehicleFeatures: (product as any)?.vehicleFeatures || [],
        vehicleHistory: (product as any)?.vehicleHistory || '',
        vehicleWarranty: (product as any)?.vehicleWarranty || '',
        vehicleTestDriveAvailable: (product as any)?.vehicleTestDriveAvailable ?? true,
        // Digital Fields
        digitalFileUrl: (product as any)?.digitalFileUrl || '',
        digitalFileSize: (product as any)?.digitalFileSize || undefined,
        digitalFileFormat: (product as any)?.digitalFileFormat || '',
        digitalFileName: (product as any)?.digitalFileName || '',
        digitalVersion: (product as any)?.digitalVersion || '',
        digitalLicenseType: (product as any)?.digitalLicenseType || '',
        digitalDownloadLimit: (product as any)?.digitalDownloadLimit || undefined,
        digitalPreviewUrl: (product as any)?.digitalPreviewUrl || '',
        digitalRequirements: (product as any)?.digitalRequirements || '',
        digitalInstructions: (product as any)?.digitalInstructions || '',
        digitalUpdatePolicy: (product as any)?.digitalUpdatePolicy || '',
        digitalSupportEmail: (product as any)?.digitalSupportEmail || '',
        // Service Fields
        serviceType: (product as any)?.serviceType || '',
        serviceDuration: (product as any)?.serviceDuration || undefined,
        serviceDurationUnit: (product as any)?.serviceDurationUnit || '',
        serviceLocation: (product as any)?.serviceLocation || '',
        serviceArea: (product as any)?.serviceArea || '',
        serviceAvailability: (product as any)?.serviceAvailability || '',
        serviceBookingRequired: (product as any)?.serviceBookingRequired ?? true,
        serviceBookingLeadTime: (product as any)?.serviceBookingLeadTime || undefined,
        serviceProviderName: (product as any)?.serviceProviderName || '',
        serviceProviderBio: (product as any)?.serviceProviderBio || '',
        serviceProviderImage: (product as any)?.serviceProviderImage || '',
        serviceProviderCredentials: (product as any)?.serviceProviderCredentials || [],
        serviceMaxClients: (product as any)?.serviceMaxClients || undefined,
        serviceCancellationPolicy: (product as any)?.serviceCancellationPolicy || '',
        serviceIncludes: (product as any)?.serviceIncludes || [],
        serviceExcludes: (product as any)?.serviceExcludes || [],
        serviceRequirements: (product as any)?.serviceRequirements || '',
        // Rental Fields
        rentalPeriodType: (product as any)?.rentalPeriodType || '',
        rentalMinPeriod: (product as any)?.rentalMinPeriod || undefined,
        rentalMaxPeriod: (product as any)?.rentalMaxPeriod || undefined,
        rentalPriceHourly: (product as any)?.rentalPriceHourly || undefined,
        rentalPriceDaily: (product as any)?.rentalPriceDaily || undefined,
        rentalPriceWeekly: (product as any)?.rentalPriceWeekly || undefined,
        rentalPriceMonthly: (product as any)?.rentalPriceMonthly || undefined,
        rentalSecurityDeposit: (product as any)?.rentalSecurityDeposit || undefined,
        rentalPickupLocation: (product as any)?.rentalPickupLocation || '',
        rentalDeliveryAvailable: (product as any)?.rentalDeliveryAvailable ?? false,
        rentalDeliveryFee: (product as any)?.rentalDeliveryFee || undefined,
        rentalLateReturnFee: (product as any)?.rentalLateReturnFee || undefined,
        rentalConditions: (product as any)?.rentalConditions || '',
        rentalAvailability: (product as any)?.rentalAvailability || '',
        rentalInsuranceRequired: (product as any)?.rentalInsuranceRequired ?? false,
        rentalInsuranceOptions: (product as any)?.rentalInsuranceOptions || '',
        rentalAgeRequirement: (product as any)?.rentalAgeRequirement || undefined,
        rentalIdRequired: (product as any)?.rentalIdRequired ?? true,
        rentalIncludes: (product as any)?.rentalIncludes || [],
        rentalExcludes: (product as any)?.rentalExcludes || [],
        rentalNotes: (product as any)?.rentalNotes || '',
      });
    }
  }, [product]);

  // Auto-calculate price from baseCost and markup percentage (only for POD products)
  useEffect(() => {
    if (
      formData.fulfillmentType === 'GELATO_POD' &&
      formData.baseCost &&
      formData.markupPercentage !== undefined &&
      formData.markupPercentage !== null
    ) {
      const calculatedPrice = formData.baseCost * (1 + formData.markupPercentage / 100);
      // Only update if price is different (avoid infinite loop)
      if (formData.price !== calculatedPrice) {
        setFormData((prev: any) => ({
          ...prev,
          price: parseFloat(calculatedPrice.toFixed(2)),
        }));
      }
    }
  }, [formData.baseCost, formData.markupPercentage, formData.fulfillmentType]);

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      name: value,
      // Auto-generate slug if it's a new product or slug hasn't been manually edited
      slug:
        !product?.slug || prev.slug === generateSlug(prev.name) ? generateSlug(value) : prev.slug,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Required field validation
    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Product name must be at least 3 characters';
    } else if (formData.name.length > 200) {
      newErrors.name = 'Product name must be less than 200 characters';
    }

    if (!formData.slug?.trim()) {
      newErrors.slug = 'Product slug is required';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
      newErrors.slug = 'Slug must be lowercase letters, numbers, and hyphens only';
    }

    // Store is required - critical for per-seller features (POD, commissions, etc.)
    if (!formData.storeId?.trim()) {
      newErrors.storeId = 'Store selection is required - please assign this product to a seller';
    }

    // SKU is ALWAYS auto-generated - no validation needed

    // Purchase type specific validation
    if (formData.purchaseType === 'INSTANT') {
      if (formData.price === undefined || formData.price === null || formData.price === '') {
        newErrors.price = 'Price is required for instant purchase products';
      } else if (formData.price < 0) {
        newErrors.price = 'Price cannot be negative';
      } else if (formData.price > 1000000) {
        newErrors.price = 'Price seems unreasonably high';
      }

      if (formData.stock === undefined || formData.stock === null || formData.stock === '') {
        newErrors.stock = 'Stock is required for instant purchase products';
      } else if (formData.stock < 0) {
        newErrors.stock = 'Stock cannot be negative';
      }
    }

    // Compare at price validation
    if (
      formData.compareAtPrice !== undefined &&
      formData.compareAtPrice !== null &&
      formData.compareAtPrice !== ''
    ) {
      if (formData.compareAtPrice < 0) {
        newErrors.compareAtPrice = 'Compare at price cannot be negative';
      }
      if (formData.price && formData.compareAtPrice <= formData.price) {
        newErrors.compareAtPrice = 'Compare at price must be greater than regular price';
      }
    }

    // Description validation
    if (formData.description && formData.description.length > 5000) {
      newErrors.description = 'Description must be less than 5000 characters';
    }

    // Images validation - only require for new products
    // For existing products, allow saving without images (they may want to update other fields)
    if (!product && (!formData.images || formData.images.length === 0)) {
      newErrors.images = 'At least one product image is required for new products';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      document
        .getElementById(firstErrorField)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);

    try {
      // Clean up data before submission
      const submitData: any = {
        name: formData.name,
        slug: formData.slug,
        // SKU is always auto-generated - never send it from frontend
        description: formData.description,
        shortDescription: formData.shortDescription || undefined,
        storeId: formData.storeId || undefined, // Admin assigns product to store
        categoryId: formData.category || undefined,
        price:
          formData.price === '' || formData.price === undefined
            ? undefined
            : Number(formData.price),
        compareAtPrice:
          formData.compareAtPrice === '' || formData.compareAtPrice === undefined
            ? undefined
            : Number(formData.compareAtPrice),
        inventory:
          formData.stock === '' || formData.stock === undefined
            ? undefined
            : Number(formData.stock),
        weight:
          formData.weight === '' || formData.weight === undefined
            ? undefined
            : Number(formData.weight),
        status: formData.status,
        productType: formData.productType,
        purchaseType: formData.purchaseType,
        featured: formData.featured,
        metaTitle: formData.metaTitle || undefined,
        metaDescription: formData.metaDescription || undefined,
        // Convert seoKeywords string to array if needed
        seoKeywords:
          typeof formData.seoKeywords === 'string'
            ? formData.seoKeywords
                .split(',')
                .map((k: string) => k.trim())
                .filter(Boolean)
            : formData.seoKeywords || [],
        badges: formData.badges || [],
        colors: formData.colors || [],
        sizes: formData.sizes || [],
        materials: formData.materials || [],
        // Gelato POD fields
        fulfillmentType: formData.fulfillmentType || 'SELF_FULFILLED',
        gelatoProductUid: formData.gelatoProductUid || undefined,
        designFileUrl: formData.designFileUrl || undefined,
        gelatoMarkupPercent: formData.gelatoMarkupPercent,
      };

      // Add real estate fields if product type is REAL_ESTATE
      if (formData.productType === 'REAL_ESTATE') {
        Object.assign(submitData, {
          propertyType: formData.propertyType || undefined,
          bedrooms:
            formData.bedrooms !== undefined && formData.bedrooms !== ''
              ? Number(formData.bedrooms)
              : undefined,
          bathrooms:
            formData.bathrooms !== undefined && formData.bathrooms !== ''
              ? Number(formData.bathrooms)
              : undefined,
          squareFeet:
            formData.squareFeet !== undefined && formData.squareFeet !== ''
              ? Number(formData.squareFeet)
              : undefined,
          lotSize:
            formData.lotSize !== undefined && formData.lotSize !== ''
              ? Number(formData.lotSize)
              : undefined,
          yearBuilt:
            formData.yearBuilt !== undefined && formData.yearBuilt !== ''
              ? Number(formData.yearBuilt)
              : undefined,
          parkingSpaces:
            formData.parkingSpaces !== undefined && formData.parkingSpaces !== ''
              ? Number(formData.parkingSpaces)
              : undefined,
          amenities: formData.amenities || [],
          propertyAddress: formData.propertyAddress || undefined,
          propertyCity: formData.propertyCity || undefined,
          propertyState: formData.propertyState || undefined,
          propertyCountry: formData.propertyCountry || undefined,
          propertyZipCode: formData.propertyZipCode || undefined,
          propertyLatitude:
            formData.propertyLatitude !== undefined && formData.propertyLatitude !== ''
              ? Number(formData.propertyLatitude)
              : undefined,
          propertyLongitude:
            formData.propertyLongitude !== undefined && formData.propertyLongitude !== ''
              ? Number(formData.propertyLongitude)
              : undefined,
          virtualTourUrl: formData.virtualTourUrl || undefined,
        });
      }

      // Add vehicle fields if product type is VEHICLE
      if (formData.productType === 'VEHICLE') {
        Object.assign(submitData, {
          vehicleMake: formData.vehicleMake || undefined,
          vehicleModel: formData.vehicleModel || undefined,
          vehicleYear:
            formData.vehicleYear !== undefined && formData.vehicleYear !== ''
              ? Number(formData.vehicleYear)
              : undefined,
          vehicleMileage:
            formData.vehicleMileage !== undefined && formData.vehicleMileage !== ''
              ? Number(formData.vehicleMileage)
              : undefined,
          vehicleVIN: formData.vehicleVIN || undefined,
          vehicleCondition: formData.vehicleCondition || undefined,
          vehicleTransmission: formData.vehicleTransmission || undefined,
          vehicleFuelType: formData.vehicleFuelType || undefined,
          vehicleBodyType: formData.vehicleBodyType || undefined,
          vehicleExteriorColor: formData.vehicleExteriorColor || undefined,
          vehicleInteriorColor: formData.vehicleInteriorColor || undefined,
          vehicleDrivetrain: formData.vehicleDrivetrain || undefined,
          vehicleEngine: formData.vehicleEngine || undefined,
          vehicleFeatures: formData.vehicleFeatures || [],
          vehicleHistory: formData.vehicleHistory || undefined,
          vehicleWarranty: formData.vehicleWarranty || undefined,
          vehicleTestDriveAvailable: formData.vehicleTestDriveAvailable,
        });
      }

      // Add digital fields if product type is DIGITAL
      if (formData.productType === 'DIGITAL') {
        Object.assign(submitData, {
          digitalFileUrl: formData.digitalFileUrl || undefined,
          digitalFileSize:
            formData.digitalFileSize !== undefined && formData.digitalFileSize !== ''
              ? Number(formData.digitalFileSize)
              : undefined,
          digitalFileFormat: formData.digitalFileFormat || undefined,
          digitalFileName: formData.digitalFileName || undefined,
          digitalVersion: formData.digitalVersion || undefined,
          digitalLicenseType: formData.digitalLicenseType || undefined,
          digitalDownloadLimit:
            formData.digitalDownloadLimit !== undefined && formData.digitalDownloadLimit !== ''
              ? Number(formData.digitalDownloadLimit)
              : undefined,
          digitalPreviewUrl: formData.digitalPreviewUrl || undefined,
          digitalRequirements: formData.digitalRequirements || undefined,
          digitalInstructions: formData.digitalInstructions || undefined,
          digitalUpdatePolicy: formData.digitalUpdatePolicy || undefined,
          digitalSupportEmail: formData.digitalSupportEmail || undefined,
        });
      }

      // Add service fields if product type is SERVICE
      if (formData.productType === 'SERVICE') {
        Object.assign(submitData, {
          serviceType: formData.serviceType || undefined,
          serviceDuration:
            formData.serviceDuration !== undefined && formData.serviceDuration !== ''
              ? Number(formData.serviceDuration)
              : undefined,
          serviceDurationUnit: formData.serviceDurationUnit || undefined,
          serviceLocation: formData.serviceLocation || undefined,
          serviceArea: formData.serviceArea || undefined,
          serviceAvailability: formData.serviceAvailability || undefined,
          serviceBookingRequired: formData.serviceBookingRequired,
          serviceBookingLeadTime:
            formData.serviceBookingLeadTime !== undefined && formData.serviceBookingLeadTime !== ''
              ? Number(formData.serviceBookingLeadTime)
              : undefined,
          serviceProviderName: formData.serviceProviderName || undefined,
          serviceProviderBio: formData.serviceProviderBio || undefined,
          serviceProviderImage: formData.serviceProviderImage || undefined,
          serviceProviderCredentials: formData.serviceProviderCredentials || [],
          serviceMaxClients:
            formData.serviceMaxClients !== undefined && formData.serviceMaxClients !== ''
              ? Number(formData.serviceMaxClients)
              : undefined,
          serviceCancellationPolicy: formData.serviceCancellationPolicy || undefined,
          serviceIncludes: formData.serviceIncludes || [],
          serviceExcludes: formData.serviceExcludes || [],
          serviceRequirements: formData.serviceRequirements || undefined,
        });
      }

      // Add rental fields if product type is RENTAL
      if (formData.productType === 'RENTAL') {
        Object.assign(submitData, {
          rentalPeriodType: formData.rentalPeriodType || undefined,
          rentalMinPeriod:
            formData.rentalMinPeriod !== undefined && formData.rentalMinPeriod !== ''
              ? Number(formData.rentalMinPeriod)
              : undefined,
          rentalMaxPeriod:
            formData.rentalMaxPeriod !== undefined && formData.rentalMaxPeriod !== ''
              ? Number(formData.rentalMaxPeriod)
              : undefined,
          rentalPriceHourly:
            formData.rentalPriceHourly !== undefined && formData.rentalPriceHourly !== ''
              ? Number(formData.rentalPriceHourly)
              : undefined,
          rentalPriceDaily:
            formData.rentalPriceDaily !== undefined && formData.rentalPriceDaily !== ''
              ? Number(formData.rentalPriceDaily)
              : undefined,
          rentalPriceWeekly:
            formData.rentalPriceWeekly !== undefined && formData.rentalPriceWeekly !== ''
              ? Number(formData.rentalPriceWeekly)
              : undefined,
          rentalPriceMonthly:
            formData.rentalPriceMonthly !== undefined && formData.rentalPriceMonthly !== ''
              ? Number(formData.rentalPriceMonthly)
              : undefined,
          rentalSecurityDeposit:
            formData.rentalSecurityDeposit !== undefined && formData.rentalSecurityDeposit !== ''
              ? Number(formData.rentalSecurityDeposit)
              : undefined,
          rentalPickupLocation: formData.rentalPickupLocation || undefined,
          rentalDeliveryAvailable: formData.rentalDeliveryAvailable,
          rentalDeliveryFee:
            formData.rentalDeliveryFee !== undefined && formData.rentalDeliveryFee !== ''
              ? Number(formData.rentalDeliveryFee)
              : undefined,
          rentalLateReturnFee:
            formData.rentalLateReturnFee !== undefined && formData.rentalLateReturnFee !== ''
              ? Number(formData.rentalLateReturnFee)
              : undefined,
          rentalConditions: formData.rentalConditions || undefined,
          rentalAvailability: formData.rentalAvailability || undefined,
          rentalInsuranceRequired: formData.rentalInsuranceRequired,
          rentalInsuranceOptions: formData.rentalInsuranceOptions || undefined,
          rentalAgeRequirement:
            formData.rentalAgeRequirement !== undefined && formData.rentalAgeRequirement !== ''
              ? Number(formData.rentalAgeRequirement)
              : undefined,
          rentalIdRequired: formData.rentalIdRequired,
          rentalIncludes: formData.rentalIncludes || [],
          rentalExcludes: formData.rentalExcludes || [],
          rentalNotes: formData.rentalNotes || undefined,
        });
      }

      // Only include heroImage if we have images
      if (formData.images && formData.images.length > 0) {
        submitData.heroImage = formData.images[0];
        // Also include images array for separate API call
        submitData.images = formData.images;
      }

      // Gallery should be null or a proper object structure, not an empty array
      // For now, we'll omit it from the payload to avoid validation errors
      // The images are handled separately via heroImage and ProductImage relations

      await onSubmit(submitData);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleGelatoProductSelect = (productDetails: any) => {
    // Auto-populate product details from Gelato
    const markup = formData.markupPercentage !== undefined ? formData.markupPercentage : 50; // Default 50% markup
    let extractedBaseCost: number | undefined;
    let suggestedPrice: number | undefined;

    // Extract base cost from first variant
    if (productDetails.variants && productDetails.variants.length > 0) {
      const firstVariant = productDetails.variants[0];
      if (firstVariant.baseCost) {
        extractedBaseCost = parseFloat(firstVariant.baseCost.amount);
        suggestedPrice = extractedBaseCost * (1 + markup / 100);
      }
    }

    // Build auto-populated description
    let autoDescription = productDetails.description || '';
    if (productDetails.variants && productDetails.variants.length > 0) {
      autoDescription += '\n\nAvailable options:\n';
      productDetails.variants.forEach((variant: any) => {
        const options = Object.entries(variant.options || {})
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        autoDescription += `- ${variant.title || 'Variant'} (${options})\n`;
      });
    }

    setFormData((prev: any) => ({
      ...prev,
      // Only auto-fill if fields are empty
      name: prev.name || productDetails.title || '',
      description: prev.description || autoDescription.trim(),
      price: prev.price || suggestedPrice,
      baseCost: extractedBaseCost !== undefined ? extractedBaseCost : prev.baseCost,
      markupPercentage: markup,
      // Add preview image if available and no images yet
      ...(productDetails.previewUrl && (!prev.images || prev.images.length === 0)
        ? { images: [{ url: productDetails.previewUrl, alt: productDetails.title }] }
        : {}),
    }));

    toast.success('Product details auto-filled from Gelato');
  };

  // Memoized callback to prevent infinite loop in EnhancedImageUpload
  const handleImagesChange = useCallback(
    (urls: string[]) => {
      setFormData((prev: any) => ({ ...prev, images: urls }));
      // Clear error for images field
      if (errors.images) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.images;
          return newErrors;
        });
      }
    },
    [errors.images]
  );

  // Handle array field changes (colors, sizes, materials, badges)
  const handleArrayFieldAdd = (field: string, value: string) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData((prev: any) => ({
        ...prev,
        [field]: [...prev[field], value.trim()],
      }));
    }
  };

  const handleArrayFieldRemove = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].filter((item: string) => item !== value),
    }));
  };

  const handleAddTag = () => {
    if (newTag && !formData.tags?.includes(newTag)) {
      handleChange('tags', [...(formData.tags || []), newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    handleChange(
      'tags',
      formData.tags?.filter((t: string) => t !== tag)
    );
  };

  // Helper component for error display
  const ErrorMessage = ({ field }: { field: string }) =>
    errors[field] ? <p className="mt-1 text-sm text-red-600">{errors[field]}</p> : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div id="name">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter product name"
            />
            <ErrorMessage field="name" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div id="slug">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent ${errors.slug ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="product-slug"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-generated from name, or customize it
              </p>
              <ErrorMessage field="slug" />
            </div>
            {/* SKU Field - Only visible when editing (read-only) */}
            {product?.sku && (
              <div id="sku">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU{' '}
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    (Auto-generated - Read only)
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  readOnly
                  disabled
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed border-gray-300"
                />
                <p className="text-xs text-gray-500 mt-1">
                  SKU is automatically generated by the system and cannot be modified
                </p>
              </div>
            )}
            {/* Hidden note for new products */}
            {!product && (
              <div className="col-span-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>ℹ️ SKU Generation:</strong> A unique SKU will be automatically generated
                    after you create the product. Format:{' '}
                    <strong>{inventorySettings.skuPrefix}-MM-DD-XXXXXX</strong>
                  </p>
                </div>
              </div>
            )}
          </div>

          <div id="description">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter product description"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description?.length || 0}/5000 characters
            </p>
            <ErrorMessage field="description" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Description
            </label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={(e) => handleChange('shortDescription', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
              placeholder="Brief one-line description"
              maxLength={150}
            />
            <p className="text-xs text-gray-500 mt-1">
              Used in product cards and previews (max 150 characters)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.productType}
                onChange={(e) => handleChange('productType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
              >
                <option value="PHYSICAL">Physical Product</option>
                <option value="REAL_ESTATE">Real Estate</option>
                <option value="VEHICLE">Vehicle</option>
                <option value="SERVICE">Service</option>
                <option value="RENTAL">Rental</option>
                <option value="DIGITAL">Digital Product</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.purchaseType}
                onChange={(e) => handleChange('purchaseType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
              >
                <option value="INSTANT">Instant Purchase (Add to Cart)</option>
                <option value="INQUIRY">Inquiry Required (Contact Seller)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.purchaseType === 'INQUIRY'
                  ? 'Customers will contact you for pricing and details'
                  : 'Customers can purchase directly'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Real Estate Fields - Conditional based on Product Type */}
      {formData.productType === 'REAL_ESTATE' && (
        <RealEstateFields
          formData={formData}
          onChange={handleChange}
          errors={errors}
          disabled={loading}
        />
      )}

      {/* Vehicle Fields - Conditional based on Product Type */}
      {formData.productType === 'VEHICLE' && (
        <VehicleFields
          formData={formData}
          onChange={handleChange}
          errors={errors}
          disabled={loading}
        />
      )}

      {/* Digital Fields - Conditional based on Product Type */}
      {formData.productType === 'DIGITAL' && (
        <DigitalFields
          formData={formData}
          onChange={handleChange}
          errors={errors}
          disabled={loading}
        />
      )}

      {/* Service Fields - Conditional based on Product Type */}
      {formData.productType === 'SERVICE' && (
        <ServiceFields
          formData={formData}
          onChange={handleChange}
          errors={errors}
          disabled={loading}
        />
      )}

      {/* Rental Fields - Conditional based on Product Type */}
      {formData.productType === 'RENTAL' && (
        <RentalFields
          formData={formData}
          onChange={handleChange}
          errors={errors}
          disabled={loading}
        />
      )}

      {/* Pricing & Inventory */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Pricing & Inventory
          {formData.purchaseType === 'INQUIRY' && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              (Optional for inquiry products)
            </span>
          )}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div id="price">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price {formData.purchaseType === 'INSTANT' && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                required={formData.purchaseType === 'INSTANT'}
                min="0"
                step="0.01"
                value={formData.price === undefined ? '' : formData.price}
                onChange={(e) =>
                  handleChange('price', e.target.value ? parseFloat(e.target.value) : undefined)
                }
                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                placeholder={formData.purchaseType === 'INQUIRY' ? 'Optional' : '0.00'}
              />
            </div>
            {formData.purchaseType === 'INQUIRY' && (
              <p className="text-xs text-gray-500 mt-1">
                Leave empty if price varies or is negotiable
              </p>
            )}
            <ErrorMessage field="price" />
          </div>

          <div id="compareAtPrice">
            <label className="block text-sm font-medium text-gray-700 mb-1">Compare At Price</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.compareAtPrice === undefined ? '' : formData.compareAtPrice}
                onChange={(e) =>
                  handleChange(
                    'compareAtPrice',
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent ${errors.compareAtPrice ? 'border-red-500' : 'border-gray-300'}`}
                disabled={formData.purchaseType === 'INQUIRY'}
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Original price for sale items</p>
            <ErrorMessage field="compareAtPrice" />
          </div>
        </div>

        {/* POD Pricing Section - Only show for Gelato POD products */}
        {formData.fulfillmentType === 'GELATO_POD' && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-blue-900">Print-on-Demand Pricing</h4>
              {formData.gelatoProductUid && product?.id && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const result = await gelatoApi.refreshGelatoCost(product.id);
                      if (result.success) {
                        setFormData({ ...formData, baseCost: result.product.baseCost });
                        toast.success(
                          `Cost updated: $${result.costUpdate.previous?.toFixed(2) || '0.00'} → $${result.costUpdate.current.toFixed(2)}`
                        );
                      }
                    } catch (error: any) {
                      toast.error(error.message || 'Failed to refresh cost');
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh Cost
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Gelato Base Cost (Display Only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gelato Base Cost
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="text"
                    value={formData.baseCost ? formData.baseCost.toFixed(2) : '—'}
                    readOnly
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.gelatoProductUid
                    ? 'Production cost from Gelato'
                    : 'Select Gelato product first'}
                </p>
              </div>

              {/* Markup Percentage */}
              <div>
                <label
                  htmlFor="markupPercentage"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Markup Percentage
                </label>
                <div className="relative">
                  <input
                    id="markupPercentage"
                    type="number"
                    step="1"
                    min="0"
                    value={formData.markupPercentage || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        markupPercentage: parseFloat(e.target.value) || undefined,
                      })
                    }
                    className="w-full pl-4 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                    placeholder="50"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">e.g., 50% = 1.5x base cost</p>
              </div>

              {/* Calculated Price (Auto-filled) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calculated Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="text"
                    value={formData.price ? formData.price.toFixed(2) : '0.00'}
                    readOnly
                    className="w-full pl-8 pr-4 py-2 border border-green-300 rounded-lg bg-green-50 text-green-700 font-medium cursor-not-allowed"
                  />
                </div>
                {formData.baseCost && formData.price && formData.price > formData.baseCost && (
                  <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Profitable
                  </p>
                )}
                {formData.baseCost && formData.price && formData.price < formData.baseCost && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Below cost!
                  </p>
                )}
              </div>
            </div>

            {/* Pricing Info */}
            {formData.baseCost && formData.markupPercentage && (
              <div className="flex items-start gap-2 p-3 bg-white border border-blue-200 rounded-md">
                <svg
                  className="w-4 h-4 text-blue-600 shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-xs text-blue-700">
                  <strong>Profit margin:</strong> $
                  {((formData.price || 0) - formData.baseCost).toFixed(2)} per unit (
                  {formData.price &&
                    (((formData.price - formData.baseCost) / formData.baseCost) * 100).toFixed(1)}
                  % markup)
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div id="stock">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock {formData.purchaseType === 'INSTANT' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              required={formData.purchaseType === 'INSTANT'}
              min="0"
              value={formData.stock === undefined ? '' : formData.stock}
              onChange={(e) =>
                handleChange('stock', e.target.value ? parseInt(e.target.value) : undefined)
              }
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent ${errors.stock ? 'border-red-500' : 'border-gray-300'}`}
              placeholder={formData.purchaseType === 'INQUIRY' ? 'Optional' : '0'}
            />
            {formData.purchaseType === 'INQUIRY' && (
              <p className="text-xs text-gray-500 mt-1">
                Not applicable for inquiry-based products
              </p>
            )}
            <ErrorMessage field="stock" />
            {/* Stock Level Indicator - only show for existing products with stock data */}
            {product &&
              formData.stock !== undefined &&
              formData.stock !== null &&
              formData.stock !== '' &&
              formData.purchaseType !== 'INQUIRY' && (
                <div className="mt-3">
                  <StockLevelIndicator stock={Number(formData.stock)} />
                </div>
              )}
          </div>
        </div>

        {formData.purchaseType === 'INQUIRY' && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">Inquiry Product</h4>
                <p className="text-xs text-blue-800">
                  This product will display "Contact for Price" instead of a price. Customers will
                  submit an inquiry form to contact you about pricing and availability.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Organization */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Store Selector */}
          <div id="storeId">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.storeId}
              onChange={(e) => handleChange('storeId', e.target.value)}
              disabled={loadingStores}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent disabled:bg-gray-100 ${errors.storeId ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">{loadingStores ? 'Loading...' : 'Select store'}</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name} ({store.user.email}) - {store._count.products} products
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Assign this product to a specific seller's store (required for POD, commissions, and
              payouts)
            </p>
            <ErrorMessage field="storeId" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              disabled={loadingCategories}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">{loadingCategories ? 'Loading...' : 'Select category'}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
              placeholder="Add tag"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags?.map((tag: string) => (
              <span
                key={tag}
                className="px-3 py-1 bg-[#CBB57B] text-black rounded-full text-sm flex items-center gap-2"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Featured toggle */}
        <div className="mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => handleChange('featured', e.target.checked)}
              className="w-4 h-4 text-[#CBB57B] border-gray-300 rounded focus:ring-[#CBB57B]"
            />
            <span className="text-sm font-medium text-gray-700">Feature this product</span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Featured products appear prominently on the homepage
          </p>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-lg shadow p-6" id="images">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Product Images {!product && <span className="text-red-500">*</span>}
        </h2>

        <EnhancedImageUpload
          onImagesChange={handleImagesChange}
          initialImages={formData.images || []}
          maxImages={10}
          folder="products"
        />

        {errors.images && <p className="mt-2 text-sm text-red-600">{errors.images}</p>}
      </div>

      {/* Product Attributes */}
      {formData.productType === 'PHYSICAL' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Product Attributes</h2>

          <div className="space-y-6">
            {/* Available Colors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Colors
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  id="colorInput"
                  placeholder="Enter color name"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.currentTarget;
                      handleArrayFieldAdd('colors', input.value);
                      input.value = '';
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('colorInput') as HTMLInputElement;
                    if (input) {
                      handleArrayFieldAdd('colors', input.value);
                      input.value = '';
                    }
                  }}
                  className="px-4 py-2 bg-[#CBB57B] text-black font-medium rounded-lg hover:bg-[#a89158] transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.colors.map((color: string, index: number) => (
                  <span
                    key={`color-${index}-${color}`}
                    className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm flex items-center gap-2"
                  >
                    {color}
                    <button
                      type="button"
                      onClick={() => handleArrayFieldRemove('colors', color)}
                      className="hover:text-red-600 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Available Sizes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Sizes
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  id="sizeInput"
                  placeholder="Enter size (e.g., S, M, L)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.currentTarget;
                      handleArrayFieldAdd('sizes', input.value);
                      input.value = '';
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('sizeInput') as HTMLInputElement;
                    if (input) {
                      handleArrayFieldAdd('sizes', input.value);
                      input.value = '';
                    }
                  }}
                  className="px-4 py-2 bg-[#CBB57B] text-black font-medium rounded-lg hover:bg-[#a89158] transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.sizes.map((size: string, index: number) => (
                  <span
                    key={`size-${index}-${size}`}
                    className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm flex items-center gap-2"
                  >
                    {size}
                    <button
                      type="button"
                      onClick={() => handleArrayFieldRemove('sizes', size)}
                      className="hover:text-red-600 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Materials */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Materials</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  id="materialInput"
                  placeholder="Enter material"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.currentTarget;
                      handleArrayFieldAdd('materials', input.value);
                      input.value = '';
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('materialInput') as HTMLInputElement;
                    if (input) {
                      handleArrayFieldAdd('materials', input.value);
                      input.value = '';
                    }
                  }}
                  className="px-4 py-2 bg-[#CBB57B] text-black font-medium rounded-lg hover:bg-[#a89158] transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.materials.map((material: string, index: number) => (
                  <span
                    key={`material-${index}-${material}`}
                    className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm flex items-center gap-2"
                  >
                    {material}
                    <button
                      type="button"
                      onClick={() => handleArrayFieldRemove('materials', material)}
                      className="hover:text-red-600 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Product Badges */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Badges</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  id="badgeInput"
                  placeholder="Enter badge (e.g., New, Sale)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.currentTarget;
                      handleArrayFieldAdd('badges', input.value);
                      input.value = '';
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('badgeInput') as HTMLInputElement;
                    if (input) {
                      handleArrayFieldAdd('badges', input.value);
                      input.value = '';
                    }
                  }}
                  className="px-4 py-2 bg-[#CBB57B] text-black font-medium rounded-lg hover:bg-[#a89158] transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.badges.map((badge: any, index: number) => {
                  const badgeValue =
                    typeof badge === 'string' ? badge : badge?.name || String(badge);
                  return (
                    <span
                      key={`badge-${index}-${badgeValue}`}
                      className="px-3 py-1 bg-[#CBB57B] text-black rounded-full text-sm flex items-center gap-2"
                    >
                      {badgeValue}
                      <button
                        type="button"
                        onClick={() => handleArrayFieldRemove('badges', badge)}
                        className="hover:text-red-600 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gelato POD Configuration */}
      {product?.id ? (
        <PodConfigurationSection
          fulfillmentType={formData.fulfillmentType}
          gelatoProductUid={formData.gelatoProductUid}
          designFileUrl={formData.designFileUrl}
          gelatoMarkupPercent={formData.markupPercentage}
          productImages={formData.images || []}
          onChange={handleChange}
          onGelatoProductSelect={handleGelatoProductSelect}
          disabled={loading}
        />
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg
                  className="w-10 h-10 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Print-on-Demand with Gelato</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Create custom products (t-shirts, mugs, posters, etc.) that are printed and
                  shipped by Gelato when customers order.
                </p>
                <div className="bg-white/60 rounded-md p-3">
                  <p className="text-xs text-blue-600">
                    <strong>To enable POD:</strong> Save this product first with basic details, then
                    return to configure Gelato settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Variants */}
      <VariantManager productId={product?.id} productPrice={formData.price} />

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600">
          {Object.keys(errors).length > 0 && (
            <p className="text-red-600">
              Please fix {Object.keys(errors).length} error
              {Object.keys(errors).length > 1 ? 's' : ''} above
            </p>
          )}
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#CBB57B] text-black font-medium rounded-lg hover:bg-[#a89158] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </div>
    </form>
  );
}
