'use client';

/**
 * Seller Product Form Component - Production Ready
 *
 * Comprehensive form for creating and editing products with:
 * - Dynamic category fetching
 * - Auto-slug generation
 * - Product type-specific fields (Real Estate, Vehicle, Digital, Service, Rental)
 * - Image upload with drag-and-drop
 * - Variant management
 * - Comprehensive validation
 * - Professional UX/UI matching admin design
 */

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AlertTriangle, Lock, ArrowRight, Crown } from 'lucide-react';
import { categoriesAPI, type Category } from '@/lib/api/categories';
import { VariantManager } from '../admin/variant-manager';
import { StockLevelIndicator } from '../admin/stock-status-badge';
import {
  RealEstateFields,
  VehicleFields,
  DigitalFields,
  ServiceFields,
  RentalFields,
} from '../admin/product-type-fields';
import { INVENTORY_DEFAULTS } from '@/lib/constants/inventory';
import { useCanListProductType } from '@/hooks/use-subscription';

// Product types that require a subscription
const SUBSCRIPTION_REQUIRED_TYPES = ['SERVICE', 'RENTAL', 'VEHICLE', 'REAL_ESTATE'];

// Human-readable labels for product types
const PRODUCT_TYPE_LABELS: Record<string, string> = {
  PHYSICAL: 'Physical Products',
  DIGITAL: 'Digital Products',
  SERVICE: 'Services',
  RENTAL: 'Rentals',
  VEHICLE: 'Vehicles',
  REAL_ESTATE: 'Real Estate',
};

// Dynamically import EnhancedImageUpload to avoid SSR issues with framer-motion
const EnhancedImageUpload = dynamic(() => import('../products/EnhancedImageUpload'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />,
});

// Product interface for seller
interface ProductData {
  name: string;
  slug: string;
  sku?: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  categoryId: string;
  images?: string[];
  inventory?: number;
  status: string;
  tags?: string[];
  productType?: string;
  purchaseType?: string;
  metaTitle?: string;
  metaDescription?: string;
  seoKeywords?: string;
  badges?: string[];
  colors?: string[];
  sizes?: string[];
  materials?: string[];
  weight?: number;
  [key: string]: any;
}

interface ProductFormProps {
  initialData?: any;
  isEdit?: boolean;
  onSubmit: (data: Partial<ProductData>) => Promise<void>;
  onCancel: () => void;
}

// Product Type Selector with subscription check
function ProductTypeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { canList, reasons, isLoading } = useCanListProductType(value);
  const requiresSubscription = SUBSCRIPTION_REQUIRED_TYPES.includes(value);
  const typeLabel = PRODUCT_TYPE_LABELS[value] || value;

  // Determine the specific reason for restriction
  const getRestrictionInfo = () => {
    if (!requiresSubscription) return null;
    if (isLoading) return null;
    if (canList) return null;

    // Check for credits (API returns hasCredits, hook default uses hasMonthlyCredits)
    const hasCredits = (reasons as any).hasCredits ?? (reasons as any).hasMonthlyCredits ?? true;
    if (!hasCredits) {
      return {
        title: 'Subscription Required',
        message: `You need an active subscription to list ${typeLabel}. Subscribe to start listing this type of product.`,
        actionLabel: 'Get Subscription',
        actionUrl: '/seller/selling-credits',
      };
    }
    if (!reasons.productTypeAllowed) {
      return {
        title: 'Plan Upgrade Required',
        message: `${typeLabel} listings are not included in your current plan. Upgrade to a plan that supports this product type.`,
        actionLabel: 'View Plans',
        actionUrl: '/seller/subscription/plans',
      };
    }
    if (!reasons.meetsTierRequirement) {
      return {
        title: 'Higher Tier Required',
        message: `${typeLabel} require a higher subscription tier. Upgrade your plan to unlock this feature.`,
        actionLabel: 'Upgrade Plan',
        actionUrl: '/seller/subscription/plans',
      };
    }
    if (!reasons.hasListingCapacity) {
      return {
        title: 'Listing Limit Reached',
        message:
          'You have reached the maximum number of listings for your plan. Upgrade to add more products.',
        actionLabel: 'Upgrade Plan',
        actionUrl: '/seller/subscription/plans',
      };
    }
    return null;
  };

  const restriction = getRestrictionInfo();

  return (
    <div>
      <label htmlFor="productType" className="block text-sm font-medium text-gray-700 mb-2">
        Product Type <span className="text-red-500">*</span>
      </label>
      <select
        id="productType"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent ${
          restriction ? 'border-amber-300 bg-amber-50' : 'border-gray-300'
        }`}
      >
        <option value="PHYSICAL">Physical Product</option>
        <option value="DIGITAL">Digital Product</option>
        <option value="SERVICE">Service (Subscription Required)</option>
        <option value="REAL_ESTATE">Real Estate (Subscription Required)</option>
        <option value="VEHICLE">Vehicle (Subscription Required)</option>
        <option value="RENTAL">Rental (Subscription Required)</option>
      </select>

      {/* Show loading state while checking */}
      {requiresSubscription && isLoading && (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-[#CBB57B] rounded-full animate-spin" />
          Checking subscription status...
        </div>
      )}

      {/* Show restriction warning */}
      {restriction && (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-amber-900 flex items-center gap-2">
                {restriction.title}
              </h4>
              <p className="text-sm text-amber-700 mt-1">{restriction.message}</p>
              <Link
                href={restriction.actionUrl}
                className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-[#CBB57B] text-black text-sm font-semibold rounded-lg hover:bg-[#b9a369] transition-colors"
              >
                <Crown className="w-4 h-4" />
                {restriction.actionLabel}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Show success state for allowed subscription types */}
      {requiresSubscription && !isLoading && canList && (
        <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Your subscription includes {typeLabel} listings
        </div>
      )}

      {!requiresSubscription && (
        <p className="mt-1 text-sm text-gray-500">Select the type of product you're selling</p>
      )}
    </div>
  );
}

export default function ProductForm({
  initialData,
  isEdit = false,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const product = initialData;

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form state
  const [formData, setFormData] = useState<any>(() => {
    // Transform backend image format to frontend format on initial load
    let initialImages: string[] = [];
    if (product) {
      // Priority 1: ProductImage relation (array of image objects)
      if (Array.isArray(product.images) && product.images.length > 0) {
        initialImages = product.images.map((img: any) => img.url);
      }
      // Priority 2: heroImage field (simple string)
      else if ((product as any).heroImage) {
        initialImages = [(product as any).heroImage];
      }
      // Priority 3: gallery JSON field
      else if ((product as any).gallery && Array.isArray((product as any).gallery)) {
        initialImages = (product as any).gallery.map((item: any) => item.url || item);
      }
    }

    return {
      name: product?.name || '',
      slug: product?.slug || '',
      sku: product?.sku || '',
      description: product?.description || '',
      shortDescription: (product as any)?.shortDescription || '',
      price: product?.price || undefined,
      compareAtPrice: product?.compareAtPrice || undefined,
      // Extract category slug for backend (backend expects slug, not ID)
      categoryId:
        (product?.category &&
          typeof product.category === 'object' &&
          (product.category as any).slug) ||
        (typeof product?.category === 'string' ? product.category : '') ||
        '',
      images: initialImages,
      inventory: product?.inventory || product?.stock || undefined,
      status: product?.status || 'DRAFT',
      tags: Array.isArray(product?.tags)
        ? product.tags.map((tag: any) => (typeof tag === 'string' ? tag : tag.name)).filter(Boolean)
        : [],
      productType: (product as any)?.productType || 'PHYSICAL',
      purchaseType: (product as any)?.purchaseType || 'INSTANT',
      // SEO fields
      metaTitle: (product as any)?.metaTitle || '',
      metaDescription: (product as any)?.metaDescription || '',
      seoKeywords: Array.isArray((product as any)?.seoKeywords)
        ? (product as any).seoKeywords.join(', ')
        : (product as any)?.seoKeywords || '',
      // Attributes (ensure they're string arrays)
      badges: Array.isArray((product as any)?.badges)
        ? (product as any).badges
            .map((b: any) => (typeof b === 'string' ? b : b.name || String(b)))
            .filter(Boolean)
        : [],
      colors: Array.isArray((product as any)?.colors)
        ? (product as any).colors.filter(Boolean)
        : [],
      sizes: Array.isArray((product as any)?.sizes) ? (product as any).sizes.filter(Boolean) : [],
      materials: Array.isArray((product as any)?.materials)
        ? (product as any).materials.filter(Boolean)
        : [],
      weight: (product as any)?.weight || undefined,
      // Real Estate Fields
      propertyType: (product as any)?.propertyType || '',
      bedrooms: (product as any)?.bedrooms || undefined,
      bathrooms: (product as any)?.bathrooms || undefined,
      squareFeet: (product as any)?.squareFeet || undefined,
      lotSize: (product as any)?.lotSize || undefined,
      yearBuilt: (product as any)?.yearBuilt || undefined,
      parkingSpaces: (product as any)?.parkingSpaces || undefined,
      amenities: Array.isArray((product as any)?.amenities)
        ? (product as any).amenities
            .map((a: any) => (typeof a === 'string' ? a : a.name || String(a)))
            .filter(Boolean)
        : [],
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
      vehicleFeatures: Array.isArray((product as any)?.vehicleFeatures)
        ? (product as any).vehicleFeatures
            .map((f: any) => (typeof f === 'string' ? f : f.name || String(f)))
            .filter(Boolean)
        : [],
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
    };
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [newTag, setNewTag] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoadingCategories(true);
        const data = await categoriesAPI.getAll();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  // Update form data when product prop changes (for edit mode)
  useEffect(() => {
    if (product) {
      // Transform backend image format to frontend format (images array)
      let imageArray: string[] = [];

      // Priority 1: ProductImage relation (array of image objects)
      if (Array.isArray(product.images) && product.images.length > 0) {
        imageArray = product.images.map((img: any) => img.url);
      }
      // Priority 2: heroImage field (simple string)
      else if ((product as any).heroImage) {
        imageArray = [(product as any).heroImage];
      }
      // Priority 3: gallery JSON field
      else if ((product as any).gallery && Array.isArray((product as any).gallery)) {
        imageArray = (product as any).gallery.map((item: any) => item.url || item);
      }

      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        sku: product.sku || '',
        description: product.description || '',
        shortDescription: (product as any)?.shortDescription || '',
        price: product.price || undefined,
        compareAtPrice: product.compareAtPrice || undefined,
        // Extract category slug for backend (backend expects slug, not ID)
        categoryId:
          (product.category &&
            typeof product.category === 'object' &&
            (product.category as any).slug) ||
          (typeof product.category === 'string' ? product.category : '') ||
          '',
        images: imageArray,
        inventory: product.inventory || product.stock || undefined,
        status: product.status || 'DRAFT',
        tags: product.tags || [],
        productType: (product as any)?.productType || 'PHYSICAL',
        purchaseType: (product as any)?.purchaseType || 'INSTANT',
        metaTitle: (product as any)?.metaTitle || '',
        metaDescription: (product as any)?.metaDescription || '',
        seoKeywords: Array.isArray((product as any)?.seoKeywords)
          ? (product as any).seoKeywords.join(', ')
          : (product as any)?.seoKeywords || '',
        badges: (product as any)?.badges || [],
        colors: (product as any)?.colors || [],
        sizes: (product as any)?.sizes || [],
        materials: (product as any)?.materials || [],
        weight: (product as any)?.weight || undefined,
        // Product-type specific fields...
        propertyType: (product as any)?.propertyType || '',
        bedrooms: (product as any)?.bedrooms || undefined,
        bathrooms: (product as any)?.bathrooms || undefined,
        squareFeet: (product as any)?.squareFeet || undefined,
        lotSize: (product as any)?.lotSize || undefined,
        yearBuilt: (product as any)?.yearBuilt || undefined,
        parkingSpaces: (product as any)?.parkingSpaces || undefined,
        amenities: Array.isArray((product as any)?.amenities)
          ? (product as any).amenities
              .map((a: any) => (typeof a === 'string' ? a : a.name || String(a)))
              .filter(Boolean)
          : [],
        propertyAddress: (product as any)?.propertyAddress || '',
        propertyCity: (product as any)?.propertyCity || '',
        propertyState: (product as any)?.propertyState || '',
        propertyCountry: (product as any)?.propertyCountry || '',
        propertyZipCode: (product as any)?.propertyZipCode || '',
        propertyLatitude: (product as any)?.propertyLatitude || undefined,
        propertyLongitude: (product as any)?.propertyLongitude || undefined,
        virtualTourUrl: (product as any)?.virtualTourUrl || '',
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
        vehicleFeatures: Array.isArray((product as any)?.vehicleFeatures)
          ? (product as any).vehicleFeatures
              .map((f: any) => (typeof f === 'string' ? f : f.name || String(f)))
              .filter(Boolean)
          : [],
        vehicleHistory: (product as any)?.vehicleHistory || '',
        vehicleWarranty: (product as any)?.vehicleWarranty || '',
        vehicleTestDriveAvailable: (product as any)?.vehicleTestDriveAvailable ?? true,
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

  // Memoized callback to prevent infinite loop in EnhancedImageUpload
  const handleImagesChange = useCallback((urls: string[]) => {
    setFormData((prev: any) => ({ ...prev, images: urls }));
  }, []);

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

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.categoryId?.trim()) {
      newErrors.categoryId = 'Please select a category';
    }

    // Purchase type specific validation
    if (formData.purchaseType === 'INSTANT' || !formData.purchaseType) {
      if (formData.price === undefined || formData.price === null || formData.price === '') {
        newErrors.price = 'Price is required';
      } else if (formData.price < 0) {
        newErrors.price = 'Price cannot be negative';
      } else if (formData.price > 1000000) {
        newErrors.price = 'Price seems unreasonably high';
      }

      if (formData.productType === 'PHYSICAL') {
        if (
          formData.inventory === undefined ||
          formData.inventory === null ||
          formData.inventory === ''
        ) {
          newErrors.inventory = 'Stock/inventory is required for physical products';
        } else if (formData.inventory < 0) {
          newErrors.inventory = 'Stock cannot be negative';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.getElementById(firstErrorField);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    try {
      // Prepare data for API - clean up fields that don't exist in backend schema
      const dataToSubmit = { ...formData };

      // Remove fields that don't exist in backend or are handled separately
      delete dataToSubmit.tags; // Tags not supported in current schema
      delete dataToSubmit.sku; // SKU is auto-generated by backend, ignore frontend value

      // Convert seoKeywords from comma-separated string to array
      if (typeof dataToSubmit.seoKeywords === 'string') {
        dataToSubmit.seoKeywords = dataToSubmit.seoKeywords
          .split(',')
          .map((k: string) => k.trim())
          .filter((k: string) => k.length > 0);
      }

      // Pass the full data including images array - parent component will handle images separately
      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle tag management
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev: any) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: any) => {
    const tagValue = typeof tagToRemove === 'string' ? tagToRemove : tagToRemove?.name;
    setFormData((prev: any) => ({
      ...prev,
      tags: prev.tags.filter((tag: any) => {
        const currentTagValue = typeof tag === 'string' ? tag : tag?.name;
        return currentTagValue !== tagValue;
      }),
    }));
  };

  // Handle array field changes (badges, colors, sizes, materials)
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h3>

        <div className="space-y-4">
          {/* Product Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter product name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Product Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
              Product Slug <span className="text-red-500">*</span>
            </label>
            <input
              id="slug"
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent ${
                errors.slug ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="product-slug"
            />
            {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug}</p>}
            <p className="mt-1 text-sm text-gray-500">
              URL-friendly version of the name. Auto-generated from product name.
            </p>
          </div>

          {/* SKU - Auto-generated (Read-only info) */}
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
              SKU (Stock Keeping Unit)
            </label>
            <div className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-gray-400"
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
              <span className="font-medium">Auto-generated upon creation</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              SKU will be automatically generated in format: NEXTPIK-MM-DD-XXXX (e.g.,
              NEXTPIK-02-09-0001)
            </p>
          </div>

          {/* Product Type */}
          <ProductTypeSelector
            value={formData.productType}
            onChange={(value) => setFormData({ ...formData, productType: value })}
          />

          {/* Purchase Type */}
          <div>
            <label htmlFor="purchaseType" className="block text-sm font-medium text-gray-700 mb-2">
              Purchase Type <span className="text-red-500">*</span>
            </label>
            <select
              id="purchaseType"
              value={formData.purchaseType}
              onChange={(e) => setFormData({ ...formData, purchaseType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
            >
              <option value="INSTANT">Instant Purchase</option>
              <option value="INQUIRY">Inquiry Only</option>
              <option value="AUCTION">Auction</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            {loadingCategories ? (
              <div className="px-4 py-2 text-gray-500">Loading categories...</div>
            ) : (
              <select
                id="categoryId"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent ${
                  errors.categoryId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
            {errors.categoryId && <p className="mt-1 text-sm text-red-500">{errors.categoryId}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Detailed product description..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Short Description */}
          <div>
            <label
              htmlFor="shortDescription"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Short Description
            </label>
            <textarea
              id="shortDescription"
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
              placeholder="Brief summary for search results and listings..."
              maxLength={160}
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.shortDescription.length}/160 characters
            </p>
          </div>
        </div>
      </div>

      {/* Pricing & Inventory */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Pricing & Inventory</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                id="price"
                type="number"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) =>
                  setFormData({ ...formData, price: parseFloat(e.target.value) || undefined })
                }
                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
          </div>

          {/* Compare At Price */}
          <div>
            <label
              htmlFor="compareAtPrice"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Compare At Price
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                id="compareAtPrice"
                type="number"
                step="0.01"
                value={formData.compareAtPrice || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    compareAtPrice: parseFloat(e.target.value) || undefined,
                  })
                }
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">Original price to show savings</p>
          </div>

          {/* Stock/Inventory */}
          {formData.productType === 'PHYSICAL' && (
            <div>
              <label htmlFor="inventory" className="block text-sm font-medium text-gray-700 mb-2">
                Stock/Inventory <span className="text-red-500">*</span>
              </label>
              <input
                id="inventory"
                type="number"
                value={formData.inventory || ''}
                onChange={(e) =>
                  setFormData({ ...formData, inventory: parseInt(e.target.value) || undefined })
                }
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent ${
                  errors.inventory ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.inventory && <p className="mt-1 text-sm text-red-500">{errors.inventory}</p>}
              {formData.inventory !== undefined &&
                formData.inventory !== null &&
                formData.inventory !== '' && (
                  <div className="mt-2">
                    <StockLevelIndicator
                      stock={formData.inventory}
                      lowStockThreshold={INVENTORY_DEFAULTS.LOW_STOCK_THRESHOLD}
                    />
                  </div>
                )}
            </div>
          )}

          {/* Weight */}
          {formData.productType === 'PHYSICAL' && (
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg)
              </label>
              <input
                id="weight"
                type="number"
                step="0.01"
                value={formData.weight || ''}
                onChange={(e) =>
                  setFormData({ ...formData, weight: parseFloat(e.target.value) || undefined })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          )}
        </div>
      </div>

      {/* Product Type-Specific Fields */}
      {formData.productType === 'REAL_ESTATE' && (
        <RealEstateFields
          formData={formData}
          onChange={(field, value) => setFormData({ ...formData, [field]: value })}
          errors={errors}
        />
      )}
      {formData.productType === 'VEHICLE' && (
        <VehicleFields
          formData={formData}
          onChange={(field, value) => setFormData({ ...formData, [field]: value })}
          errors={errors}
        />
      )}
      {formData.productType === 'DIGITAL' && (
        <DigitalFields
          formData={formData}
          onChange={(field, value) => setFormData({ ...formData, [field]: value })}
          errors={errors}
        />
      )}
      {formData.productType === 'SERVICE' && (
        <ServiceFields
          formData={formData}
          onChange={(field, value) => setFormData({ ...formData, [field]: value })}
          errors={errors}
        />
      )}
      {formData.productType === 'RENTAL' && (
        <RentalFields
          formData={formData}
          onChange={(field, value) => setFormData({ ...formData, [field]: value })}
          errors={errors}
        />
      )}

      {/* Images */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Product Images</h3>

        <EnhancedImageUpload
          onImagesChange={handleImagesChange}
          initialImages={formData.images}
          maxImages={10}
          folder="products"
        />
      </div>

      {/* Attributes */}
      {formData.productType === 'PHYSICAL' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Product Attributes</h3>

          <div className="space-y-6">
            {/* Colors */}
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
                {formData.colors.map((color: string) => (
                  <span
                    key={color}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {color}
                    <button
                      type="button"
                      onClick={() => handleArrayFieldRemove('colors', color)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Sizes */}
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
                {formData.sizes.map((size: string) => (
                  <span
                    key={size}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {size}
                    <button
                      type="button"
                      onClick={() => handleArrayFieldRemove('sizes', size)}
                      className="text-gray-500 hover:text-red-500"
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
                {formData.materials.map((material: string) => (
                  <span
                    key={material}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {material}
                    <button
                      type="button"
                      onClick={() => handleArrayFieldRemove('materials', material)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Badges */}
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
                      className="inline-flex items-center gap-1 px-3 py-1 bg-[#f5f0e8] text-[#8b7a5e] rounded-full text-sm font-medium"
                    >
                      {badgeValue}
                      <button
                        type="button"
                        onClick={() => handleArrayFieldRemove('badges', badge)}
                        className="text-[#8b7a5e] hover:text-red-500"
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

      {/* Tags */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Tags & SEO</h3>

        <div className="space-y-4">
          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Enter tag name"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-[#CBB57B] text-black font-medium rounded-lg hover:bg-[#a89158] transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag: any, index: number) => {
                // Handle both string tags and object tags (defensive programming)
                const tagValue = typeof tag === 'string' ? tag : tag?.name || String(tag);
                return (
                  <span
                    key={`tag-${index}-${tagValue}`}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tagValue}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Meta Title */}
          <div>
            <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700 mb-2">
              SEO Title
            </label>
            <input
              id="metaTitle"
              type="text"
              value={formData.metaTitle}
              onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
              placeholder="SEO optimized title for search engines"
              maxLength={60}
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.metaTitle.length}/60 characters (optimal for search engines)
            </p>
          </div>

          {/* Meta Description */}
          <div>
            <label
              htmlFor="metaDescription"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              SEO Description
            </label>
            <textarea
              id="metaDescription"
              value={formData.metaDescription}
              onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
              placeholder="Meta description for search engines..."
              maxLength={160}
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.metaDescription.length}/160 characters
            </p>
          </div>

          {/* SEO Keywords */}
          <div>
            <label htmlFor="seoKeywords" className="block text-sm font-medium text-gray-700 mb-2">
              SEO Keywords
            </label>
            <input
              id="seoKeywords"
              type="text"
              value={formData.seoKeywords}
              onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
              placeholder="keyword1, keyword2, keyword3"
            />
            <p className="mt-1 text-sm text-gray-500">Comma-separated keywords for SEO</p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Publishing</h3>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Product Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
          >
            <option value="DRAFT">Draft - Not visible to customers</option>
            <option value="ACTIVE">Active - Published and visible</option>
            <option value="ARCHIVED">Archived - Hidden from store</option>
          </select>
          <p className="mt-2 text-sm text-gray-500">
            {formData.status === 'DRAFT' &&
              'This product is saved as a draft and not visible to customers.'}
            {formData.status === 'ACTIVE' && 'This product is published and visible in your store.'}
            {formData.status === 'ARCHIVED' &&
              'This product is archived and hidden from your store.'}
          </p>
        </div>
      </div>

      {/* Product Variants */}
      <VariantManager productId={product?.id} productPrice={formData.price} />

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-[#CBB57B] text-black font-medium rounded-lg hover:bg-[#a89158] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {loading && (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          )}
          {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
