'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { Label } from '@nextpik/ui';
import { Textarea } from '@nextpik/ui';
import { Loader2, Search, BarChart } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { seoSettingsSchema, type SeoSettings } from '@/lib/validations/settings';
import { transformSettingsToForm } from '@/lib/settings-utils';
import { SettingsCard, SettingsField, SettingsToggle, SettingsFooter } from './shared';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

export function SeoSettingsSection() {
  const { settings, loading, refetch } = useSettings('seo');
  const { updateSetting, updating } = useSettingsUpdate();

  const form = useForm<SeoSettings>({
    resolver: zodResolver(seoSettingsSchema),
    defaultValues: {
      seo_meta_title: '',
      seo_meta_description: '',
      seo_keywords: '',
      analytics_enabled: true,
    },
  });

  useEffect(() => {
    if (settings.length > 0) {
      const formData = transformSettingsToForm(settings);
      form.reset(formData as SeoSettings, { keepDirtyValues: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const onSubmit = async (data: SeoSettings) => {
    try {
      const updates = Object.entries(data);
      for (const [key, value] of updates) {
        await updateSetting(key, value, 'Updated via settings panel');
      }
      toast.success('SEO settings saved successfully');
      await refetch();
    } catch (error) {
      console.error('Failed to save settings:', error);
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

  const titleLength = form.watch('seo_meta_title')?.length || 0;
  const descriptionLength = form.watch('seo_meta_description')?.length || 0;
  const isDirty = form.formState.isDirty;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <SettingsCard
        icon={Search}
        title="Search Engine Optimization"
        description="Configure meta tags and SEO settings"
      >
        <SettingsField
          label="Meta Title"
          id="seo_meta_title"
          required
          tooltip="Page title shown in search results"
          error={form.formState.errors.seo_meta_title?.message}
          helperText="Page title shown in search results (recommended: 50-60 characters)"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-xs ${titleLength > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {titleLength}/60
              </span>
            </div>
            <Input
              id="seo_meta_title"
              {...form.register('seo_meta_title')}
              placeholder="NextPik E-commerce - Premium Products & Exclusive Deals"
              maxLength={60}
            />
          </div>
        </SettingsField>

        <SettingsField
          label="Meta Description"
          id="seo_meta_description"
          required
          tooltip="Description shown in search results"
          error={form.formState.errors.seo_meta_description?.message}
          helperText="Description shown in search results (recommended: 150-160 characters)"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-xs ${descriptionLength > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {descriptionLength}/160
              </span>
            </div>
            <Textarea
              id="seo_meta_description"
              {...form.register('seo_meta_description')}
              placeholder="Discover premium luxury products with exclusive deals. Shop watches, jewelry, accessories, and fashion from top brands with secure escrow payment."
              maxLength={160}
              rows={3}
            />
          </div>
        </SettingsField>

        <SettingsField
          label="Meta Keywords"
          id="seo_keywords"
          tooltip="Comma-separated keywords for search engines"
          error={form.formState.errors.seo_keywords?.message}
          helperText="Comma-separated keywords for search engines (optional, modern SEO relies less on this)"
        >
          <Textarea
            id="seo_keywords"
            {...form.register('seo_keywords')}
            placeholder="luxury, e-commerce, watches, jewelry, fashion, premium, escrow, secure payment"
            rows={2}
          />
        </SettingsField>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
          <p className="text-sm font-medium mb-3">Search Result Preview</p>
          <div className="space-y-2">
            <div>
              <p className="text-lg text-blue-600 dark:text-blue-400 font-medium line-clamp-1">
                {form.watch('seo_meta_title') || 'Your page title will appear here'}
              </p>
              <p className="text-xs text-green-700 dark:text-green-500">
                https://yourdomain.com
              </p>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {form.watch('seo_meta_description') || 'Your meta description will appear here. This helps users understand what your page is about before clicking.'}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            SEO Best Practices
          </p>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>Keep titles under 60 characters to avoid truncation</li>
            <li>Write compelling descriptions (150-160 characters)</li>
            <li>Include primary keywords naturally</li>
            <li>Make each page's title and description unique</li>
            <li>Focus on user intent, not just keywords</li>
          </ul>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={BarChart}
        title="Analytics"
        description="Configure tracking and analytics"
      >
        <SettingsToggle
          label="Analytics Tracking"
          description="Enable Google Analytics or similar tracking scripts"
          checked={form.watch('analytics_enabled')}
          onCheckedChange={(checked) => form.setValue('analytics_enabled', checked, { shouldDirty: true })}
          tooltip="When enabled, analytics tracking scripts will be loaded on all pages"
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
