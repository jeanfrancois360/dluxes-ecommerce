'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { AlertCircle, Loader2, Settings, Globe, Mail, Phone, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { generalSettingsSchema, type GeneralSettings } from '@/lib/validations/settings';
import { transformSettingsToForm } from '@/lib/settings-utils';
import { SettingsCard, SettingsField, SettingsToggle, SettingsFooter } from './shared';

export function GeneralSettingsSection() {
  const { settings, loading, refetch } = useSettings('general');
  const { updateSetting, updating } = useSettingsUpdate();

  const form = useForm<GeneralSettings>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      site_name: '',
      site_tagline: '',
      contact_email: '',
      contact_phone: '',
      timezone: 'America/New_York',
      maintenance_mode: false,
      allowed_countries: ['US'],
    },
  });

  useEffect(() => {
    if (settings.length > 0) {
      const formData = transformSettingsToForm(settings);
      form.reset(formData as GeneralSettings, { keepDirtyValues: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const onSubmit = async (data: GeneralSettings) => {
    try {
      const updates = Object.entries(data);
      for (const [key, value] of updates) {
        await updateSetting(key, value, 'Updated via settings panel');
      }
      toast.success('General settings saved successfully');
      await refetch();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!loading && settings.length === 0) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <AlertCircle className="h-5 w-5" />
            Settings Not Initialized
          </CardTitle>
          <CardDescription className="text-yellow-700 dark:text-yellow-300">
            General settings have not been created yet. Please run the settings seed script.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded text-sm overflow-x-auto">
            npx tsx packages/database/prisma/seed-settings.ts
          </pre>
        </CardContent>
      </Card>
    );
  }

  const isDirty = form.formState.isDirty;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Site Information */}
      <SettingsCard
        icon={Globe}
        title="Site Information"
        description="Basic information about your e-commerce platform"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsField
            label="Site Name"
            id="site_name"
            required
            tooltip="The name of your e-commerce platform displayed across the site"
            error={form.formState.errors.site_name?.message}
          >
            <Input
              id="site_name"
              {...form.register('site_name')}
              placeholder="NextPik E-commerce"
              className={form.formState.errors.site_name ? 'border-red-500' : ''}
            />
          </SettingsField>

          <SettingsField
            label="Site Tagline"
            id="site_tagline"
            required
            tooltip="A short tagline that describes your brand or value proposition"
            error={form.formState.errors.site_tagline?.message}
          >
            <Input
              id="site_tagline"
              {...form.register('site_tagline')}
              placeholder="Where Elegance Meets Excellence"
              className={form.formState.errors.site_tagline ? 'border-red-500' : ''}
            />
          </SettingsField>
        </div>
      </SettingsCard>

      {/* Contact Information */}
      <SettingsCard
        icon={Mail}
        title="Contact Information"
        description="How customers can reach your support team"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsField
            label="Contact Email"
            id="contact_email"
            required
            tooltip="Primary email address for customer inquiries and support"
            helperText="This email will be displayed on contact pages and order confirmations"
            error={form.formState.errors.contact_email?.message}
          >
            <Input
              id="contact_email"
              type="email"
              {...form.register('contact_email')}
              placeholder="support@luxury.com"
              className={form.formState.errors.contact_email ? 'border-red-500' : ''}
            />
          </SettingsField>

          <SettingsField
            label="Contact Phone"
            id="contact_phone"
            tooltip="Primary phone number for customer support (optional)"
            helperText="Include country code for international customers"
          >
            <Input
              id="contact_phone"
              {...form.register('contact_phone')}
              placeholder="+1-800-LUXURY"
            />
          </SettingsField>
        </div>
      </SettingsCard>

      {/* System Configuration */}
      <SettingsCard
        icon={Settings}
        title="System Configuration"
        description="Platform-wide system settings"
      >
        <SettingsField
          label="Timezone"
          id="timezone"
          required
          tooltip="Default timezone for the entire platform"
          helperText="⚠️ Changing timezone requires application restart to take effect"
          error={form.formState.errors.timezone?.message}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <Input
              id="timezone"
              {...form.register('timezone')}
              placeholder="America/New_York"
              className={`flex-1 ${form.formState.errors.timezone ? 'border-red-500' : ''}`}
            />
          </div>
        </SettingsField>

        <SettingsToggle
          label="Maintenance Mode"
          description="Disable all transactions and show maintenance message to visitors"
          checked={form.watch('maintenance_mode')}
          onCheckedChange={(checked) =>
            form.setValue('maintenance_mode', checked, { shouldDirty: true })
          }
          tooltip="When enabled, customers cannot place orders and will see a maintenance notice"
        />

        {form.watch('maintenance_mode') && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                Maintenance Mode Active
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Your platform is currently in maintenance mode. Customers cannot place orders.
              </p>
            </div>
          </div>
        )}
      </SettingsCard>

      {/* Footer with Reset and Save buttons */}
      <SettingsFooter
        onReset={() => form.reset()}
        onSave={() => {}} // Form submission handled by form onSubmit
        isLoading={updating}
        isDirty={isDirty}
      />
    </form>
  );
}
