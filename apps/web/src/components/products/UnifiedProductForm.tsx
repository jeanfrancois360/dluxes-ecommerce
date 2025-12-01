'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api/client';
import {
  Package,
  Building,
  Car,
  Briefcase,
  Calendar,
  Download,
  ShoppingCart,
  MessageSquare,
  Info,
  DollarSign,
  Hash,
  Tag,
  Palette,
  Ruler,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@luxury/ui';
import { Button } from '@luxury/ui';
import { Input } from '@luxury/ui';
import { Label } from '@luxury/ui';
import { Textarea } from '@luxury/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@luxury/ui';

export type ProductType = 'PHYSICAL' | 'REAL_ESTATE' | 'VEHICLE' | 'SERVICE' | 'RENTAL' | 'DIGITAL';
export type PurchaseType = 'INSTANT' | 'INQUIRY';
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  inventory: number;
  weight?: number;
  productType: ProductType;
  purchaseType: PurchaseType;
  isPreOrder: boolean;
  contactRequired: boolean;
  categoryId?: string;
  status: ProductStatus;
  heroImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  seoKeywords?: string[];
  colors?: string[];
  sizes?: string[];
  materials?: string[];
}

interface UnifiedProductFormProps {
  initialData?: Partial<ProductFormData>;
  isEdit?: boolean;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const PRODUCT_TYPES = [
  { value: 'PHYSICAL', label: 'Physical Product', icon: Package, description: 'Standard physical goods' },
  { value: 'REAL_ESTATE', label: 'Real Estate', icon: Building, description: 'Houses, apartments, land' },
  { value: 'VEHICLE', label: 'Vehicle', icon: Car, description: 'Cars, motorcycles, boats' },
  { value: 'SERVICE', label: 'Service', icon: Briefcase, description: 'Service offerings' },
  { value: 'RENTAL', label: 'Rental', icon: Calendar, description: 'Rental/booking items' },
  { value: 'DIGITAL', label: 'Digital Product', icon: Download, description: 'Digital downloads' },
] as const;

const PURCHASE_TYPES = [
  { value: 'INSTANT', label: 'Instant Purchase', icon: ShoppingCart, description: 'Customers can buy immediately' },
  { value: 'INQUIRY', label: 'Contact Seller', icon: MessageSquare, description: 'Requires seller contact' },
] as const;

export default function UnifiedProductForm({
  initialData,
  isEdit = false,
  onSubmit,
  onCancel,
}: UnifiedProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<Partial<ProductFormData>>({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: 0,
    compareAtPrice: 0,
    inventory: 0,
    weight: 0,
    productType: 'PHYSICAL',
    purchaseType: 'INSTANT',
    isPreOrder: false,
    contactRequired: false,
    status: 'DRAFT',
    heroImage: '',
    metaTitle: '',
    metaDescription: '',
    seoKeywords: [],
    colors: [],
    sizes: [],
    materials: [],
    ...initialData,
  });

  // Separate state for comma-separated fields
  const [colorsInput, setColorsInput] = useState(formData.colors?.join(', ') || '');
  const [sizesInput, setSizesInput] = useState(formData.sizes?.join(', ') || '');
  const [materialsInput, setMaterialsInput] = useState(formData.materials?.join(', ') || '');
  const [keywordsInput, setKeywordsInput] = useState(formData.seoKeywords?.join(', ') || '');

  useEffect(() => {
    fetchCategories();
  }, []);

  // Auto-generate slug from name
  useEffect(() => {
    if (!isEdit && formData.name && !formData.slug) {
      const generatedSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      updateField('slug', generatedSlug);
    }
  }, [formData.name, isEdit]);

  // Auto-set contactRequired when purchaseType is INQUIRY
  useEffect(() => {
    if (formData.purchaseType === 'INQUIRY') {
      updateField('contactRequired', true);
    }
  }, [formData.purchaseType]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const updateField = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.name?.trim()) newErrors.name = 'Product name is required';
    if (!formData.slug?.trim()) newErrors.slug = 'Slug is required';
    if (!formData.description?.trim()) newErrors.description = 'Description is required';

    // Conditional price validation
    if (formData.purchaseType === 'INSTANT') {
      if (!formData.price || formData.price <= 0) {
        newErrors.price = 'Valid price is required for instant purchase products';
      }
    }

    // Inventory validation for non-inquiry products
    if (formData.purchaseType === 'INSTANT' && formData.productType === 'PHYSICAL') {
      if (formData.inventory === undefined || formData.inventory < 0) {
        newErrors.inventory = 'Valid inventory is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const submitData: ProductFormData = {
        name: formData.name!,
        slug: formData.slug!,
        description: formData.description!,
        shortDescription: formData.shortDescription || undefined,
        price: Number(formData.price) || 0,
        compareAtPrice: formData.compareAtPrice ? Number(formData.compareAtPrice) : undefined,
        inventory: Number(formData.inventory) || 0,
        weight: formData.weight ? Number(formData.weight) : undefined,
        productType: formData.productType as ProductType,
        purchaseType: formData.purchaseType as PurchaseType,
        isPreOrder: formData.isPreOrder || false,
        contactRequired: formData.contactRequired || false,
        categoryId: formData.categoryId || undefined,
        status: formData.status as ProductStatus,
        heroImage: formData.heroImage || undefined,
        metaTitle: formData.metaTitle || undefined,
        metaDescription: formData.metaDescription || undefined,
        seoKeywords: keywordsInput ? keywordsInput.split(',').map((k) => k.trim()).filter(Boolean) : undefined,
        colors: colorsInput ? colorsInput.split(',').map((c) => c.trim()).filter(Boolean) : undefined,
        sizes: sizesInput ? sizesInput.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        materials: materialsInput ? materialsInput.split(',').map((m) => m.trim()).filter(Boolean) : undefined,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProductTypeInfo = (type: ProductType) => {
    return PRODUCT_TYPES.find((t) => t.value === type);
  };

  const getPurchaseTypeInfo = (type: PurchaseType) => {
    return PURCHASE_TYPES.find((t) => t.value === type);
  };

  const shouldShowInventory = formData.productType === 'PHYSICAL' && formData.purchaseType === 'INSTANT';
  const shouldShowWeight = formData.productType === 'PHYSICAL';
  const shouldShowColors = formData.productType === 'PHYSICAL';
  const shouldShowSizes = formData.productType === 'PHYSICAL';
  const isPriceRequired = formData.purchaseType === 'INSTANT';

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Product Type Selection */}
      <Card className="border border-black/10">
        <CardHeader className="border-b border-black/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md border border-[#6B5840] bg-[#CBB57B]/5 flex items-center justify-center">
              <Package className="h-5 w-5 text-[#6B5840]" />
            </div>
            <div>
              <CardTitle className="text-black">Product Type</CardTitle>
              <CardDescription className="text-black/60 text-sm mt-1">
                Select the type of product you're listing
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRODUCT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = formData.productType === type.value;
              return (
                <motion.button
                  key={type.value}
                  type="button"
                  onClick={() => updateField('productType', type.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-[#6B5840] bg-[#CBB57B]/10'
                      : 'border-black/10 hover:border-[#6B5840]/30'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-md flex items-center justify-center ${
                        isSelected ? 'bg-[#6B5840] text-white' : 'bg-black/5 text-black'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-black">{type.label}</p>
                      <p className="text-xs text-black/60 mt-1">{type.description}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Purchase Type Selection */}
      <Card className="border border-black/10">
        <CardHeader className="border-b border-black/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md border border-[#6B5840] bg-[#CBB57B]/5 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-[#6B5840]" />
            </div>
            <div>
              <CardTitle className="text-black">Purchase Model</CardTitle>
              <CardDescription className="text-black/60 text-sm mt-1">
                How will customers purchase this product?
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PURCHASE_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = formData.purchaseType === type.value;
              return (
                <motion.button
                  key={type.value}
                  type="button"
                  onClick={() => updateField('purchaseType', type.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-[#6B5840] bg-[#CBB57B]/10'
                      : 'border-black/10 hover:border-[#6B5840]/30'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-md flex items-center justify-center ${
                        isSelected ? 'bg-[#6B5840] text-white' : 'bg-black/5 text-black'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-black">{type.label}</p>
                      <p className="text-xs text-black/60 mt-1">{type.description}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {formData.purchaseType === 'INQUIRY' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 bg-[#CBB57B]/5 border border-[#6B5840]/20 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-[#6B5840] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-black">Inquiry-Based Product</p>
                  <p className="text-xs text-black/70 mt-1">
                    This product will show a "Contact Seller" button instead of "Add to Cart". Price is optional and can be used for display purposes only.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card className="border border-black/10">
        <CardHeader className="border-b border-black/10">
          <CardTitle className="text-black">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-black font-bold">
              Product Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g., Luxury Penthouse Miami Beach"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-black font-bold">
              URL Slug *
            </Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => updateField('slug', e.target.value)}
              placeholder="luxury-penthouse-miami-beach"
              className={errors.slug ? 'border-red-500' : ''}
            />
            {errors.slug && <p className="text-xs text-red-600">{errors.slug}</p>}
            <p className="text-xs text-black/60">
              This will be the URL: /products/{formData.slug || 'your-product-slug'}
            </p>
          </div>

          {/* Short Description */}
          <div className="space-y-2">
            <Label htmlFor="shortDescription" className="text-black font-bold">
              Short Description
              <span className="text-black/60 font-normal ml-2">(Optional, max 160 chars)</span>
            </Label>
            <Textarea
              id="shortDescription"
              value={formData.shortDescription}
              onChange={(e) => updateField('shortDescription', e.target.value)}
              placeholder="Brief summary for product cards..."
              maxLength={160}
              rows={2}
            />
            <p className="text-xs text-black/60">{formData.shortDescription?.length || 0}/160</p>
          </div>

          {/* Full Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-black font-bold">
              Full Description *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Detailed product description..."
              rows={6}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Inventory */}
      <Card className="border border-black/10">
        <CardHeader className="border-b border-black/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md border border-[#6B5840] bg-[#CBB57B]/5 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-[#6B5840]" />
            </div>
            <div>
              <CardTitle className="text-black">Pricing & Inventory</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price" className="text-black font-bold">
                Price {isPriceRequired && '*'}
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => updateField('price', parseFloat(e.target.value))}
                placeholder="0.00"
                className={errors.price ? 'border-red-500' : ''}
              />
              {errors.price && <p className="text-xs text-red-600">{errors.price}</p>}
            </div>

            {/* Compare At Price */}
            <div className="space-y-2">
              <Label htmlFor="compareAtPrice" className="text-black font-bold">
                Compare At Price
                <span className="text-black/60 font-normal ml-2">(Original price)</span>
              </Label>
              <Input
                id="compareAtPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.compareAtPrice}
                onChange={(e) => updateField('compareAtPrice', parseFloat(e.target.value))}
                placeholder="0.00"
              />
            </div>

            {/* Inventory - Only for physical instant products */}
            <AnimatePresence>
              {shouldShowInventory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="inventory" className="text-black font-bold">
                    Inventory *
                  </Label>
                  <Input
                    id="inventory"
                    type="number"
                    min="0"
                    value={formData.inventory}
                    onChange={(e) => updateField('inventory', parseInt(e.target.value))}
                    placeholder="0"
                    className={errors.inventory ? 'border-red-500' : ''}
                  />
                  {errors.inventory && <p className="text-xs text-red-600">{errors.inventory}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Weight - Only for physical products */}
            <AnimatePresence>
              {shouldShowWeight && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="weight" className="text-black font-bold">
                    Weight (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.weight}
                    onChange={(e) => updateField('weight', parseFloat(e.target.value))}
                    placeholder="0.00"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Product Attributes - Only for physical products */}
      <AnimatePresence>
        {shouldShowColors && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border border-black/10">
              <CardHeader className="border-b border-black/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md border border-[#6B5840] bg-[#CBB57B]/5 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-[#6B5840]" />
                  </div>
                  <div>
                    <CardTitle className="text-black">Product Attributes</CardTitle>
                    <CardDescription className="text-black/60 text-sm mt-1">
                      Add colors, sizes, and materials (comma-separated)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Colors */}
                  <div className="space-y-2">
                    <Label htmlFor="colors" className="text-black font-bold flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Colors
                    </Label>
                    <Input
                      id="colors"
                      value={colorsInput}
                      onChange={(e) => setColorsInput(e.target.value)}
                      placeholder="Black, Gold, White"
                    />
                  </div>

                  {/* Sizes */}
                  {shouldShowSizes && (
                    <div className="space-y-2">
                      <Label htmlFor="sizes" className="text-black font-bold flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Sizes
                      </Label>
                      <Input
                        id="sizes"
                        value={sizesInput}
                        onChange={(e) => setSizesInput(e.target.value)}
                        placeholder="S, M, L, XL"
                      />
                    </div>
                  )}

                  {/* Materials */}
                  <div className="space-y-2">
                    <Label htmlFor="materials" className="text-black font-bold flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Materials
                    </Label>
                    <Input
                      id="materials"
                      value={materialsInput}
                      onChange={(e) => setMaterialsInput(e.target.value)}
                      placeholder="Leather, Gold, Steel"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Organization */}
      <Card className="border border-black/10">
        <CardHeader className="border-b border-black/10">
          <CardTitle className="text-black">Organization</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-black font-bold">
                Category
              </Label>
              <Select value={formData.categoryId} onValueChange={(value) => updateField('categoryId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-black font-bold">
                Status
              </Label>
              <Select value={formData.status} onValueChange={(value) => updateField('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO (Collapsible) */}
      <Card className="border border-black/10">
        <CardHeader className="border-b border-black/10">
          <CardTitle className="text-black">SEO & Metadata</CardTitle>
          <CardDescription className="text-black/60 text-sm">
            Optimize for search engines
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Meta Title */}
          <div className="space-y-2">
            <Label htmlFor="metaTitle" className="text-black font-bold">
              Meta Title
              <span className="text-black/60 font-normal ml-2">(max 60 chars)</span>
            </Label>
            <Input
              id="metaTitle"
              value={formData.metaTitle}
              onChange={(e) => updateField('metaTitle', e.target.value)}
              placeholder="SEO-optimized title"
              maxLength={60}
            />
            <p className="text-xs text-black/60">{formData.metaTitle?.length || 0}/60</p>
          </div>

          {/* Meta Description */}
          <div className="space-y-2">
            <Label htmlFor="metaDescription" className="text-black font-bold">
              Meta Description
              <span className="text-black/60 font-normal ml-2">(max 160 chars)</span>
            </Label>
            <Textarea
              id="metaDescription"
              value={formData.metaDescription}
              onChange={(e) => updateField('metaDescription', e.target.value)}
              placeholder="SEO-optimized description"
              maxLength={160}
              rows={3}
            />
            <p className="text-xs text-black/60">{formData.metaDescription?.length || 0}/160</p>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label htmlFor="keywords" className="text-black font-bold">
              SEO Keywords
              <span className="text-black/60 font-normal ml-2">(comma-separated)</span>
            </Label>
            <Input
              id="keywords"
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              placeholder="luxury, penthouse, miami, real estate"
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-black/10">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-[#6B5840] hover:bg-black text-white font-bold px-8"
        >
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              {isEdit ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>{isEdit ? 'Update Product' : 'Create Product'}</>
          )}
        </Button>
      </div>
    </form>
  );
}
