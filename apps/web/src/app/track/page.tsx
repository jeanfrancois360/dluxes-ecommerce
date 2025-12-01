'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@luxury/ui';
import { Button } from '@luxury/ui';
import { Input } from '@luxury/ui';
import { Package, Truck, Search, MapPin, CheckCircle } from 'lucide-react';

export default function TrackPage() {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      router.push(`/track/${trackingNumber.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Package className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4">Track Your Delivery</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Enter your tracking number to see real-time updates on your package's location and delivery status
          </p>
        </div>

        {/* Search Card */}
        <Card className="mb-12 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Enter Tracking Number</CardTitle>
            <CardDescription>
              You can find your tracking number in your order confirmation email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Enter tracking number (e.g., TRK1234567890ABC)"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="pl-12 h-14 text-lg"
                  required
                />
              </div>
              <Button type="submit" size="lg" className="w-full h-12 text-lg">
                <Truck className="mr-2 h-5 w-5" />
                Track Package
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900 mb-2">
                  <MapPin className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-lg">Real-Time Updates</h3>
                <p className="text-sm text-muted-foreground">
                  Get live updates on your package's current location and status
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-900 mb-2">
                  <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-lg">Delivery Confirmation</h3>
                <p className="text-sm text-muted-foreground">
                  Receive confirmation with proof of delivery when your package arrives
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900 mb-2">
                  <Truck className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-lg">Multiple Carriers</h3>
                <p className="text-sm text-muted-foreground">
                  Track packages from various delivery providers in one place
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">Where can I find my tracking number?</h4>
                <p className="text-sm text-muted-foreground">
                  Your tracking number is included in your order confirmation email and is also available in your order history.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">How often is tracking information updated?</h4>
                <p className="text-sm text-muted-foreground">
                  Tracking information is updated in real-time as your package moves through our delivery network.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">What if my tracking number doesn't work?</h4>
                <p className="text-sm text-muted-foreground">
                  If your tracking number isn't working, please check that you've entered it correctly. If the problem persists, contact our customer support team.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
