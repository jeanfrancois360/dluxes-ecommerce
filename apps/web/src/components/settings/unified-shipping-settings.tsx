'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@nextpik/ui';
import { Truck, Package, Globe, Ship, ArrowDownUp } from 'lucide-react';
import { ShippingSettingsSection } from './shipping-settings';
import { EasyPostSettingsSection } from './easypost-settings';
import { SendCloudSettingsSection } from './sendcloud-settings';
import { EasyShipSettingsSection } from './easyship-settings';
import { DhlSettingsSection } from './dhl-settings';
import { ShippingCascadeSettings } from './shipping-cascade-settings';

/**
 * Unified Shipping Settings Component
 * Combines manual shipping rates and multi-carrier shipping integrations
 * (EasyPost, SendCloud, EasyShip) into a single tabbed interface
 */
export function UnifiedShippingSettingsSection() {
  const [activeSubTab, setActiveSubTab] = useState('cascade');

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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="cascade" className="gap-2">
            <ArrowDownUp className="h-4 w-4" />
            Cascade
          </TabsTrigger>
          <TabsTrigger value="rates" className="gap-2">
            <Package className="h-4 w-4" />
            Manual
          </TabsTrigger>
          <TabsTrigger value="easypost" className="gap-2">
            <Truck className="h-4 w-4" />
            EasyPost
          </TabsTrigger>
          <TabsTrigger value="sendcloud" className="gap-2">
            <Globe className="h-4 w-4" />
            SendCloud
          </TabsTrigger>
          <TabsTrigger value="easyship" className="gap-2">
            <Ship className="h-4 w-4" />
            EasyShip
          </TabsTrigger>
          <TabsTrigger value="dhl" className="gap-2">
            <Truck className="h-4 w-4" />
            DHL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cascade" className="mt-6">
          <ShippingCascadeSettings />
        </TabsContent>

        <TabsContent value="rates" className="mt-6">
          <ShippingSettingsSection />
        </TabsContent>

        <TabsContent value="easypost" className="mt-6">
          <EasyPostSettingsSection />
        </TabsContent>

        <TabsContent value="sendcloud" className="mt-6">
          <SendCloudSettingsSection />
        </TabsContent>

        <TabsContent value="easyship" className="mt-6">
          <EasyShipSettingsSection />
        </TabsContent>

        <TabsContent value="dhl" className="mt-6">
          <DhlSettingsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
