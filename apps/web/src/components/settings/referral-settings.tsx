'use client';

import { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import {
  Loader2,
  Gift,
  DollarSign,
  Users,
  Code2,
  Info,
  AlertCircle,
  Ticket,
  Banknote,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';
import { referralSettingsSchema, type ReferralSettings } from '@/lib/validations/settings';
import { transformSettingsToForm } from '@/lib/settings-utils';
import { SettingsCard, SettingsField, SettingsToggle, SettingsFooter } from './shared';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'JPY', 'RWF'];

export function ReferralSettingsSection() {
  const { settings, loading, refetch } = useSettings('referral');
  const { updateSetting, updating } = useSettingsUpdate();
  const justSavedRef = useRef(false);

  const form = useForm<ReferralSettings>({
    resolver: zodResolver(referralSettingsSchema),
    defaultValues: {
      referral_enabled: true,
      referral_reward_type: 'store_credit',
      referral_buyer_reward: 10,
      referral_seller_reward: 50,
      referral_reward_currency: 'USD',
      referral_min_order_value: 25,
      referral_min_payout_amount: 5,
      referral_buyer_expiration_days: 90,
      referral_seller_expiration_days: 180,
      referral_code_prefix: '',
      referral_code_length: 8,
      referral_max_usage_per_code: 0,
      referral_auto_generate_code: true,
      referral_show_leaderboard: true,
      referral_allow_user_choice: false,
    },
  });

  useEffect(() => {
    if (settings.length > 0) {
      if (!form.formState.isDirty || justSavedRef.current) {
        const raw = transformSettingsToForm(settings);
        // referral_reward_type may not exist in DB yet — default to store_credit
        const resetData: ReferralSettings = {
          referral_enabled: raw['referral_enabled'] ?? true,
          referral_reward_type:
            raw['referral_reward_type'] === 'coupon'
              ? 'coupon'
              : raw['referral_reward_type'] === 'flat_commission'
                ? 'flat_commission'
                : 'store_credit',
          referral_buyer_reward: Number(raw['referral_buyer_reward'] ?? 10),
          referral_seller_reward: Number(raw['referral_seller_reward'] ?? 50),
          referral_reward_currency: String(raw['referral_reward_currency'] ?? 'USD'),
          referral_min_order_value: Number(raw['referral_min_order_value'] ?? 25),
          referral_min_payout_amount: Number(raw['referral_min_payout_amount'] ?? 5),
          referral_buyer_expiration_days: Number(raw['referral_buyer_expiration_days'] ?? 90),
          referral_seller_expiration_days: Number(raw['referral_seller_expiration_days'] ?? 180),
          referral_code_prefix: String(raw['referral_code_prefix'] ?? ''),
          referral_code_length: Number(raw['referral_code_length'] ?? 8),
          referral_max_usage_per_code: Number(raw['referral_max_usage_per_code'] ?? 0),
          referral_auto_generate_code: raw['referral_auto_generate_code'] ?? true,
          referral_show_leaderboard: raw['referral_show_leaderboard'] ?? true,
          referral_allow_user_choice: raw['referral_allow_user_choice'] ?? false,
        };
        form.reset(resetData);
        justSavedRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const onSubmit = async (data: ReferralSettings) => {
    try {
      for (const [key, value] of Object.entries(data)) {
        await updateSetting(key, value, 'Updated via referral settings panel');
      }
      justSavedRef.current = true;
      await refetch();
      toast.success('Referral settings saved successfully');
    } catch {
      justSavedRef.current = false;
    }
  };

  useKeyboardShortcuts({
    onSave: () => form.handleSubmit(onSubmit)(),
    onReset: () => form.reset(),
  });
  useUnsavedChangesGuard(form.formState.isDirty);

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
  const enabled = form.watch('referral_enabled');
  const rewardType = form.watch('referral_reward_type');
  const currency = form.watch('referral_reward_currency');
  const prefix = form.watch('referral_code_prefix');
  const codeLength = form.watch('referral_code_length');

  const previewCode = `${prefix}${'X'.repeat(Math.max(0, codeLength - prefix.length))}`;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Info banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-2">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900">How the Referral System Works</p>
            <p className="text-sm text-blue-700">
              Users share their referral code. When a referred <strong>buyer</strong> places their
              first qualifying order, the referrer earns a buyer reward. When a referred{' '}
              <strong>seller</strong> creates their first product, the referrer earns a seller
              reward. Rewards are credited as store credit or discount coupons.
            </p>
          </div>
        </div>
      </div>

      {/* Enable / Disable */}
      <SettingsCard
        icon={Gift}
        title="Referral Program"
        description="Master switch for the entire referral system"
      >
        <Controller
          name="referral_enabled"
          control={form.control}
          render={({ field }) => (
            <SettingsToggle
              label="Enable Referral Program"
              description="When disabled, referral codes cannot be generated or used, and no rewards will be granted."
              checked={!!field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Controller
          name="referral_auto_generate_code"
          control={form.control}
          render={({ field }) => (
            <SettingsToggle
              label="Auto-generate Codes on Registration"
              description="Automatically assign a unique referral code to every new user. When off, users must generate their code manually."
              checked={!!field.value}
              onCheckedChange={field.onChange}
              disabled={!enabled}
            />
          )}
        />
        <Controller
          name="referral_show_leaderboard"
          control={form.control}
          render={({ field }) => (
            <SettingsToggle
              label="Show Public Leaderboard"
              description="Display top referrers on the public leaderboard. Emails are anonymised."
              checked={!!field.value}
              onCheckedChange={field.onChange}
              disabled={!enabled}
            />
          )}
        />
        <Controller
          name="referral_allow_user_choice"
          control={form.control}
          render={({ field }) => (
            <SettingsToggle
              label="Allow Users to Choose Their Reward Type"
              description="When enabled, users can pick Store Credit, Discount Coupon, or Flat Commission from their referrals page. Their choice overrides the platform default above."
              checked={!!field.value}
              onCheckedChange={field.onChange}
              disabled={!enabled}
            />
          )}
        />
      </SettingsCard>

      {/* Reward Type */}
      <SettingsCard
        icon={Ticket}
        title="Reward Type"
        description="Choose how referral rewards are delivered to the referrer"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(
            [
              {
                value: 'store_credit',
                label: 'Store Credit',
                desc: "Reward added to the referrer's platform wallet. Redeemable at checkout.",
                icon: DollarSign,
              },
              {
                value: 'coupon',
                label: 'Discount Coupon',
                desc: 'A single-use coupon for the reward amount. Useful for first-time incentives.',
                icon: Ticket,
              },
              {
                value: 'flat_commission',
                label: 'Flat Commission',
                desc: 'Real cash payout queued for admin to transfer (bank, Stripe, PayPal).',
                icon: Banknote,
              },
            ] as const
          ).map((opt) => {
            const Icon = opt.icon;
            const selected = rewardType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  form.setValue('referral_reward_type', opt.value, { shouldDirty: true })
                }
                disabled={!enabled}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  selected
                    ? 'border-black bg-black/5'
                    : 'border-neutral-200 hover:border-neutral-400 bg-white'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${selected ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p
                    className={`text-sm font-semibold ${selected ? 'text-black' : 'text-neutral-700'}`}
                  >
                    {opt.label}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </SettingsCard>

      {/* Reward Amounts */}
      <SettingsCard
        icon={DollarSign}
        title="Reward Amounts"
        description="How much each referrer earns when a referred user qualifies"
      >
        <div className="grid gap-6 md:grid-cols-3">
          <SettingsField
            label="Buyer Referral Reward"
            id="referral_buyer_reward"
            required
            tooltip="Amount credited to the referrer when a referred buyer places their first qualifying order"
            error={form.formState.errors.referral_buyer_reward?.message}
          >
            <div className="flex gap-2 items-center">
              <span className="text-muted-foreground text-sm font-medium">{currency}</span>
              <Input
                id="referral_buyer_reward"
                type="number"
                min={0}
                step="0.01"
                disabled={!enabled}
                {...form.register('referral_buyer_reward', { valueAsNumber: true })}
                placeholder="10.00"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Reward when a referred buyer places their first order
            </p>
          </SettingsField>

          <SettingsField
            label="Seller Referral Reward"
            id="referral_seller_reward"
            required
            tooltip="Amount credited to the referrer when a referred seller creates their first product"
            error={form.formState.errors.referral_seller_reward?.message}
          >
            <div className="flex gap-2 items-center">
              <span className="text-muted-foreground text-sm font-medium">{currency}</span>
              <Input
                id="referral_seller_reward"
                type="number"
                min={0}
                step="0.01"
                disabled={!enabled}
                {...form.register('referral_seller_reward', { valueAsNumber: true })}
                placeholder="50.00"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Reward when a referred seller publishes their first product
            </p>
          </SettingsField>

          <SettingsField
            label="Reward Currency"
            id="referral_reward_currency"
            required
            tooltip="Currency used for all referral rewards. Should match your platform's primary currency."
            error={form.formState.errors.referral_reward_currency?.message}
          >
            <select
              id="referral_reward_currency"
              disabled={!enabled}
              {...form.register('referral_reward_currency')}
              className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </SettingsField>
        </div>

        <SettingsField
          label="Minimum Order Value for Buyer Qualification"
          id="referral_min_order_value"
          tooltip="A referred buyer's first order must reach this total to trigger the reward. Set to 0 to allow any order value."
          error={form.formState.errors.referral_min_order_value?.message}
        >
          <div className="flex gap-2 items-center max-w-xs">
            <span className="text-muted-foreground text-sm font-medium">{currency}</span>
            <Input
              id="referral_min_order_value"
              type="number"
              min={0}
              step="0.01"
              disabled={!enabled}
              {...form.register('referral_min_order_value', { valueAsNumber: true })}
              placeholder="25.00"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {form.watch('referral_min_order_value') === 0
              ? 'Any order value qualifies'
              : `Orders must be at least ${currency} ${form.watch('referral_min_order_value')} to qualify`}
          </p>
        </SettingsField>

        <SettingsField
          label="Minimum Reward Balance to Use"
          id="referral_min_payout_amount"
          tooltip="Minimum store credit balance a user must have before they can apply it at checkout. Set to 0 to allow any amount."
          error={form.formState.errors.referral_min_payout_amount?.message}
        >
          <div className="flex gap-2 items-center max-w-xs">
            <span className="text-muted-foreground text-sm font-medium">{currency}</span>
            <Input
              id="referral_min_payout_amount"
              type="number"
              min={0}
              step="0.01"
              disabled={!enabled}
              {...form.register('referral_min_payout_amount', { valueAsNumber: true })}
              placeholder="5.00"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Prevents micro-transactions at checkout
          </p>
        </SettingsField>

        {form.formState.errors.referral_buyer_reward?.message?.includes('At least one') && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {form.formState.errors.referral_buyer_reward.message}
          </div>
        )}
      </SettingsCard>

      {/* Qualification & Expiry */}
      <SettingsCard
        icon={Users}
        title="Qualification Rules & Expiry"
        description="Set how long referred users have to qualify for the referral to count"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <SettingsField
            label="Buyer Qualification Window (days)"
            id="referral_buyer_expiration_days"
            tooltip="Days a referred buyer has to place their first qualifying order. Set to 0 for no expiry."
            error={form.formState.errors.referral_buyer_expiration_days?.message}
          >
            <Input
              id="referral_buyer_expiration_days"
              type="number"
              min={0}
              step={1}
              disabled={!enabled}
              {...form.register('referral_buyer_expiration_days', { valueAsNumber: true })}
              placeholder="90"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {form.watch('referral_buyer_expiration_days') === 0
                ? 'No expiry — buyer can take as long as needed'
                : `Referred buyer must order within ${form.watch('referral_buyer_expiration_days')} days`}
            </p>
          </SettingsField>

          <SettingsField
            label="Seller Qualification Window (days)"
            id="referral_seller_expiration_days"
            tooltip="Days a referred seller has to publish their first product. Set to 0 for no expiry."
            error={form.formState.errors.referral_seller_expiration_days?.message}
          >
            <Input
              id="referral_seller_expiration_days"
              type="number"
              min={0}
              step={1}
              disabled={!enabled}
              {...form.register('referral_seller_expiration_days', { valueAsNumber: true })}
              placeholder="180"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {form.watch('referral_seller_expiration_days') === 0
                ? 'No expiry — seller can take as long as needed'
                : `Referred seller must publish within ${form.watch('referral_seller_expiration_days')} days`}
            </p>
          </SettingsField>
        </div>
      </SettingsCard>

      {/* Code Configuration */}
      <SettingsCard
        icon={Code2}
        title="Referral Code Configuration"
        description="Control the format and usage limits of referral codes"
      >
        <div className="grid gap-6 md:grid-cols-3">
          <SettingsField
            label="Code Prefix"
            id="referral_code_prefix"
            tooltip="Optional prefix prepended to all generated codes. Max 4 characters. Example: 'REF' → REF12345678."
            error={form.formState.errors.referral_code_prefix?.message}
          >
            <Input
              id="referral_code_prefix"
              type="text"
              maxLength={4}
              disabled={!enabled}
              {...form.register('referral_code_prefix')}
              placeholder="REF"
              className="uppercase"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty for no prefix (max 4 characters)
            </p>
          </SettingsField>

          <SettingsField
            label="Code Length"
            id="referral_code_length"
            tooltip="Total length of the generated code excluding the prefix. Between 6 and 12 characters."
            error={form.formState.errors.referral_code_length?.message}
          >
            <Input
              id="referral_code_length"
              type="number"
              min={6}
              max={12}
              step={1}
              disabled={!enabled}
              {...form.register('referral_code_length', { valueAsNumber: true })}
              placeholder="8"
            />
            <p className="text-xs text-muted-foreground mt-1">Between 6 and 12 characters</p>
          </SettingsField>

          <SettingsField
            label="Max Uses Per Code"
            id="referral_max_usage_per_code"
            tooltip="Maximum number of times one code can be used by different people. Set to 0 for unlimited."
            error={form.formState.errors.referral_max_usage_per_code?.message}
          >
            <Input
              id="referral_max_usage_per_code"
              type="number"
              min={0}
              step={1}
              disabled={!enabled}
              {...form.register('referral_max_usage_per_code', { valueAsNumber: true })}
              placeholder="0 (unlimited)"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {form.watch('referral_max_usage_per_code') === 0
                ? 'Unlimited uses'
                : `Each code can be used ${form.watch('referral_max_usage_per_code')} time(s)`}
            </p>
          </SettingsField>
        </div>

        {/* Code preview */}
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1">
              Code Preview
            </p>
            <p className="text-xs text-neutral-500">
              Generated codes will look like this (X = random alphanumeric)
            </p>
          </div>
          <div className="px-4 py-2 bg-white border-2 border-neutral-300 rounded-lg font-mono text-lg font-bold tracking-widest text-neutral-900">
            {previewCode}
          </div>
        </div>
      </SettingsCard>

      {/* Summary card */}
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-5 space-y-3">
        <p className="text-sm font-semibold text-neutral-800">Current Configuration Summary</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          {[
            { label: 'Status', value: enabled ? '✅ Active' : '⏸ Disabled' },
            {
              label: 'Reward Type',
              value: form.watch('referral_allow_user_choice')
                ? 'User Choice'
                : rewardType === 'store_credit'
                  ? 'Store Credit'
                  : rewardType === 'coupon'
                    ? 'Coupon'
                    : 'Flat Commission',
            },
            {
              label: 'Buyer Reward',
              value: `${currency} ${form.watch('referral_buyer_reward') ?? 0}`,
            },
            {
              label: 'Seller Reward',
              value: `${currency} ${form.watch('referral_seller_reward') ?? 0}`,
            },
            {
              label: 'Min Order',
              value:
                form.watch('referral_min_order_value') === 0
                  ? 'Any'
                  : `${currency} ${form.watch('referral_min_order_value')}`,
            },
            { label: 'Code Format', value: previewCode },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-lg border border-neutral-200 p-3">
              <p className="text-xs text-neutral-500">{item.label}</p>
              <p className="font-medium text-neutral-900 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <SettingsFooter
        onReset={() => form.reset()}
        onSave={form.handleSubmit(onSubmit)}
        isLoading={updating}
        isDirty={isDirty}
      />
    </form>
  );
}
