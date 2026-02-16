'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@nextpik/ui';
import {
  AlertCircle,
  Loader2,
  Settings,
  Globe,
  Mail,
  Phone,
  Clock,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { generalSettingsSchema, type GeneralSettings } from '@/lib/validations/settings';
import { transformSettingsToForm } from '@/lib/settings-utils';
import { SettingsCard, SettingsField, SettingsToggle, SettingsFooter } from './shared';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Dubai',
  'Africa/Kigali',
  'Australia/Sydney',
];

const POPULAR_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'KE', name: 'Kenya' },
  { code: 'AU', name: 'Australia' },
  { code: 'IN', name: 'India' },
  { code: 'CN', name: 'China' },
];

export function GeneralSettingsSection() {
  const { settings, loading, refetch } = useSettings('general');
  const { updateSetting, updating } = useSettingsUpdate();
  const justSavedRef = useRef(false);

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
      // Reset if not dirty (initial load) OR if we just saved (force update)
      if (!form.formState.isDirty || justSavedRef.current) {
        form.reset(formData as GeneralSettings);
        justSavedRef.current = false; // Reset the flag
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const onSubmit = async (data: GeneralSettings) => {
    try {
      const updates = Object.entries(data);
      for (const [key, value] of updates) {
        if (key === 'maintenance_mode') continue; // Handle separately
        await updateSetting(key, value, 'Updated via settings panel');
      }
      // Set flag before refetch so useEffect knows to force reset
      justSavedRef.current = true;
      // Refetch will update settings state, which triggers useEffect to reset form
      await refetch();
      toast.success('General settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings. Please try again.');
      justSavedRef.current = false; // Reset flag on error
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

  const getGeneralSetting = (key: string) => {
    const setting = settings.find((s) => s.key === key);
    return setting?.value;
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Site Identity */}
      <SettingsCard
        icon={Building2}
        title="Site Identity"
        description="Configure your site's basic information"
      >
        {Object.keys(form.formState.errors).length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h4 className="text-sm font-medium text-red-900">Form Validation Errors</h4>
            </div>
            <ul className="text-sm text-red-700 space-y-1 ml-7">
              {Object.entries(form.formState.errors).map(([field, error]: any) => (
                <li key={field}>
                  <strong>{field}:</strong> {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsField
            label="Site Name"
            id="site_name"
            required
            tooltip="The name of your marketplace"
            error={form.formState.errors.site_name?.message}
            helperText="Displayed in browser title and emails"
          >
            <Input
              id="site_name"
              {...form.register('site_name')}
              placeholder="Luxury Marketplace"
            />
          </SettingsField>

          <SettingsField
            label="Site Tagline"
            id="site_tagline"
            tooltip="A short description of your marketplace"
            error={form.formState.errors.site_tagline?.message}
            helperText="Displayed in meta descriptions and headers"
          >
            <Input
              id="site_tagline"
              {...form.register('site_tagline')}
              placeholder="Your Premium Shopping Destination"
            />
          </SettingsField>
        </div>
      </SettingsCard>

      {/* Contact Information */}
      <SettingsCard
        icon={Mail}
        title="Contact Information"
        description="How customers can reach you"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsField
            label="Contact Email"
            id="contact_email"
            required
            tooltip="Primary email for customer inquiries"
            error={form.formState.errors.contact_email?.message}
            helperText="Used for customer support and notifications"
          >
            <Input
              id="contact_email"
              type="email"
              {...form.register('contact_email')}
              placeholder="support@example.com"
            />
          </SettingsField>

          <SettingsField
            label="Contact Phone"
            id="contact_phone"
            tooltip="Phone number for customer support"
            error={form.formState.errors.contact_phone?.message}
            helperText="Include country code (e.g., +1 555-123-4567)"
          >
            <Input
              id="contact_phone"
              type="tel"
              {...form.register('contact_phone')}
              placeholder="+1 (555) 123-4567"
            />
          </SettingsField>
        </div>
      </SettingsCard>

      {/* Regional Settings */}
      <SettingsCard
        icon={Globe}
        title="Regional Settings"
        description="Configure timezone and location preferences"
        className="hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsField
            label="Timezone"
            id="timezone"
            required
            tooltip="Default timezone for the platform"
            error={form.formState.errors.timezone?.message}
            helperText="Used for scheduling and timestamps"
          >
            <Select
              value={form.watch('timezone')}
              onValueChange={(value) => form.setValue('timezone', value, { shouldDirty: true })}
            >
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsField>

          <SettingsField
            label="Allowed Countries"
            id="allowed_countries"
            required
            tooltip="Countries where the marketplace operates"
            error={form.formState.errors.allowed_countries?.message}
            helperText="Select countries for shipping and operations"
          >
            <div className="space-y-2">
              {POPULAR_COUNTRIES.map((country) => {
                const currentCountries = form.watch('allowed_countries') || [];
                const isChecked = currentCountries.includes(country.code);

                return (
                  <div key={country.code} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`country_${country.code}`}
                      checked={isChecked}
                      onChange={(e) => {
                        const current = form.watch('allowed_countries') || [];
                        if (e.target.checked) {
                          form.setValue('allowed_countries', [...current, country.code], {
                            shouldDirty: true,
                          });
                        } else {
                          form.setValue(
                            'allowed_countries',
                            current.filter((c) => c !== country.code),
                            { shouldDirty: true }
                          );
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={`country_${country.code}`} className="text-sm">
                      {country.name}
                    </label>
                  </div>
                );
              })}
            </div>
          </SettingsField>
        </div>
      </SettingsCard>

      {/* System Maintenance */}
      <SettingsCard
        icon={AlertTriangle}
        title="System Maintenance"
        description="Control site availability and maintenance mode"
      >
        <div className="space-y-4">
          <SettingsToggle
            label="Maintenance Mode"
            description="Enable to temporarily disable the site for updates or repairs"
            checked={getGeneralSetting('maintenance_mode') ?? false}
            onCheckedChange={async (checked) => {
              await updateSetting('maintenance_mode', checked, 'Toggled maintenance mode');
              await refetch();
            }}
            disabled={updating}
          />

          {getGeneralSetting('maintenance_mode') && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-amber-900 mb-1">
                    Maintenance Mode Active
                  </h4>
                  <p className="text-sm text-amber-700">
                    Your site is currently in maintenance mode. Only administrators can access the
                    platform. Visitors will see a maintenance message.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
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
