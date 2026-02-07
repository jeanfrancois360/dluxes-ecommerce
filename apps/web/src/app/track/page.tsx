'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@nextpik/ui';
import { Button } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { Package, Truck, Search, MapPin, CheckCircle } from 'lucide-react';

export default function TrackPage() {
  const router = useRouter();
  const t = useTranslations('track');
  const [trackingNumber, setTrackingNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      router.push(`/track/${trackingNumber.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white ">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Package className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4">{t('title')}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t('subtitle')}</p>
        </div>

        {/* Search Card */}
        <Card className="mb-12 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">{t('enterTrackingNumber')}</CardTitle>
            <CardDescription>{t('findInEmail')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('trackingPlaceholder')}
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="pl-12 h-14 text-lg"
                  required
                />
              </div>
              <Button type="submit" size="lg" className="w-full h-12 text-lg">
                <Truck className="mr-2 h-5 w-5" />
                {t('trackPackage')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-2">
                  <MapPin className="h-7 w-7 text-blue-600 " />
                </div>
                <h3 className="font-semibold text-lg">{t('realTimeUpdates')}</h3>
                <p className="text-sm text-muted-foreground">{t('realTimeUpdatesDesc')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-2">
                  <CheckCircle className="h-7 w-7 text-green-600 " />
                </div>
                <h3 className="font-semibold text-lg">{t('deliveryConfirmation')}</h3>
                <p className="text-sm text-muted-foreground">{t('deliveryConfirmationDesc')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-100 mb-2">
                  <Truck className="h-7 w-7 text-purple-600 " />
                </div>
                <h3 className="font-semibold text-lg">{t('multipleCarriers')}</h3>
                <p className="text-sm text-muted-foreground">{t('multipleCarriersDesc')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('faq')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">{t('faqQuestion1')}</h4>
                <p className="text-sm text-muted-foreground">{t('faqAnswer1')}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">{t('faqQuestion2')}</h4>
                <p className="text-sm text-muted-foreground">{t('faqAnswer2')}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">{t('faqQuestion3')}</h4>
                <p className="text-sm text-muted-foreground">{t('faqAnswer3')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
