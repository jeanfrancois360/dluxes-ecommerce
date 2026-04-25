'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Switch, Badge } from '@nextpik/ui';
import {
  Package,
  Store,
  Globe,
  Plane,
  Truck,
  Ship,
  MapPin,
  Settings as SettingsIcon,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProviderStatus {
  enabled: boolean;
  configured: boolean;
  credentialsValid: boolean;
  message: string;
}

interface CascadeTier {
  id: string;
  tier: number;
  name: string;
  description: string;
  icon: any;
  settingKey?: string;
  configPath?: string;
  coverage: string;
  status?: ProviderStatus;
  isAlwaysActive?: boolean;
  isLegacy?: boolean;
  supportedCountries?: string[];
}

export function ShippingCascadeSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(new Set(['tier-0', 'tier-3']));

  const [tiers, setTiers] = useState<CascadeTier[]>([
    {
      id: 'tier-0',
      tier: 0,
      name: 'Gelato POD Shipping',
      description: 'Print-on-Demand items ship directly from Gelato facilities',
      icon: Package,
      coverage: 'Global (POD items only)',
      isAlwaysActive: true,
    },
    {
      id: 'tier-0.5',
      tier: 0.5,
      name: 'Self-Pickup',
      description: 'Customers can pick up from seller stores',
      icon: Store,
      coverage: 'Local (per-store configuration)',
      isAlwaysActive: true,
    },
    {
      id: 'tier-1',
      tier: 1,
      name: 'SendCloud',
      description: 'European shipping specialist with multiple carriers',
      icon: Package,
      settingKey: 'sendcloud_enabled',
      configPath: '/admin/settings?tab=shipping&section=sendcloud',
      coverage: 'Europe (13 countries)',
      supportedCountries: [
        'AT',
        'BE',
        'FR',
        'DE',
        'IT',
        'NL',
        'ES',
        'GB',
        'CZ',
        'DK',
        'PL',
        'PT',
        'SE',
      ],
    },
    {
      id: 'tier-2',
      tier: 2,
      name: 'EasyPost (Primary)',
      description: 'Multi-carrier shipping aggregator - 100+ carriers worldwide',
      icon: Globe,
      settingKey: 'easypost_enabled',
      configPath: '/admin/settings?tab=shipping&section=easypost',
      coverage: 'Worldwide (USPS, UPS, FedEx, DHL, etc.)',
    },
    {
      id: 'tier-3',
      tier: 3,
      name: 'EasyShip',
      description: 'Regional carrier for APAC & alternative markets not covered by EasyPost',
      icon: Ship,
      settingKey: 'easyship_enabled',
      configPath: '/admin/settings?tab=shipping&section=easyship',
      coverage: 'APAC & select markets (AU, HK, SG, CA, etc.)',
      supportedCountries: ['AU', 'BE', 'CA', 'FR', 'DE', 'HK', 'NL', 'SG', 'US', 'GB'],
    },
    {
      id: 'tier-4',
      tier: 4,
      name: 'DHL Express',
      description: 'Premium express shipping worldwide',
      icon: Plane,
      settingKey: 'dhl_enabled',
      coverage: 'Worldwide (Express only)',
      isLegacy: true,
    },
    {
      id: 'tier-5',
      tier: 5,
      name: 'Shipping Zones',
      description: 'Custom zone-based rates configured in database',
      icon: MapPin,
      coverage: 'Configurable by region',
      isAlwaysActive: true,
    },
    {
      id: 'tier-6',
      tier: 6,
      name: 'Manual Rates',
      description: 'Fixed fallback rates - always available',
      icon: SettingsIcon,
      coverage: 'Global (guaranteed fallback)',
      isAlwaysActive: true,
    },
  ]);

  useEffect(() => {
    loadProviderStatuses();
  }, []);

  const loadProviderStatuses = async () => {
    setLoading(true);

    try {
      // Fetch status for each provider
      const statusPromises = [
        fetch('http://localhost:4000/api/v1/sendcloud/health').then((r) => r.json()),
        fetch('http://localhost:4000/api/v1/easyship/health').then((r) => r.json()),
        fetch('http://localhost:4000/api/v1/easypost/health')
          .then((r) => r.json())
          .then((r) => r.data),
      ];

      const [sendcloudStatus, easyshipStatus, easypostStatus] = await Promise.all(statusPromises);

      setTiers((prev) =>
        prev.map((tier) => {
          if (tier.settingKey === 'sendcloud_enabled') {
            return { ...tier, status: sendcloudStatus };
          }
          if (tier.settingKey === 'easyship_enabled') {
            return { ...tier, status: easyshipStatus };
          }
          if (tier.settingKey === 'easypost_enabled') {
            return { ...tier, status: easypostStatus };
          }
          return tier;
        })
      );
    } catch (error) {
      console.error('Failed to load provider statuses:', error);
      toast.error('Failed to load shipping provider statuses');
    } finally {
      setLoading(false);
    }
  };

  const toggleTier = (tierId: string) => {
    setExpandedTiers((prev) => {
      const next = new Set(prev);
      if (next.has(tierId)) {
        next.delete(tierId);
      } else {
        next.add(tierId);
      }
      return next;
    });
  };

  const toggleProvider = async (settingKey: string, currentValue: boolean) => {
    setSaving(true);
    try {
      const response = await fetch(`http://localhost:4000/api/v1/settings/${settingKey}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ value: !currentValue }),
      });

      if (!response.ok) throw new Error('Failed to update setting');

      toast.success(`Provider ${!currentValue ? 'enabled' : 'disabled'} successfully`);
      await loadProviderStatuses();
    } catch (error) {
      console.error('Failed to toggle provider:', error);
      toast.error('Failed to update provider status');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (tier: CascadeTier) => {
    if (tier.isAlwaysActive) {
      return (
        <Badge variant="outline" className="border-[#CBB57B] text-[#CBB57B] bg-[#CBB57B]/10">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Always Active
        </Badge>
      );
    }

    if (!tier.status) {
      return (
        <Badge variant="outline" className="border-gray-400 text-gray-600">
          <AlertCircle className="h-3 w-3 mr-1" />
          Loading...
        </Badge>
      );
    }

    const { enabled, configured, credentialsValid } = tier.status;

    if (!configured) {
      return (
        <Badge variant="outline" className="border-gray-400 text-gray-600">
          <XCircle className="h-3 w-3 mr-1" />
          Not Configured
        </Badge>
      );
    }

    if (!enabled) {
      return (
        <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50">
          <XCircle className="h-3 w-3 mr-1" />
          Disabled
        </Badge>
      );
    }

    if (enabled && credentialsValid) {
      return (
        <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="border-red-500 text-red-600 bg-red-50">
        <AlertCircle className="h-3 w-3 mr-1" />
        Invalid Credentials
      </Badge>
    );
  };

  const getTierCardStyles = (tier: CascadeTier) => {
    if (tier.isAlwaysActive) {
      return 'border-[#CBB57B]/30 bg-gradient-to-br from-white to-[#CBB57B]/5';
    }

    if (!tier.status?.enabled) {
      return 'border-gray-200 bg-gray-50/50 opacity-75';
    }

    if (tier.status?.enabled && tier.status?.credentialsValid) {
      return 'border-green-200 bg-gradient-to-br from-white to-green-50/30';
    }

    return 'border-gray-200 bg-white';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Shipping Cascade System</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure the automatic fallback chain for shipping rate calculations
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadProviderStatuses} disabled={loading}>
          Refresh Status
        </Button>
      </div>

      {/* Cascade Flow Diagram */}
      <Card className="p-6 border-2 border-[#CBB57B]/20 bg-gradient-to-br from-white to-[#CBB57B]/5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ArrowDown className="h-5 w-5 text-[#CBB57B]" />
          How The Cascade Works
        </h3>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            When a customer requests shipping rates, the system tries each provider{' '}
            <strong>in order</strong> until one succeeds:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>
              <strong>Gelato POD</strong> - Checks if cart has print-on-demand items
            </li>
            <li>
              <strong>Self-Pickup</strong> - Checks if customer is near seller store
            </li>
            <li>
              <strong>SendCloud</strong> - If seller is in Europe (13 countries)
            </li>
            <li>
              <strong>EasyPost</strong> - Primary global aggregator (100+ carriers worldwide)
            </li>
            <li>
              <strong>EasyShip</strong> - Regional fallback for APAC markets (AU, HK, SG, etc.)
            </li>
            <li>
              <strong>DHL Express</strong> - Legacy fallback for express shipping
            </li>
            <li>
              <strong>Shipping Zones</strong> - Custom configured zone-based rates
            </li>
            <li>
              <strong>Manual Rates</strong> - Final fallback (always works)
            </li>
          </ol>
          <p className="text-xs text-gray-600 mt-4 p-3 bg-gray-50 rounded border border-gray-200">
            <strong>Geo-Routing:</strong> The system automatically detects the seller's country and
            routes to the best regional provider. Example: EU sellers use SendCloud, US sellers use
            EasyPost.
          </p>
        </div>
      </Card>

      {/* Cascade Tiers */}
      <div className="space-y-3">
        {tiers.map((tier, index) => {
          const isExpanded = expandedTiers.has(tier.id);
          const Icon = tier.icon;

          return (
            <div key={tier.id}>
              <Card className={`transition-all ${getTierCardStyles(tier)}`}>
                {/* Tier Header */}
                <div className="p-4 cursor-pointer" onClick={() => toggleTier(tier.id)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Tier Number & Icon */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white border-2 border-[#CBB57B]/20">
                          <Icon className="h-6 w-6 text-[#CBB57B]" />
                        </div>
                        <span className="text-xs font-medium text-gray-500">Tier {tier.tier}</span>
                      </div>

                      {/* Tier Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
                          {tier.isLegacy && (
                            <Badge
                              variant="outline"
                              className="text-xs border-gray-400 text-gray-600"
                            >
                              Legacy
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{tier.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-gray-500">📍 {tier.coverage}</span>
                          {tier.supportedCountries && (
                            <span className="text-xs text-gray-500">
                              🌍 {tier.supportedCountries.length} countries
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status & Controls */}
                    <div className="flex items-center gap-3">
                      {getStatusBadge(tier)}

                      {!tier.isAlwaysActive && tier.status && (
                        <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          <Switch
                            checked={tier.status.enabled}
                            onCheckedChange={() =>
                              toggleProvider(tier.settingKey!, tier.status!.enabled)
                            }
                            disabled={saving || !tier.status.configured}
                          />
                        </div>
                      )}

                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <>
                    <div className="border-t border-gray-200" />
                    <div className="p-4 bg-gray-50/50">
                      <div className="space-y-4">
                        {/* Status Details */}
                        {tier.status && (
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <span className="text-xs font-medium text-gray-500">Enabled</span>
                              <p className="text-sm font-semibold text-gray-900 mt-1">
                                {tier.status.enabled ? 'Yes' : 'No'}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500">Configured</span>
                              <p className="text-sm font-semibold text-gray-900 mt-1">
                                {tier.status.configured ? 'Yes' : 'No'}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500">Credentials</span>
                              <p className="text-sm font-semibold text-gray-900 mt-1">
                                {tier.status.credentialsValid ? 'Valid' : 'Invalid'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Status Message */}
                        {tier.status?.message && (
                          <div className="p-3 bg-white rounded border border-gray-200">
                            <p className="text-sm text-gray-700">{tier.status.message}</p>
                          </div>
                        )}

                        {/* Supported Countries */}
                        {tier.supportedCountries && (
                          <div>
                            <span className="text-xs font-medium text-gray-500 mb-2 block">
                              Supported Countries
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {tier.supportedCountries.map((country) => (
                                <Badge
                                  key={country}
                                  variant="outline"
                                  className="text-xs border-gray-300"
                                >
                                  {country}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Configure Button */}
                        {tier.configPath && (
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                window.location.href = tier.configPath!;
                              }}
                            >
                              <SettingsIcon className="h-4 w-4 mr-2" />
                              Configure {tier.name}
                            </Button>
                          </div>
                        )}

                        {/* Always Active Info */}
                        {tier.isAlwaysActive && (
                          <div className="p-3 bg-[#CBB57B]/10 rounded border border-[#CBB57B]/20">
                            <p className="text-sm text-gray-700">
                              <strong>Always Active:</strong> This tier is automatically used when
                              applicable and cannot be disabled.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </Card>

              {/* Arrow between tiers */}
              {index < tiers.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="h-5 w-5 text-gray-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="p-6 bg-gradient-to-br from-gray-50 to-white border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/admin/settings?tab=shipping&section=easypost')}
          >
            <Globe className="h-4 w-4 mr-2" />
            Configure EasyPost (Primary)
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              (window.location.href = '/admin/settings?tab=shipping&section=sendcloud')
            }
          >
            <Package className="h-4 w-4 mr-2" />
            Configure SendCloud (EU)
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/admin/settings?tab=shipping&section=easyship')}
          >
            <Ship className="h-4 w-4 mr-2" />
            Configure EasyShip (Global)
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/admin/settings?tab=shipping&section=rates')}
          >
            <SettingsIcon className="h-4 w-4 mr-2" />
            Configure Manual Rates
          </Button>
        </div>
      </Card>
    </div>
  );
}
