'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@nextpik/ui';
import { Truck, Package } from 'lucide-react';
import { ShippingSettingsSection } from './shipping-settings';
import { EasyPostSettingsSection } from './easypost-settings';

/**
 * Unified Shipping Settings Component
 * Combines manual shipping rates and EasyPost multi-carrier shipping
 * into a single tabbed interface
 */
export function UnifiedShippingSettingsSection() {
  const [activeSubTab, setActiveSubTab] = useState('rates');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Shipping Configuration</h2>
        <p className="text-muted-foreground mt-1">
          Configure shipping rates, carriers, and delivery options
        </p>
      </div>

      {/* Sub-tabs for different shipping methods */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rates" className="gap-2">
            <Package className="h-4 w-4" />
            Shipping Rates
          </TabsTrigger>
          <TabsTrigger value="easypost" className="gap-2">
            <Truck className="h-4 w-4" />
            EasyPost (Multi-Carrier)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rates" className="mt-6">
          <ShippingSettingsSection />
        </TabsContent>

        <TabsContent value="easypost" className="mt-6">
          <EasyPostSettingsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
