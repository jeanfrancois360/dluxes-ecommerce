'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@nextpik/ui';
import { Loader2, Receipt, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { taxSettingsSchema, type TaxSettings } from '@/lib/validations/settings';
import { transformSettingsToForm } from '@/lib/settings-utils';
import { SettingsCard, SettingsField, SettingsToggle, SettingsFooter } from './shared';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

export function TaxSettingsSection() {
  const { settings, loading, refetch } = useSettings('tax');
  const { updateSetting, updating } = useSettingsUpdate();
  const justSavedRef = useRef(false);

  const form = useForm<TaxSettings>({
    resolver: zodResolver(taxSettingsSchema),
    defaultValues: {
      tax_calculation_mode: 'disabled',
      tax_calculation_enabled: false,
      tax_default_rate: 0.10,
    },
  });

  useEffect(() => {
    if (settings.length > 0) {
      console.log('[Tax Settings] Raw settings from API:', settings);
      const formData = transformSettingsToForm(settings);
      console.log('[Tax Settings] Transformed form data:', formData);
      if (!form.formState.isDirty || justSavedRef.current) {
        form.reset(formData as TaxSettings);
        justSavedRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const onSubmit = async (data: TaxSettings) => {
    console.log('[Tax Settings] Form submitted with data:', data);
    console.log('[Tax Settings] Data entries to save:', Object.entries(data));
    try {
      for (const [key, value] of Object.entries(data)) {
        console.log(`[Tax Settings] Saving ${key} = ${value} (type: ${typeof value})`);
        const result = await updateSetting(key, value, 'Updated via settings panel');
        console.log(`[Tax Settings] Save result for ${key}:`, result);
      }
      justSavedRef.current = true;
      toast.success('Tax settings saved successfully');
      console.log('[Tax Settings] Refetching settings...');
      await refetch();
      console.log('[Tax Settings] Refetch complete');
    } catch (error) {
      console.error('[Tax Settings] Failed to save settings:', error);
      toast.error('Failed to save tax settings');
      justSavedRef.current = false;
    }
  };

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
  const currentMode = form.watch('tax_calculation_mode');

  console.log('[Tax Settings] Current form state:', {
    tax_calculation_mode: form.watch('tax_calculation_mode'),
    tax_default_rate: form.watch('tax_default_rate'),
    tax_calculation_enabled: form.watch('tax_calculation_enabled'),
    isDirty,
    formValues: form.getValues(),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <SettingsCard
        icon={Receipt}
        title="Tax Configuration"
        description="Configure tax calculation methods and rates"
      >
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-2">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">Tax Modes</p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li><strong>Disabled:</strong> No tax calculated</li>
                <li><strong>Simple:</strong> Apply a single default tax rate to all orders</li>
                <li><strong>By State:</strong> Use US state-specific tax rates (50 states)</li>
              </ul>
            </div>
          </div>
        </div>

        <SettingsField
          label="Tax Calculation Mode"
          id="tax_calculation_mode"
          required
          tooltip="Choose how tax is calculated for orders"
          error={form.formState.errors.tax_calculation_mode?.message}
        >
          <Select
            value={(() => {
              const val = form.watch('tax_calculation_mode');
              console.log('[Tax Settings] Select value:', val, 'type:', typeof val, 'length:', val?.length);
              return val;
            })()}
            onValueChange={(value) => {
              console.log('[Tax Settings] Select onChange:', value, 'type:', typeof value);
              form.setValue('tax_calculation_mode', value as any, { shouldDirty: true });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="disabled">Disabled (No Tax)</SelectItem>
              <SelectItem value="simple">Simple (Default Rate)</SelectItem>
              <SelectItem value="by_state">By State (US Only)</SelectItem>
            </SelectContent>
          </Select>
        </SettingsField>

        {currentMode === 'simple' && (
          <SettingsField
            label="Default Tax Rate"
            id="tax_default_rate"
            required
            tooltip="Default tax rate as a decimal (0.10 = 10%)"
            error={form.formState.errors.tax_default_rate?.message}
            helperText="Enter as decimal (e.g., 0.10 for 10%, 0.15 for 15%)"
          >
            <Input
              id="tax_default_rate"
              type="number"
              min={0}
              max={1}
              step="0.01"
              {...form.register('tax_default_rate', { valueAsNumber: true })}
              placeholder="0.10"
            />
          </SettingsField>
        )}

        {currentMode === 'by_state' && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium mb-2">State Tax Rates</p>
            <p className="text-sm text-muted-foreground">
              Using hardcoded US state tax rates (50 states + 2% local average).
              No configuration needed - rates are automatically applied based on shipping address.
            </p>
          </div>
        )}

        <SettingsToggle
          label="Enable Tax Calculation (Legacy)"
          description="Deprecated - use Tax Calculation Mode instead"
          checked={form.watch('tax_calculation_enabled')}
          onCheckedChange={(checked) => form.setValue('tax_calculation_enabled', checked, { shouldDirty: true })}
          tooltip="This setting is deprecated. Use 'Tax Calculation Mode' instead."
        />
      </SettingsCard>

      <SettingsFooter
        onReset={() => form.reset()}
        onSave={() => form.handleSubmit(onSubmit)()}
        isLoading={updating}
        isDirty={isDirty}
      />
    </form>
  );
}
