'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@nextpik/ui';
import { Label } from '@nextpik/ui';
import { Switch } from '@nextpik/ui';
import { AlertCircle, Loader2, Bell, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { notificationSettingsSchema, type NotificationSettings } from '@/lib/validations/settings';
import { transformSettingsToForm } from '@/lib/settings-utils';
import { SettingsCard, SettingsToggle, SettingsFooter } from './shared';

const NOTIFICATION_EVENTS = [
  { value: 'order_placed', label: 'Order Placed', description: 'When a new order is created' },
  { value: 'order_shipped', label: 'Order Shipped', description: 'When order is marked as shipped' },
  { value: 'order_delivered', label: 'Order Delivered', description: 'When delivery is confirmed' },
  { value: 'payment_received', label: 'Payment Received', description: 'When payment is processed' },
  { value: 'payout_processed', label: 'Payout Processed', description: 'When seller payout is sent' },
  { value: 'product_low_stock', label: 'Low Stock Alert', description: 'When product inventory is low' },
  { value: 'new_review', label: 'New Review', description: 'When a product receives a review' },
  { value: 'account_login', label: 'Account Login', description: 'When user logs in from new device' },
];

export function NotificationSettingsSection() {
  const { settings, loading, refetch } = useSettings('notifications');
  const { updateSetting, updating } = useSettingsUpdate();

  const form = useForm<NotificationSettings>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      email_notifications_enabled: true,
      sms_notifications_enabled: false,
      notification_events: ['order_placed', 'order_shipped', 'payment_received'],
    },
  });

  useEffect(() => {
    if (settings.length > 0) {
      const formData = transformSettingsToForm(settings);
      form.reset(formData as NotificationSettings, { keepDirtyValues: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const onSubmit = async (data: NotificationSettings) => {
    try {
      const updates = Object.entries(data);
      for (const [key, value] of updates) {
        await updateSetting(key, value, 'Updated via settings panel');
      }
      toast.success('Notification settings saved successfully');
      await refetch();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const toggleEvent = (eventValue: string) => {
    const current = form.watch('notification_events') || [];
    if (current.includes(eventValue)) {
      form.setValue('notification_events', current.filter(e => e !== eventValue), { shouldDirty: true });
    } else {
      form.setValue('notification_events', [...current, eventValue], { shouldDirty: true });
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <SettingsCard
        icon={Bell}
        title="Notification Channels"
        description="Configure how to send notifications to users"
      >
        <SettingsToggle
          label="Email Notifications"
          description="Send notifications via email"
          checked={form.watch('email_notifications_enabled')}
          onCheckedChange={(checked) => form.setValue('email_notifications_enabled', checked, { shouldDirty: true })}
          tooltip="Enable or disable email notifications for all events"
        />

        <SettingsToggle
          label="SMS Notifications"
          description="Send notifications via SMS (requires SMS provider)"
          checked={form.watch('sms_notifications_enabled')}
          onCheckedChange={(checked) => form.setValue('sms_notifications_enabled', checked, { shouldDirty: true })}
          tooltip="Enable or disable SMS notifications. Requires SMS provider configuration."
        />
      </SettingsCard>

      <SettingsCard
        icon={MessageSquare}
        title="Notification Events"
        description="Select which events trigger notifications"
      >
        <div className="space-y-2">
          {NOTIFICATION_EVENTS.map((event) => {
            const isChecked = form.watch('notification_events')?.includes(event.value);
            return (
              <div
                key={event.value}
                className={`flex items-start justify-between rounded-lg border p-4 transition-colors ${isChecked ? 'border-primary bg-primary/5' : ''}`}
              >
                <div className="space-y-0.5 flex-1">
                  <Label
                    htmlFor={`event_${event.value}`}
                    className="cursor-pointer font-medium"
                  >
                    {event.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>
                </div>
                <Switch
                  id={`event_${event.value}`}
                  checked={isChecked}
                  onCheckedChange={() => toggleEvent(event.value)}
                />
              </div>
            );
          })}
        </div>

        {form.formState.errors.notification_events && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {form.formState.errors.notification_events.message}
          </p>
        )}

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
          <p className="text-sm font-medium mb-2">Active Notifications</p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              Email: {form.watch('email_notifications_enabled') ? 'Enabled' : 'Disabled'}
            </p>
            <p>
              SMS: {form.watch('sms_notifications_enabled') ? 'Enabled' : 'Disabled'}
            </p>
            <p>
              Events: {form.watch('notification_events')?.length || 0} selected
            </p>
          </div>
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
