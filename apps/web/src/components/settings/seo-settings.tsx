'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@luxury/ui';
import { Button } from '@luxury/ui';
import { Input } from '@luxury/ui';
import { Label } from '@luxury/ui';
import { Switch } from '@luxury/ui';
import { Textarea } from '@luxury/ui';
import { AlertCircle, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { seoSettingsSchema, type SeoSettings } from '@/lib/validations/settings';
import { transformSettingsToForm } from '@/lib/settings-utils';

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
      form.reset(formData as SeoSettings);
    }
  }, [settings, form]);

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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            SEO Settings
          </CardTitle>
          <CardDescription>
            Configure search engine optimization and analytics
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Meta Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="seo_meta_title">Meta Title *</Label>
              <span className={`text-xs ${titleLength > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {titleLength}/60
              </span>
            </div>
            <Input
              id="seo_meta_title"
              {...form.register('seo_meta_title')}
              placeholder="Luxury E-commerce - Premium Products & Exclusive Deals"
              maxLength={60}
            />
            {form.formState.errors.seo_meta_title && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {form.formState.errors.seo_meta_title.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Page title shown in search results (recommended: 50-60 characters)
            </p>
          </div>

          {/* Meta Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="seo_meta_description">Meta Description *</Label>
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
            {form.formState.errors.seo_meta_description && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {form.formState.errors.seo_meta_description.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Description shown in search results (recommended: 150-160 characters)
            </p>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label htmlFor="seo_keywords">Meta Keywords</Label>
            <Textarea
              id="seo_keywords"
              {...form.register('seo_keywords')}
              placeholder="luxury, e-commerce, watches, jewelry, fashion, premium, escrow, secure payment"
              rows={2}
            />
            {form.formState.errors.seo_keywords && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {form.formState.errors.seo_keywords.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Comma-separated keywords for search engines (optional, modern SEO relies less on this)
            </p>
          </div>

          {/* Analytics Enabled */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="analytics_enabled">Analytics Tracking</Label>
              <p className="text-sm text-muted-foreground">
                Enable Google Analytics or similar tracking scripts
              </p>
            </div>
            <Switch
              id="analytics_enabled"
              checked={form.watch('analytics_enabled')}
              onCheckedChange={(checked) => form.setValue('analytics_enabled', checked)}
            />
          </div>

          {/* Preview Card */}
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

          {/* SEO Tips */}
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
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={updating}
          >
            Reset
          </Button>
          <Button type="submit" disabled={updating}>
            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
