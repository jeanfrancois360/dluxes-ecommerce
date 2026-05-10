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
import {
  AlertTriangle,
  Lock,
  ArrowRight,
  Crown,
  Package,
  Download,
  Briefcase,
  Key,
  Car,
  Home,
  Camera,
  DollarSign,
  Search,
  Layers,
  Zap,
  CheckCircle2,
  FileText,
  Tag,
  Info,
} from 'lucide-react';
import { toast } from '@/lib/utils/toast';
import { categoriesAPI, type Category } from '@/lib/api/categories';
import { gelatoApi } from '@/lib/api/gelato';
import { VariantManager } from '../admin/variant-manager';
import { StockLevelIndicator } from '../admin/stock-status-badge';
import {
  RealEstateFields,
  VehicleFields,
  DigitalFields,
  ServiceFields,
  RentalFields,
} from '../admin/product-type-fields';
import { PodConfigurationSection } from '../gelato/pod-configuration-section';
import { GelatoPreviewModal } from '../gelato/gelato-preview-modal';
import { INVENTORY_DEFAULTS } from '@/lib/constants/inventory';
import { useCanListProductType } from '@/hooks/use-subscription';

// Product types that require a subscription
const SUBSCRIPTION_REQUIRED_TYPES = ['SERVICE', 'RENTAL', 'VEHICLE', 'REAL_ESTATE'];

// Product type config with icons
const PRODUCT_TYPE_CONFIG = [
  {
    value: 'PHYSICAL',
    label: 'Physical',
    desc: 'Tangible goods',
    icon: Package,
    requiresSub: false,
  },
  {
    value: 'DIGITAL',
    label: 'Digital',
    desc: 'Files & downloads',
    icon: Download,
    requiresSub: false,
  },
  {
    value: 'SERVICE',
    label: 'Service',
    desc: 'Professional services',
    icon: Briefcase,
    requiresSub: true,
  },
  {
    value: 'RENTAL',
    label: 'Rental',
    desc: 'Rentals & hire',
    icon: Key,
    requiresSub: true,
  },
  {
    value: 'VEHICLE',
    label: 'Vehicle',
    desc: 'Cars & transport',
    icon: Car,
    requiresSub: true,
  },
  {
    value: 'REAL_ESTATE',
    label: 'Real Estate',
    desc: 'Properties',
    icon: Home,
    requiresSub: true,
  },
] as const;

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

// Product Type Selector with visual icon cards and subscription check
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
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Product Type <span className="text-red-500">*</span>
      </label>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PRODUCT_TYPE_CONFIG.map(({ value: typeValue, label, desc, icon: Icon, requiresSub }) => {
          const isSelected = value === typeValue;
          return (
            <button
              key={typeValue}
              type="button"
              onClick={() => onChange(typeValue)}
              className={`relative flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all text-center cursor-pointer ${
                isSelected
                  ? 'border-[#CBB57B] bg-[#fdf9f0] shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-6 h-6 ${isSelected ? 'text-[#CBB57B]' : 'text-gray-400'}`} />
              <span
                className={`text-sm font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}
              >
                {label}
              </span>
              <span className="text-xs text-gray-400 leading-tight">{desc}</span>
              {requiresSub && (
                <span className="absolute top-1.5 right-1.5 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                  Pro
                </span>
              )}
              {isSelected && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#CBB57B] rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {requiresSubscription && isLoading && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-[#CBB57B] rounded-full animate-spin" />
          Checking subscription status...
        </div>
      )}

      {/* Restriction warning */}
      {restriction && (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-amber-900">{restriction.title}</h4>
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

      {/* Success state */}
      {requiresSubscription && !isLoading && canList && (
        <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="w-4 h-4" />
          Your subscription includes {PRODUCT_TYPE_LABELS[value]} listings
        </div>
      )}
    </div>
  );
}

// Reusable chip component for tags, colors, sizes, etc.
function Chip({
  label,
  onRemove,
  color = 'gray',
}: {
  label: string;
  onRemove: () => void;
  color?: 'gray' | 'gold';
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
        color === 'gold' ? 'bg-[#f5f0e8] text-[#8b7a5e]' : 'bg-gray-100 text-gray-700'
      }`}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 text-current opacity-50 hover:opacity-100 hover:text-red-500 transition-colors leading-none"
        aria-label={`Remove ${label}`}
      >
        ×
      </button>
    </span>
  );
}

// Reusable array field (chip input)
function ChipField({
  label,
  items,
  placeholder,
  onAdd,
  onRemove,
  chipColor = 'gray',
}: {
  label: string;
  items: string[];
  placeholder: string;
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  chipColor?: 'gray' | 'gold';
}) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent text-sm"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-4 py-2 bg-[#CBB57B] text-black text-sm font-medium rounded-lg hover:bg-[#a89158] transition-colors"
        >
          Add
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Chip key={item} label={item} onRemove={() => onRemove(item)} color={chipColor} />
          ))}
        </div>
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
      // Gelato POD fields
      fulfillmentType: (product as any)?.fulfillmentType || 'SELF_FULFILLED',
      gelatoProductUid: (product as any)?.gelatoProductUid || '',
      gelatoTemplateId: (product as any)?.gelatoTemplateId || '',
      designFileUrl: (product as any)?.designFileUrl || '',
      printAreas: (product as any)?.printAreas || null,
      baseCost: (product as any)?.baseCost || undefined,
      markupPercentage: (product as any)?.markupPercentage || undefined,
    };
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [newTag, setNewTag] = useState('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [pendingGelatoData, setPendingGelatoData] = useState<any>(null);

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
        // Gelato POD fields
        fulfillmentType: (product as any)?.fulfillmentType || 'SELF_FULFILLED',
        gelatoProductUid: (product as any)?.gelatoProductUid || '',
        gelatoTemplateId: (product as any)?.gelatoTemplateId || '',
        designFileUrl: (product as any)?.designFileUrl || '',
        printAreas: (product as any)?.printAreas || null,
        baseCost: (product as any)?.baseCost || undefined,
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

  // Memoized callback to prevent infinite loop in EnhancedImageUpload
  const handleImagesChange = useCallback((urls: string[]) => {
    setFormData((prev: any) => ({ ...prev, images: urls }));
  }, []);

  // Utility function to strip HTML tags and convert to plain text
  const stripHtmlTags = (html: string): string => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const handleGelatoProductSelect = async (productDetails: any) => {
    console.log('[DEBUG] Product details received:', productDetails);

    // Auto-populate product details from Gelato
    const markup = formData.markupPercentage !== undefined ? formData.markupPercentage : 50;

    // Get product UID - check multiple possible field names
    const productUid = productDetails?.uid || productDetails?.productUid || productDetails?.id;

    if (!productUid) {
      console.error('[ERROR] No product UID found in productDetails:', productDetails);
      toast.error('Could not identify Gelato product. Please try again.');
      return;
    }

    // Build auto-populated description - strip HTML tags for plain text
    let autoDescription = stripHtmlTags(productDetails.description || '');
    if (productDetails.variants && productDetails.variants.length > 0) {
      autoDescription += '\n\nAvailable options:\n';
      productDetails.variants.forEach((variant: any) => {
        const options = Object.entries(variant.options || {})
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        autoDescription += `- ${variant.title || 'Variant'} (${options})\n`;
      });
    }

    const newName = productDetails.title || '';
    const newSlug = generateSlug(newName);
    const newDescription = autoDescription.trim();
    const newImage = productDetails.previewUrl || '';

    // Store pending data and open preview modal
    setPendingGelatoData({
      productTitle: productDetails.title,
      newValues: {
        name: newName,
        slug: newSlug,
        description: newDescription,
        price: 0,
        image: newImage,
        baseCost: undefined,
        markupPercentage: markup,
      },
    });
    setIsPreviewModalOpen(true);
  };

  const applyGelatoChanges = () => {
    if (!pendingGelatoData) return;

    const { newValues } = pendingGelatoData;

    setFormData((prev: any) => {
      const updates: any = {
        ...prev,
        name: newValues.name || prev.name,
        slug: newValues.slug || prev.slug,
        description: newValues.description || prev.description,
        price: newValues.price || prev.price,
        baseCost: newValues.baseCost !== undefined ? newValues.baseCost : prev.baseCost,
        markupPercentage:
          newValues.markupPercentage !== undefined
            ? newValues.markupPercentage
            : prev.markupPercentage,
      };

      // Update images - replace first image with Gelato preview
      if (newValues.image) {
        const existingImages = prev.images || [];
        updates.images = [newValues.image, ...existingImages.slice(1)];
      }

      return updates;
    });

    toast.success('Product details applied from Gelato');
    setPendingGelatoData(null);
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

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
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.getElementById(firstErrorField);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    try {
      const dataToSubmit = { ...formData };

      delete dataToSubmit.tags;
      delete dataToSubmit.sku;
      delete dataToSubmit.markupPercentage;

      if (typeof dataToSubmit.seoKeywords === 'string') {
        dataToSubmit.seoKeywords = dataToSubmit.seoKeywords
          .split(',')
          .map((k: string) => k.trim())
          .filter((k: string) => k.length > 0);
      }

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

  // Section card header helper
  const SectionHeader = ({
    icon: Icon,
    title,
    subtitle,
  }: {
    icon: React.ElementType;
    title: string;
    subtitle?: string;
  }) => (
    <div className="mb-5">
      <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-[#fdf9f0] flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-[#CBB57B]" />
        </span>
        {title}
      </h3>
      {subtitle && <p className="mt-1 text-sm text-gray-500 ml-9">{subtitle}</p>}
    </div>
  );

  const hasDiscount =
    formData.compareAtPrice && formData.price && formData.compareAtPrice > formData.price;
  const discountPct = hasDiscount
    ? Math.round(((formData.compareAtPrice - formData.price) / formData.compareAtPrice) * 100)
    : 0;

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* ─── LEFT COLUMN: Main content ─── */}
        <div className="xl:col-span-2 space-y-6 pb-24 xl:pb-0">
          {/* Fulfillment Method */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <SectionHeader
              icon={Package}
              title="Fulfillment Method"
              subtitle="Choose how you'll fulfill orders for this product"
            />
            <PodConfigurationSection
              fulfillmentType={formData.fulfillmentType}
              gelatoProductUid={formData.gelatoProductUid}
              designFileUrl={formData.designFileUrl}
              gelatoMarkupPercent={formData.markupPercentage}
              productImages={formData.images || []}
              onChange={(field, value) => setFormData({ ...formData, [field]: value })}
              onGelatoProductSelect={handleGelatoProductSelect}
              disabled={loading}
            />
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <SectionHeader icon={FileText} title="Basic Information" />

            <div className="space-y-5">
              {/* Product Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-colors ${
                    errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g. Premium Leather Wallet"
                  maxLength={200}
                />
                <div className="mt-1 flex items-center justify-between">
                  {errors.name ? (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {errors.name}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-gray-400">{formData.name.length}/200</span>
                </div>
              </div>

              {/* Product Slug */}
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1.5">
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <input
                  id="slug"
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent font-mono text-sm ${
                    errors.slug ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="product-slug"
                />
                {errors.slug ? (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {errors.slug}
                  </p>
                ) : formData.slug ? (
                  <p className="mt-1 text-xs text-gray-400 font-mono truncate">
                    nextpik.com/products/
                    <span className="text-[#CBB57B] font-semibold">{formData.slug}</span>
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-400">Auto-generated from product name</p>
                )}
              </div>

              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  SKU (Stock Keeping Unit)
                </label>
                <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 flex items-center gap-2 text-sm">
                  <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>Auto-generated upon creation (format: NEXTPIK-MM-DD-XXXX)</span>
                </div>
              </div>

              {/* Product Type */}
              <ProductTypeSelector
                value={formData.productType}
                onChange={(value) => setFormData({ ...formData, productType: value })}
              />

              {/* Purchase Type */}
              <div>
                <label
                  htmlFor="purchaseType"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Purchase Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="purchaseType"
                  value={formData.purchaseType}
                  onChange={(e) => setFormData({ ...formData, purchaseType: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                >
                  <option value="INSTANT">Instant Purchase</option>
                  <option value="INQUIRY">Inquiry Only</option>
                  <option value="AUCTION">Auction</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="categoryId"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Category <span className="text-red-500">*</span>
                </label>
                {loadingCategories ? (
                  <div className="px-4 py-2.5 text-gray-500 text-sm animate-pulse">
                    Loading categories...
                  </div>
                ) : (
                  <select
                    id="categoryId"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent ${
                      errors.categoryId ? 'border-red-400 bg-red-50' : 'border-gray-300'
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
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {errors.categoryId}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent resize-none ${
                    errors.description ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Detailed product description — highlight key features, benefits, and what makes this product special..."
                />
                <div className="mt-1 flex items-center justify-between">
                  {errors.description ? (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {errors.description}
                    </p>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {formData.description.length < 10
                        ? `${10 - formData.description.length} more characters needed`
                        : 'Looks good'}
                    </span>
                  )}
                  <span
                    className={`text-xs ${formData.description.length > 0 ? 'text-gray-400' : 'text-gray-300'}`}
                  >
                    {formData.description.length} chars
                  </span>
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label
                  htmlFor="shortDescription"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Short Description
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    (shown in search results)
                  </span>
                </label>
                <textarea
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent resize-none"
                  placeholder="Brief summary for search results and listings..."
                  maxLength={160}
                />
                <div className="mt-1 flex justify-end">
                  <span
                    className={`text-xs ${formData.shortDescription.length > 140 ? 'text-amber-500' : 'text-gray-400'}`}
                  >
                    {formData.shortDescription.length}/160
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Images — placed early for prominence */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <SectionHeader
              icon={Camera}
              title="Product Images"
              subtitle="High-quality images significantly increase conversion rates"
            />
            <EnhancedImageUpload
              onImagesChange={handleImagesChange}
              initialImages={formData.images}
              maxImages={10}
              folder="products"
            />
          </div>

          {/* Pricing & Inventory */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <SectionHeader icon={DollarSign} title="Pricing & Inventory" />

            {/* POD Pricing Section */}
            {formData.fulfillmentType === 'GELATO_POD' && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-4">
                <h4 className="text-sm font-semibold text-blue-900">Print-on-Demand Pricing</h4>

                <div className="p-3 bg-white border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-900">
                      <p className="font-semibold mb-1">How to find your production cost:</p>
                      <ol className="list-decimal list-inside space-y-0.5 text-blue-800">
                        <li>Log in to your Gelato Dashboard</li>
                        <li>Go to Products → Select your product</li>
                        <li>View the "Production Cost" or "Base Price"</li>
                        <li>Enter that amount below</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="baseCost"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      Gelato Base Cost <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                        $
                      </span>
                      <input
                        id="baseCost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.baseCost != null ? formData.baseCost : ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            baseCost: e.target.value ? parseFloat(e.target.value) : undefined,
                          })
                        }
                        className="w-full pl-7 pr-4 py-2.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent bg-blue-50"
                        placeholder="0.00"
                        required={formData.fulfillmentType === 'GELATO_POD'}
                      />
                    </div>
                    <p className="mt-1 text-xs text-blue-600">From your Gelato dashboard</p>
                  </div>

                  <div>
                    <label
                      htmlFor="markupPercentage"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
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
                        className="w-full pl-4 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                        placeholder="50"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                        %
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">e.g., 50% = 1.5x base cost</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Calculated Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 text-sm">
                        $
                      </span>
                      <input
                        type="text"
                        value={formData.price != null ? Number(formData.price).toFixed(2) : '0.00'}
                        readOnly
                        className="w-full pl-7 pr-4 py-2.5 border border-green-300 rounded-lg bg-green-50 text-green-700 font-semibold cursor-not-allowed"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Auto-calculated</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    $
                  </span>
                  <input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) || undefined })
                    }
                    className={`w-full pl-7 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent ${
                      errors.price ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    } ${formData.fulfillmentType === 'GELATO_POD' ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    placeholder="0.00"
                    readOnly={formData.fulfillmentType === 'GELATO_POD'}
                  />
                </div>
                {errors.price ? (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {errors.price}
                  </p>
                ) : formData.fulfillmentType === 'GELATO_POD' ? (
                  <p className="mt-1 text-xs text-gray-400">
                    Auto-calculated from base cost + markup
                  </p>
                ) : null}
              </div>

              {/* Compare At Price */}
              <div>
                <label
                  htmlFor="compareAtPrice"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Compare At Price
                  <span className="ml-1 text-xs font-normal text-gray-400">(original price)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    $
                  </span>
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
                    className="w-full pl-7 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                {hasDiscount && (
                  <p className="mt-1 text-xs text-green-600 font-medium">
                    {discountPct}% discount badge will appear
                  </p>
                )}
              </div>
            </div>

            {formData.productType === 'PHYSICAL' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Stock/Inventory */}
                <div>
                  <label
                    htmlFor="inventory"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Stock/Inventory <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="inventory"
                    type="number"
                    value={formData.inventory || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        inventory: parseInt(e.target.value) || undefined,
                      })
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent ${
                      errors.inventory ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="0"
                  />
                  {errors.inventory && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {errors.inventory}
                    </p>
                  )}
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

                {/* Weight */}
                <div>
                  <label
                    htmlFor="weight"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Weight (kg)
                  </label>
                  <input
                    id="weight"
                    type="number"
                    step="0.01"
                    value={formData.weight || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weight: parseFloat(e.target.value) || undefined,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}
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

          {/* Attributes (Physical only) */}
          {formData.productType === 'PHYSICAL' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <SectionHeader
                icon={Tag}
                title="Product Attributes"
                subtitle="Help customers filter and find your product"
              />

              <div className="space-y-5">
                <ChipField
                  label="Available Colors"
                  items={formData.colors}
                  placeholder="e.g. Black, White, Navy"
                  onAdd={(v) => handleArrayFieldAdd('colors', v)}
                  onRemove={(v) => handleArrayFieldRemove('colors', v)}
                />
                <ChipField
                  label="Available Sizes"
                  items={formData.sizes}
                  placeholder="e.g. S, M, L, XL"
                  onAdd={(v) => handleArrayFieldAdd('sizes', v)}
                  onRemove={(v) => handleArrayFieldRemove('sizes', v)}
                />
                <ChipField
                  label="Materials"
                  items={formData.materials}
                  placeholder="e.g. Leather, Cotton, Steel"
                  onAdd={(v) => handleArrayFieldAdd('materials', v)}
                  onRemove={(v) => handleArrayFieldRemove('materials', v)}
                />
                <ChipField
                  label="Product Badges"
                  items={formData.badges.map((b: any) =>
                    typeof b === 'string' ? b : b?.name || String(b)
                  )}
                  placeholder="e.g. New Arrival, Bestseller"
                  onAdd={(v) => handleArrayFieldAdd('badges', v)}
                  onRemove={(v) => handleArrayFieldRemove('badges', v)}
                  chipColor="gold"
                />
              </div>
            </div>
          )}

          {/* Tags & SEO */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <SectionHeader
              icon={Search}
              title="Tags & SEO"
              subtitle="Improve discoverability in search engines and on-platform search"
            />

            <div className="space-y-5">
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Product Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Add a tag and press Enter"
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent text-sm"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-[#CBB57B] text-black text-sm font-medium rounded-lg hover:bg-[#a89158] transition-colors"
                  >
                    Add
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag: any, index: number) => {
                      const tagValue = typeof tag === 'string' ? tag : tag?.name || String(tag);
                      return (
                        <Chip
                          key={`tag-${index}-${tagValue}`}
                          label={tagValue}
                          onRemove={() => removeTag(tag)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SEO Title */}
              <div>
                <label
                  htmlFor="metaTitle"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  SEO Title
                </label>
                <input
                  id="metaTitle"
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                  placeholder="SEO optimized title for search engines"
                  maxLength={60}
                />
                <div className="mt-1 flex justify-end">
                  <span
                    className={`text-xs ${formData.metaTitle.length > 50 ? 'text-amber-500' : 'text-gray-400'}`}
                  >
                    {formData.metaTitle.length}/60
                  </span>
                </div>
              </div>

              {/* SEO Description */}
              <div>
                <label
                  htmlFor="metaDescription"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  SEO Description
                </label>
                <textarea
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent resize-none"
                  placeholder="Meta description for search engines (shown in search results)..."
                  maxLength={160}
                />
                <div className="mt-1 flex justify-end">
                  <span
                    className={`text-xs ${formData.metaDescription.length > 140 ? 'text-amber-500' : 'text-gray-400'}`}
                  >
                    {formData.metaDescription.length}/160
                  </span>
                </div>
              </div>

              {/* SEO Keywords */}
              <div>
                <label
                  htmlFor="seoKeywords"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  SEO Keywords
                </label>
                <input
                  id="seoKeywords"
                  type="text"
                  value={formData.seoKeywords}
                  onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                  placeholder="keyword1, keyword2, keyword3"
                />
                <p className="mt-1 text-xs text-gray-400">Comma-separated keywords</p>
              </div>
            </div>
          </div>

          {/* Product Variants */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <SectionHeader
              icon={Layers}
              title="Product Variants"
              subtitle="Add size, color, or other variant combinations"
            />
            <VariantManager productId={product?.id} productPrice={formData.price} />
          </div>
        </div>

        {/* ─── RIGHT SIDEBAR ─── */}
        <div className="sticky top-20 self-start space-y-4">
          {/* Publish Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#CBB57B]" />
              Publish
            </h3>

            {/* Status options */}
            <div className="space-y-2 mb-5">
              {[
                {
                  value: 'DRAFT',
                  label: 'Draft',
                  desc: 'Not visible to customers',
                  icon: FileText,
                },
                {
                  value: 'ACTIVE',
                  label: 'Active',
                  desc: 'Published in your store',
                  icon: CheckCircle2,
                },
              ].map(({ value, label, desc, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, status: value })}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 transition-all text-left ${
                    formData.status === value
                      ? value === 'ACTIVE'
                        ? 'border-green-400 bg-green-50'
                        : 'border-[#CBB57B] bg-[#fdf9f0]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      formData.status === value
                        ? value === 'ACTIVE'
                          ? 'text-green-600'
                          : 'text-[#CBB57B]'
                        : 'text-gray-400'
                    }`}
                  />
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        formData.status === value ? 'text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      {label}
                    </p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                </button>
              ))}
              {formData.status === 'ARCHIVED' && (
                <div className="px-3 py-2 rounded-lg border-2 border-gray-400 bg-gray-50 text-sm text-gray-600">
                  Archived — hidden from store
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#CBB57B] text-black text-sm font-semibold rounded-lg hover:bg-[#a89158] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                )}
                {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="w-full py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Pricing Summary Card */}
          {(formData.price > 0 || formData.compareAtPrice > 0) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#CBB57B]" />
                Pricing Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Selling price</span>
                  <span className="font-semibold text-gray-900">
                    ${formData.price ? Number(formData.price).toFixed(2) : '—'}
                  </span>
                </div>
                {formData.compareAtPrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Original price</span>
                    <span className="text-gray-400 line-through">
                      ${Number(formData.compareAtPrice).toFixed(2)}
                    </span>
                  </div>
                )}
                {hasDiscount && (
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <span className="text-green-600 font-medium">Customer saves</span>
                    <span className="text-green-600 font-semibold">
                      {discountPct}% (${(formData.compareAtPrice - formData.price).toFixed(2)})
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Checklist Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Listing Checklist</h3>
            <div className="space-y-2">
              {[
                { label: 'Product name', done: formData.name?.length >= 3 },
                { label: 'Description', done: formData.description?.length >= 10 },
                { label: 'Category selected', done: !!formData.categoryId },
                { label: 'Price set', done: formData.price > 0 },
                {
                  label: 'Images uploaded',
                  done: formData.images?.length > 0,
                },
                ...(formData.productType === 'PHYSICAL'
                  ? [{ label: 'Stock/inventory', done: formData.inventory > 0 }]
                  : []),
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                      done ? 'bg-green-100' : 'bg-gray-100'
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    )}
                  </span>
                  <span className={done ? 'text-gray-700' : 'text-gray-400'}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom action bar — hidden on xl (sidebar handles it there) */}
      <div className="xl:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Status chip */}
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="flex-none text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent bg-white"
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
          </select>

          {/* Cancel */}
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-none px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-[#CBB57B] text-black text-sm font-bold rounded-lg hover:bg-[#a89158] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            )}
            {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </div>

      {/* Gelato Preview Modal */}
      {pendingGelatoData && (
        <GelatoPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => {
            setIsPreviewModalOpen(false);
            setPendingGelatoData(null);
          }}
          onApply={applyGelatoChanges}
          currentValues={{
            name: formData.name || '',
            slug: formData.slug || '',
            description: formData.description || '',
            price: formData.price || 0,
            image: formData.images?.[0] || '',
          }}
          newValues={pendingGelatoData.newValues}
          productTitle={pendingGelatoData.productTitle}
        />
      )}
    </form>
  );
}
