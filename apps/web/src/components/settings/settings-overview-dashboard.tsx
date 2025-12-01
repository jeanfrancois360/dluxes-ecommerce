'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Settings as SettingsIcon,
  CreditCard,
  DollarSign,
  Globe,
  Truck,
  Shield,
  Cog,
  Bell,
  Search,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@luxury/ui';
import { Button } from '@luxury/ui';
import { useSettingsValidation } from '@/hooks/use-settings-validation';
import { REQUIRED_SETTINGS } from '@/lib/settings-validator';

interface SettingsOverviewDashboardProps {
  onNavigateToTab?: (tab: string) => void;
}

export function SettingsOverviewDashboard({ onNavigateToTab }: SettingsOverviewDashboardProps) {
  const { validation, summary, allSettings } = useSettingsValidation();

  // Group settings by category
  const settingsByCategory = REQUIRED_SETTINGS.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, typeof REQUIRED_SETTINGS>);

  // Check if a setting is configured
  const isSettingConfigured = (key: string, value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (typeof value === 'number' && isNaN(value)) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  };

  // Get display value for a setting
  const getDisplayValue = (key: string, value: any): string => {
    if (!isSettingConfigured(key, value)) {
      return 'Not configured';
    }

    if (typeof value === 'boolean') {
      return value ? 'Enabled' : 'Disabled';
    }

    if (typeof value === 'number') {
      if (key.includes('rate') || key.includes('commission')) {
        return `${value}%`;
      }
      if (key.includes('amount') || key.includes('price')) {
        return `$${value.toLocaleString()}`;
      }
      if (key.includes('days')) {
        return `${value} days`;
      }
      return value.toString();
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'string') {
      if (value.length > 50) {
        return value.substring(0, 50) + '...';
      }
      return value;
    }

    return String(value);
  };

  // Get category display name
  const getCategoryName = (category: string): string => {
    const names: Record<string, string> = {
      payment: 'Payment & Escrow',
      commission: 'Commission',
      currency: 'Currency',
      delivery: 'Delivery',
      security: 'Security',
      general: 'General',
      notifications: 'Notifications',
      seo: 'SEO',
    };
    return names[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      payment: CreditCard,
      commission: DollarSign,
      currency: Globe,
      delivery: Truck,
      security: Shield,
      general: Cog,
      notifications: Bell,
      seo: Search,
    };
    return icons[category] || SettingsIcon;
  };

  const totalSettings = REQUIRED_SETTINGS.length;
  const configuredSettings = REQUIRED_SETTINGS.filter(s => isSettingConfigured(s.key, allSettings[s.key])).length;
  const criticalMissing = validation.missing.length;
  const warnings = validation.warnings.length;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border border-black/10 hover:border-[#6B5840]/30 transition-all">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-black/70 uppercase tracking-wider">Total Settings</p>
                  <div className="w-8 h-8 rounded-md border border-black/10 flex items-center justify-center">
                    <SettingsIcon className="h-4 w-4 text-black" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-black">{totalSettings}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border border-[#6B5840] hover:border-black transition-all bg-[#CBB57B]/5">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-black uppercase tracking-wider">Configured</p>
                  <div className="w-8 h-8 rounded-md bg-[#CBB57B]/10 border border-[#6B5840] flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-[#6B5840]" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-black">{configuredSettings}</p>
                  <p className="text-sm font-bold text-[#6B5840]">
                    {((configuredSettings / totalSettings) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border border-black/10 hover:border-[#6B5840]/30 transition-all">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-black/70 uppercase tracking-wider">Critical</p>
                  <div className="w-8 h-8 rounded-md border border-black/10 flex items-center justify-center">
                    <XCircle className="h-4 w-4 text-black" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-black">{criticalMissing}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border border-black/10 hover:border-[#6B5840]/30 transition-all">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-black/70 uppercase tracking-wider">Warnings</p>
                  <div className="w-8 h-8 rounded-md border border-black/10 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-black" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-black">{warnings}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Settings by Category */}
      <Card className="border border-black/10">
        <CardHeader className="border-b border-black/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md border border-[#6B5840] bg-[#CBB57B]/5 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-[#6B5840]" />
            </div>
            <div>
              <CardTitle className="text-black">Settings Overview</CardTitle>
              <CardDescription className="text-black/60 text-sm mt-1">
                Complete status organized by category
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-8">
          {Object.entries(settingsByCategory).map(([category, settings]) => {
            const categoryConfigured = settings.filter(s => isSettingConfigured(s.key, allSettings[s.key])).length;
            const categoryTotal = settings.length;
            const categoryProgress = (categoryConfigured / categoryTotal) * 100;

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="border-b border-black/5 pb-8 last:border-b-0 last:pb-0"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-md border border-[#6B5840] bg-[#CBB57B]/5 flex items-center justify-center">
                      {(() => {
                        const Icon = getCategoryIcon(category);
                        return <Icon className="h-5 w-5 text-[#6B5840]" />;
                      })()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-black flex items-center gap-2.5">
                        {getCategoryName(category)}
                        <span className="text-xs font-semibold px-2 py-0.5 border border-black/20 text-black/70 rounded">
                          {categoryConfigured}/{categoryTotal}
                        </span>
                      </h3>
                      <div className="mt-2 w-48 h-1.5 bg-black/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${categoryProgress}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full bg-[#6B5840]"
                          style={{ width: `${categoryProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {onNavigateToTab && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigateToTab(category)}
                      className="gap-2 border-[#6B5840] text-[#6B5840] hover:bg-[#6B5840] hover:text-white transition-all font-semibold"
                    >
                      Configure
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Settings List */}
                <div className="grid grid-cols-1 gap-4">
                  {settings.map((setting) => {
                    const value = allSettings[setting.key];
                    const configured = isSettingConfigured(setting.key, value);
                    const displayValue = getDisplayValue(setting.key, value);

                    return (
                      <div
                        key={setting.key}
                        className={`flex items-start justify-between p-4 rounded-lg border transition-all ${
                          configured
                            ? 'border-[#6B5840] hover:border-black'
                            : 'border-black/10 hover:border-[#6B5840]/30'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`w-7 h-7 rounded-md border flex items-center justify-center flex-shrink-0 ${
                            configured
                              ? 'border-[#6B5840] bg-[#CBB57B]/10'
                              : 'border-black/10'
                          }`}>
                            {configured ? (
                              <CheckCircle className="h-4 w-4 text-[#6B5840]" />
                            ) : setting.severity === 'critical' ? (
                              <XCircle className="h-4 w-4 text-black" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-black" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-sm text-black">{setting.label}</p>
                              {!configured && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                                  setting.severity === 'critical'
                                    ? 'bg-black text-white'
                                    : 'border border-[#6B5840] text-[#6B5840]'
                                }`}>
                                  {setting.severity}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-black/70 mb-2 font-medium">{setting.description}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-black/70">Current:</span>
                              <code className={`text-xs px-2 py-1 rounded font-mono font-bold ${
                                configured
                                  ? 'bg-[#CBB57B]/10 text-[#6B5840] border border-[#6B5840]'
                                  : 'bg-black/5 text-black/60 border border-black/10'
                              }`}>
                                {displayValue}
                              </code>
                            </div>
                            {!configured && setting.requiredFor.length > 0 && (
                              <div className="mt-2 flex items-start gap-2 flex-wrap pt-2 border-t border-black/5">
                                <span className="text-xs font-medium text-black/60 flex-shrink-0">Blocks:</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {setting.requiredFor.map((op) => (
                                    <span
                                      key={op}
                                      className="text-xs px-2 py-0.5 rounded bg-black/5 text-black/60 border border-black/10"
                                    >
                                      {op}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
