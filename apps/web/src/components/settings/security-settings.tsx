'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@luxury/ui';
import { Button } from '@luxury/ui';
import { Input } from '@luxury/ui';
import { Label } from '@luxury/ui';
import { Switch } from '@luxury/ui';
import { AlertCircle, Loader2, Shield, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { securitySettingsSchema, type SecuritySettings } from '@/lib/validations/settings';
import { transformSettingsToForm } from '@/lib/settings-utils';

const COMMON_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'video/mp4', 'application/zip'
];

export function SecuritySettingsSection() {
  const { settings, loading, refetch } = useSettings('security');
  const { updateSetting, updating } = useSettingsUpdate();
  const [newFileType, setNewFileType] = useState('');

  const form = useForm<SecuritySettings>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      '2fa_required_for_admin': true,
      session_timeout_minutes: 30,
      max_login_attempts: 5,
      password_min_length: 8,
      password_require_special_chars: true,
      allowed_file_types: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      max_file_size_mb: 5,
    },
  });

  useEffect(() => {
    if (settings.length > 0) {
      const formData = transformSettingsToForm(settings);
      form.reset(formData as SecuritySettings);
    }
  }, [settings, form]);

  const onSubmit = async (data: SecuritySettings) => {
    try {
      const updates = Object.entries(data);
      for (const [key, value] of updates) {
        await updateSetting(key, value, 'Updated via settings panel');
      }
      toast.success('Security settings saved successfully');
      await refetch();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const addFileType = () => {
    const current = form.watch('allowed_file_types') || [];
    if (newFileType && !current.includes(newFileType)) {
      form.setValue('allowed_file_types', [...current, newFileType]);
      setNewFileType('');
    }
  };

  const removeFileType = (type: string) => {
    const current = form.watch('allowed_file_types') || [];
    if (current.length <= 1) {
      toast.error('At least one file type must be allowed');
      return;
    }
    form.setValue('allowed_file_types', current.filter(t => t !== type));
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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Configure authentication, session, and file upload security
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 2FA for Admin */}
          <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
            <div className="space-y-0.5">
              <Label htmlFor="2fa_required_for_admin">Require 2FA for Admins</Label>
              <p className="text-sm text-muted-foreground">
                Mandatory two-factor authentication for admin accounts
              </p>
            </div>
            <Switch
              id="2fa_required_for_admin"
              checked={form.watch('2fa_required_for_admin')}
              onCheckedChange={(checked) => form.setValue('2fa_required_for_admin', checked)}
            />
          </div>

          {/* Session Timeout */}
          <div className="space-y-2">
            <Label htmlFor="session_timeout_minutes">Session Timeout (Minutes) *</Label>
            <Input
              id="session_timeout_minutes"
              type="number"
              min={5}
              max={1440}
              {...form.register('session_timeout_minutes', { valueAsNumber: true })}
              placeholder="30"
              className="max-w-[200px]"
            />
            {form.formState.errors.session_timeout_minutes && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {form.formState.errors.session_timeout_minutes.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Auto-logout inactive users after this duration (5-1440 minutes)
            </p>
          </div>

          {/* Max Login Attempts */}
          <div className="space-y-2">
            <Label htmlFor="max_login_attempts">Max Login Attempts *</Label>
            <Input
              id="max_login_attempts"
              type="number"
              min={3}
              max={10}
              {...form.register('max_login_attempts', { valueAsNumber: true })}
              placeholder="5"
              className="max-w-[200px]"
            />
            {form.formState.errors.max_login_attempts && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {form.formState.errors.max_login_attempts.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Lock account after this many failed login attempts
            </p>
          </div>

          {/* Password Requirements */}
          <div className="space-y-4 rounded-lg border p-4">
            <h4 className="font-medium">Password Requirements</h4>

            <div className="space-y-2">
              <Label htmlFor="password_min_length">Minimum Password Length *</Label>
              <Input
                id="password_min_length"
                type="number"
                min={6}
                max={32}
                {...form.register('password_min_length', { valueAsNumber: true })}
                placeholder="8"
                className="max-w-[200px]"
              />
              {form.formState.errors.password_min_length && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {form.formState.errors.password_min_length.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="password_require_special_chars">Require Special Characters</Label>
                <p className="text-sm text-muted-foreground">
                  Passwords must contain at least one special character
                </p>
              </div>
              <Switch
                id="password_require_special_chars"
                checked={form.watch('password_require_special_chars')}
                onCheckedChange={(checked) => form.setValue('password_require_special_chars', checked)}
              />
            </div>
          </div>

          {/* File Upload Security */}
          <div className="space-y-4 rounded-lg border p-4">
            <h4 className="font-medium">File Upload Security</h4>

            {/* Max File Size */}
            <div className="space-y-2">
              <Label htmlFor="max_file_size_mb">Max File Size (MB) *</Label>
              <Input
                id="max_file_size_mb"
                type="number"
                min={1}
                max={100}
                {...form.register('max_file_size_mb', { valueAsNumber: true })}
                placeholder="5"
                className="max-w-[200px]"
              />
              {form.formState.errors.max_file_size_mb && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {form.formState.errors.max_file_size_mb.message}
                </p>
              )}
            </div>

            {/* Allowed File Types */}
            <div className="space-y-2">
              <Label>Allowed File Types *</Label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {form.watch('allowed_file_types')?.map((type) => (
                    <div
                      key={type}
                      className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-md text-sm"
                    >
                      <span>{type}</span>
                      {form.watch('allowed_file_types')?.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFileType(type)}
                          className="hover:bg-primary/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={newFileType}
                    onChange={(e) => setNewFileType(e.target.value)}
                    placeholder="e.g., image/jpeg"
                    className="max-w-[250px]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFileType}
                    disabled={!newFileType}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {COMMON_FILE_TYPES.filter(
                    t => !form.watch('allowed_file_types')?.includes(t)
                  ).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        const current = form.watch('allowed_file_types') || [];
                        form.setValue('allowed_file_types', [...current, type]);
                      }}
                      className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80"
                    >
                      + {type}
                    </button>
                  ))}
                </div>
              </div>
              {form.formState.errors.allowed_file_types && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {form.formState.errors.allowed_file_types.message}
                </p>
              )}
            </div>
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
