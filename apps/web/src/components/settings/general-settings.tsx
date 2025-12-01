'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@luxury/ui';
import { Button } from '@luxury/ui';
import { Input } from '@luxury/ui';
import { Label } from '@luxury/ui';
import { Switch } from '@luxury/ui';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { generalSettingsSchema, type GeneralSettings } from '@/lib/validations/settings';
import { transformSettingsToForm } from '@/lib/settings-utils';

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
      form.reset(formData as GeneralSettings);
    }
  }, [settings, form]);

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

  const isDirty = form.formState.isDirty;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card className="border-muted shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2">
            General Settings
            {isDirty && (
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                Unsaved changes
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Manage basic information about your platform
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Site Name */}
          <div className="space-y-2">
            <Label htmlFor="site_name">Site Name *</Label>
            <Input
              id="site_name"
              {...form.register('site_name')}
              placeholder="Luxury E-commerce"
            />
            {form.formState.errors.site_name && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {form.formState.errors.site_name.message}
              </p>
            )}
          </div>

          {/* Site Tagline */}
          <div className="space-y-2">
            <Label htmlFor="site_tagline">Site Tagline *</Label>
            <Input
              id="site_tagline"
              {...form.register('site_tagline')}
              placeholder="Where Elegance Meets Excellence"
            />
            {form.formState.errors.site_tagline && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {form.formState.errors.site_tagline.message}
              </p>
            )}
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email *</Label>
            <Input
              id="contact_email"
              type="email"
              {...form.register('contact_email')}
              placeholder="support@luxury.com"
            />
            {form.formState.errors.contact_email && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {form.formState.errors.contact_email.message}
              </p>
            )}
          </div>

          {/* Contact Phone */}
          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <Input
              id="contact_phone"
              {...form.register('contact_phone')}
              placeholder="+1-800-LUXURY"
            />
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone *</Label>
            <Input
              id="timezone"
              {...form.register('timezone')}
              placeholder="America/New_York"
            />
            <p className="text-sm text-muted-foreground">
              Changing timezone requires application restart
            </p>
          </div>

          {/* Maintenance Mode */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Disable all transactions and show maintenance message
              </p>
            </div>
            <Switch
              id="maintenance_mode"
              checked={form.watch('maintenance_mode')}
              onCheckedChange={(checked) => form.setValue('maintenance_mode', checked)}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t bg-muted/30 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={updating || !isDirty}
            className="gap-2"
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={updating || !isDirty}
            className="gap-2 min-w-[140px]"
          >
            {updating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
