'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, User, MessageSquare, Phone, Send, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@nextpik/ui';
import { Button } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { Label } from '@nextpik/ui';
import { Textarea } from '@nextpik/ui';
import { api } from '@/lib/api/client';

interface ProductInquiryFormProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price?: number;
    heroImage?: string;
  };
  sellerId?: string;
}

interface InquiryData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export default function ProductInquiryForm({
  isOpen,
  onClose,
  product,
  sellerId,
}: ProductInquiryFormProps) {
  const [formData, setFormData] = useState<InquiryData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof InquiryData, string>>>({});

  const updateField = (field: keyof InquiryData, value: string) => {
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
    const newErrors: Partial<Record<keyof InquiryData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Send inquiry to backend
      await api.post('/product-inquiries', {
        productId: product.id,
        sellerId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        message: formData.message,
      });

      setIsSubmitted(true);

      // Reset form after 3 seconds and close
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err: any) {
      console.error('Failed to submit inquiry:', err);
      setError(err.response?.data?.message || 'Failed to send inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', phone: '', message: '' });
    setErrors({});
    setError(null);
    setIsSubmitted(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-black flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-[#6B5840] text-white flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            Contact Seller
          </DialogTitle>
          <DialogDescription className="text-black/60">
            Send an inquiry about this product to the seller
          </DialogDescription>
        </DialogHeader>

        {/* Product Info */}
        <div className="flex items-center gap-4 p-4 bg-black/5 rounded-lg my-4">
          {product.heroImage && (
            <img
              src={product.heroImage}
              alt={product.name}
              className="w-20 h-20 object-cover rounded-md border border-black/10"
            />
          )}
          <div className="flex-1">
            <h4 className="font-bold text-black">{product.name}</h4>
            {product.price && product.price > 0 && (
              <p className="text-sm text-black/70 mt-1">
                ${product.price.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="inquiry-name" className="text-black font-bold flex items-center gap-2">
                <User className="h-4 w-4" />
                Your Name *
              </Label>
              <Input
                id="inquiry-name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="John Doe"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="inquiry-email" className="text-black font-bold flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address *
              </Label>
              <Input
                id="inquiry-email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="john@example.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="inquiry-phone" className="text-black font-bold flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
                <span className="text-black/60 font-normal text-sm">(Optional)</span>
              </Label>
              <Input
                id="inquiry-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="inquiry-message" className="text-black font-bold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Your Message *
              </Label>
              <Textarea
                id="inquiry-message"
                value={formData.message}
                onChange={(e) => updateField('message', e.target.value)}
                placeholder="I'm interested in this product. Could you provide more information about..."
                rows={6}
                className={errors.message ? 'border-red-500' : ''}
              />
              {errors.message && <p className="text-xs text-red-600">{errors.message}</p>}
              <p className="text-xs text-black/60">{formData.message.length} characters</p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
              >
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-red-900">Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#6B5840] hover:bg-black text-white font-bold px-8"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Inquiry
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-12"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-black">Inquiry Sent!</h3>
                <p className="text-black/60 mt-2">
                  The seller will contact you soon via email.
                </p>
              </div>
              <p className="text-sm text-black/60">
                Closing automatically...
              </p>
            </div>
          </motion.div>
        )}

        {/* Privacy Notice */}
        {!isSubmitted && (
          <div className="mt-6 p-4 bg-[#CBB57B]/5 border border-[#6B5840]/20 rounded-lg">
            <p className="text-xs text-black/70">
              <strong>Privacy Notice:</strong> Your contact information will only be shared with the seller of this product. We respect your privacy and will never share your information with third parties.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
