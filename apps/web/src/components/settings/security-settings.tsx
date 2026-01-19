'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@nextpik/ui';
import { Button } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { AlertCircle, Loader2, Shield, Lock, Upload, X, Plus, Key, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { securitySettingsSchema, type SecuritySettings } from '@/lib/validations/settings';
import { transformSettingsToForm } from '@/lib/settings-utils';
import { SettingsCard, SettingsField, SettingsToggle, SettingsFooter } from './shared';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

const COMMON_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'video/mp4', 'application/zip'
];

export function SecuritySettingsSection() {
  const { settings, loading, refetch } = useSettings('security');
  const { updateSetting, updating } = useSettingsUpdate();
  const justSavedRef = useRef(false);
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
      if (!form.formState.isDirty || justSavedRef.current) {
        form.reset(formData as SecuritySettings);
        justSavedRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const onSubmit = async (data: SecuritySettings) => {
    try {
      const updates = Object.entries(data);
      for (const [key, value] of updates) {
        await updateSetting(key, value, 'Updated via settings panel');
      }
      justSavedRef.current = true;
      toast.success('Security settings saved successfully');
      await refetch();
    } catch (error) {
      console.error('Failed to save settings:', error);
      justSavedRef.current = false;
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave: () => form.handleSubmit(onSubmit)(),
    onReset: () => form.reset(),
  });

  const addFileType = () => {
    const current = form.watch('allowed_file_types') || [];
    if (newFileType && !current.includes(newFileType)) {
      form.setValue('allowed_file_types', [...current, newFileType], { shouldDirty: true });
      setNewFileType('');
    }
  };

  const removeFileType = (type: string) => {
    const current = form.watch('allowed_file_types') || [];
    if (current.length <= 1) {
      toast.error('At least one file type must be allowed');
      return;
    }
    form.setValue('allowed_file_types', current.filter(t => t !== type), { shouldDirty: true });
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Authentication Security */}
      <SettingsCard
        icon={Shield}
        title="Authentication Security"
        description="Configure authentication and access control settings"
      >
        <SettingsToggle
          label="Require 2FA for Admins"
          description="Enforce two-factor authentication for all administrator accounts"
          checked={form.watch('2fa_required_for_admin')}
          onCheckedChange={(checked) => form.setValue('2fa_required_for_admin', checked, { shouldDirty: true })}
          tooltip="When enabled, all admin users must set up 2FA before accessing the admin panel"
        />

        {form.watch('2fa_required_for_admin') && (
          <div className="flex items-start gap-3 p-4 bg-green-50 /30 border border-green-200 rounded-lg">
            <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900 ">
                Enhanced Security Enabled
              </p>
              <p className="text-xs text-green-700 mt-1">
                Two-factor authentication is required for all admin accounts.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsField
            label="Max Login Attempts"
            id="max_login_attempts"
            required
            tooltip="Number of failed login attempts before account lockout"
            helperText="Lock account after this many consecutive failed attempts (3-10)"
            error={form.formState.errors.max_login_attempts?.message}
          >
            <Input
              id="max_login_attempts"
              type="number"
              min={3}
              max={10}
              {...form.register('max_login_attempts', { valueAsNumber: true })}
              placeholder="5"
              className={form.formState.errors.max_login_attempts ? 'border-red-500' : ''}
            />
          </SettingsField>

          <SettingsField
            label="Session Timeout"
            id="session_timeout_minutes"
            required
            tooltip="Auto-logout inactive users after this duration"
            helperText="Timeout in minutes (5-1440). Default: 30 minutes"
            error={form.formState.errors.session_timeout_minutes?.message}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <Input
                id="session_timeout_minutes"
                type="number"
                min={5}
                max={1440}
                {...form.register('session_timeout_minutes', { valueAsNumber: true })}
                placeholder="30"
                className={`flex-1 ${form.formState.errors.session_timeout_minutes ? 'border-red-500' : ''}`}
              />
              <span className="text-sm text-slate-500">min</span>
            </div>
          </SettingsField>
        </div>
      </SettingsCard>

      {/* Password Requirements */}
      <SettingsCard
        icon={Lock}
        title="Password Requirements"
        description="Define password complexity and security rules"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsField
            label="Minimum Password Length"
            id="password_min_length"
            required
            tooltip="Minimum number of characters required in passwords"
            helperText="Recommended: 8 or more characters"
            error={form.formState.errors.password_min_length?.message}
          >
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-slate-500" />
              <Input
                id="password_min_length"
                type="number"
                min={6}
                max={32}
                {...form.register('password_min_length', { valueAsNumber: true })}
                placeholder="8"
                className={`flex-1 ${form.formState.errors.password_min_length ? 'border-red-500' : ''}`}
              />
              <span className="text-sm text-slate-500">chars</span>
            </div>
          </SettingsField>

          <div className="flex items-center h-full pt-8">
            <SettingsToggle
              label="Require Special Characters"
              description="Passwords must contain at least one special character (!@#$%^&*)"
              checked={form.watch('password_require_special_chars')}
              onCheckedChange={(checked) => form.setValue('password_require_special_chars', checked, { shouldDirty: true })}
              tooltip="Enabling this increases password complexity and security"
              className="w-full"
            />
          </div>
        </div>

        {form.watch('password_min_length') < 8 && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 /30 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900 ">
                Weak Password Policy
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Passwords shorter than 8 characters are vulnerable to brute-force attacks.
              </p>
            </div>
          </div>
        )}
      </SettingsCard>

      {/* File Upload Security */}
      <SettingsCard
        icon={Upload}
        title="File Upload Security"
        description="Control allowed file types and maximum upload sizes"
      >
        <SettingsField
          label="Maximum File Size"
          id="max_file_size_mb"
          required
          tooltip="Maximum allowed file size for uploads"
          helperText="Maximum file size in MB (1-100). Larger files may impact server performance"
          error={form.formState.errors.max_file_size_mb?.message}
        >
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-slate-500" />
            <Input
              id="max_file_size_mb"
              type="number"
              min={1}
              max={100}
              {...form.register('max_file_size_mb', { valueAsNumber: true })}
              placeholder="5"
              className={`max-w-[200px] ${form.formState.errors.max_file_size_mb ? 'border-red-500' : ''}`}
            />
            <span className="text-sm text-slate-500">MB</span>
          </div>
        </SettingsField>

        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-900 ">
            Allowed File Types <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            {/* Current file types */}
            <div className="flex flex-wrap gap-2">
              {form.watch('allowed_file_types')?.map((type) => (
                <div
                  key={type}
                  className="flex items-center gap-2 bg-slate-100 text-slate-900 px-3 py-1.5 rounded-md text-sm font-medium"
                >
                  <span>{type}</span>
                  {form.watch('allowed_file_types')?.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFileType(type)}
                      className="hover:bg-slate-200 :bg-slate-700 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add new file type */}
            <div className="flex gap-2">
              <Input
                value={newFileType}
                onChange={(e) => setNewFileType(e.target.value)}
                placeholder="e.g., image/jpeg or application/pdf"
                className="max-w-[350px]"
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

            {/* Quick add common types */}
            <div>
              <p className="text-xs text-slate-600 mb-2">
                Quick add common types:
              </p>
              <div className="flex flex-wrap gap-2">
                {COMMON_FILE_TYPES.filter(
                  t => !form.watch('allowed_file_types')?.includes(t)
                ).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      const current = form.watch('allowed_file_types') || [];
                      form.setValue('allowed_file_types', [...current, type], { shouldDirty: true });
                    }}
                    className="text-xs px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 :bg-slate-700 transition-colors font-medium"
                  >
                    + {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {form.formState.errors.allowed_file_types && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {form.formState.errors.allowed_file_types.message}
            </p>
          )}
        </div>
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
