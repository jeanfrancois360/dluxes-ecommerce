'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { Loader2, Package, Settings as SettingsIcon, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { transformSettingsToForm } from '@/lib/settings-utils';
import { SettingsCard, SettingsField, SettingsToggle, SettingsFooter } from './shared';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

// Validation schema
const inventorySettingsSchema = z.object({
  low_stock_threshold: z.number().min(0).max(1000),
  auto_sku_generation: z.boolean(),
  sku_prefix: z.string().min(1).max(10),
  enable_stock_notifications: z.boolean(),
  allow_negative_stock: z.boolean(),
  transaction_history_page_size: z.number().min(10).max(100),
});

type InventorySettings = z.infer<typeof inventorySettingsSchema>;

export function InventorySettingsSection() {
  const { settings, loading, refetch } = useSettings('inventory');
  const { updateSetting, updating } = useSettingsUpdate();
  const justSavedRef = useRef(false);

  const form = useForm<InventorySettings>({
    resolver: zodResolver(inventorySettingsSchema),
    defaultValues: {
      low_stock_threshold: 10,
      auto_sku_generation: true,
      sku_prefix: 'PROD',
      enable_stock_notifications: true,
      allow_negative_stock: false,
      transaction_history_page_size: 20,
    },
  });

  useEffect(() => {
    if (settings.length > 0) {
      const formData = transformSettingsToForm(settings);

      // Inventory settings have "inventory." prefix in DB, strip it for form
      const inventoryData: Partial<InventorySettings> = {};
      Object.entries(formData).forEach(([key, value]) => {
        const cleanKey = key.replace('inventory.', '');
        inventoryData[cleanKey as keyof InventorySettings] = value;
      });

      if (!form.formState.isDirty || justSavedRef.current) {
        form.reset(inventoryData as InventorySettings);
        justSavedRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const onSubmit = async (data: InventorySettings) => {
    try {
      const updates = Object.entries(data);
      for (const [key, value] of updates) {
        // Inventory settings in DB have "inventory." prefix
        const fullKey = `inventory.${key}`;
        await updateSetting(fullKey, value, 'Updated via settings panel');
      }
      justSavedRef.current = true;
      toast.success('Inventory settings saved successfully');
      await refetch();
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save inventory settings');
      justSavedRef.current = false;
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave: () => form.handleSubmit(onSubmit)(),
    onReset: () => form.reset(),
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isDirty = form.formState.isDirty;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Stock Thresholds */}
      <SettingsCard
        icon={Package}
        title="Stock Thresholds"
        description="Configure stock level alerts and notifications"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsField
            label="Low Stock Threshold"
            id="low_stock_threshold"
            required
            tooltip="Products with inventory below this number will be marked as low stock"
            error={form.formState.errors.low_stock_threshold?.message}
            helperText="Set minimum stock level before alerts are triggered"
          >
            <Input
              id="low_stock_threshold"
              type="number"
              min={0}
              max={1000}
              {...form.register('low_stock_threshold', { valueAsNumber: true })}
              placeholder="10"
            />
          </SettingsField>

          <SettingsField
            label="Transaction History Page Size"
            id="transaction_history_page_size"
            required
            tooltip="Number of inventory transactions to display per page"
            error={form.formState.errors.transaction_history_page_size?.message}
            helperText="Items per page (10-100)"
          >
            <Input
              id="transaction_history_page_size"
              type="number"
              min={10}
              max={100}
              {...form.register('transaction_history_page_size', { valueAsNumber: true })}
              placeholder="20"
            />
          </SettingsField>
        </div>
      </SettingsCard>

      {/* SKU Generation */}
      <SettingsCard
        icon={SettingsIcon}
        title="SKU Generation"
        description="Configure automatic SKU generation for products"
      >
        <SettingsToggle
          label="Auto SKU Generation"
          description="Automatically generate SKU codes for new products"
          checked={form.watch('auto_sku_generation')}
          onCheckedChange={(checked) => form.setValue('auto_sku_generation', checked, { shouldDirty: true })}
          tooltip="When enabled, new products will automatically receive a generated SKU code"
        />

        <SettingsField
          label="SKU Prefix"
          id="sku_prefix"
          required
          tooltip="Prefix used for auto-generated SKU codes (e.g., PROD-001, PROD-002)"
          error={form.formState.errors.sku_prefix?.message}
          helperText="1-10 uppercase characters"
        >
          <Input
            id="sku_prefix"
            {...form.register('sku_prefix')}
            placeholder="PROD"
            className="max-w-xs uppercase"
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              form.setValue('sku_prefix', value, { shouldDirty: true });
            }}
          />
        </SettingsField>
      </SettingsCard>

      {/* Notifications & Policies */}
      <SettingsCard
        icon={Bell}
        title="Notifications & Policies"
        description="Configure stock notifications and inventory policies"
      >
        <div className="space-y-4">
          <SettingsToggle
            label="Enable Stock Notifications"
            description="Send alerts when products reach low stock threshold"
            checked={form.watch('enable_stock_notifications')}
            onCheckedChange={(checked) => form.setValue('enable_stock_notifications', checked, { shouldDirty: true })}
            tooltip="Admins and sellers will receive notifications when inventory runs low"
          />

          <SettingsToggle
            label="Allow Negative Stock"
            description="Allow orders even when stock reaches zero"
            checked={form.watch('allow_negative_stock')}
            onCheckedChange={(checked) => form.setValue('allow_negative_stock', checked, { shouldDirty: true })}
            tooltip="When enabled, customers can place orders for out-of-stock items (backorders)"
          />
        </div>
      </SettingsCard>

      {/* Footer */}
      <SettingsFooter
        onReset={() => form.reset()}
        onSave={() => form.handleSubmit(onSubmit)()}
        isLoading={updating}
        isDirty={isDirty}
      />
    </form>
  );
}
