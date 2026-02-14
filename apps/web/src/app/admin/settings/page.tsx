'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@nextpik/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { Button } from '@nextpik/ui';
import {
  Settings,
  DollarSign,
  Percent,
  Globe,
  Truck,
  Shield,
  Bell,
  Search,
  History,
  Save,
  ChevronRight,
  Sparkles,
  Package,
  Receipt,
  Calculator,
  PackageCheck,
} from 'lucide-react';
import { GeneralSettingsSection } from '@/components/settings/general-settings';
import { PaymentSettingsSection } from '@/components/settings/payment-settings';
import { CommissionSettingsSection } from '@/components/settings/commission-settings';
import { CurrencySettingsSection } from '@/components/settings/currency-settings';
import { DeliverySettingsSection } from '@/components/settings/delivery-settings';
import { TaxSettingsSection } from '@/components/settings/tax-settings';
import { ShippingSettingsSection } from '@/components/settings/shipping-settings';
import { SecuritySettingsSection } from '@/components/settings/security-settings';
import { NotificationSettingsSection } from '@/components/settings/notification-settings';
import { SeoSettingsSection } from '@/components/settings/seo-settings';
import { InventorySettingsSection } from '@/components/settings/inventory-settings';
import { AuditLogViewer } from '@/components/settings/audit-log-viewer';
import { SettingsValidationAlert } from '@/components/settings/settings-validation-alert';
import { SettingsOverviewDashboard } from '@/components/settings/settings-overview-dashboard';

function SettingsPageContent() {
  const t = useTranslations('adminSettings');
  const [activeTab, setActiveTab] = useState('overview');
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const tabsConfig = [
    {
      value: 'overview',
      label: t('tabs.overview.label'),
      icon: Sparkles,
      description: t('tabs.overview.description'),
    },
    {
      value: 'general',
      label: t('tabs.general.label'),
      icon: Settings,
      description: t('tabs.general.description'),
    },
    {
      value: 'payment',
      label: t('tabs.payment.label'),
      icon: DollarSign,
      description: t('tabs.payment.description'),
    },
    {
      value: 'commission',
      label: t('tabs.commission.label'),
      icon: Percent,
      description: t('tabs.commission.description'),
    },
    {
      value: 'currency',
      label: t('tabs.currency.label'),
      icon: Globe,
      description: t('tabs.currency.description'),
    },
    {
      value: 'inventory',
      label: t('tabs.inventory.label'),
      icon: Package,
      description: t('tabs.inventory.description'),
    },
    {
      value: 'tax',
      label: t('tabs.tax.label'),
      icon: Receipt,
      description: t('tabs.tax.description'),
    },
    {
      value: 'shipping',
      label: t('tabs.shipping.label'),
      icon: Calculator,
      description: t('tabs.shipping.description'),
    },
    {
      value: 'delivery',
      label: t('tabs.delivery.label'),
      icon: PackageCheck,
      description: t('tabs.delivery.description'),
    },
    {
      value: 'security',
      label: t('tabs.security.label'),
      icon: Shield,
      description: t('tabs.security.description'),
    },
    {
      value: 'notifications',
      label: t('tabs.notifications.label'),
      icon: Bell,
      description: t('tabs.notifications.description'),
    },
    {
      value: 'seo',
      label: t('tabs.seo.label'),
      icon: Search,
      description: t('tabs.seo.description'),
    },
  ];

  const handleNavigateToTab = (tab: string) => {
    setActiveTab(tab);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const filteredTabs = tabsConfig.filter(
    (tab) =>
      tab.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tab.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeTabConfig = tabsConfig.find((t) => t.value === activeTab);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-12">
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 border-b"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#CBB57B]/10">
                <Settings className="h-5 w-5 text-[#CBB57B]" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{t('pageTitle')}</h1>
            </div>
            <p className="text-muted-foreground">{t('pageDescription')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAuditLog(!showAuditLog)}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              {showAuditLog ? t('buttons.hideHistory') : t('buttons.viewHistory')}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Settings Validation Alert */}
      <SettingsValidationAlert onNavigateToOverview={() => handleNavigateToTab('overview')} />

      {/* Enhanced Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto scrollbar-thin">
          <TabsList className="inline-flex w-full lg:w-auto min-w-full lg:min-w-0 gap-2 bg-transparent p-0">
            {filteredTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 lg:flex-none data-[state=active]:bg-[#CBB57B] data-[state=active]:text-white hover:bg-muted/50 transition-all duration-200 gap-2 px-4"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Active Tab Breadcrumb */}
        {activeTabConfig && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Settings className="h-4 w-4" />
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">{activeTabConfig.label}</span>
            <span className="hidden md:inline">- {activeTabConfig.description}</span>
          </motion.div>
        )}

        {/* Animated Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent value="overview" className="mt-0">
              <SettingsOverviewDashboard onNavigateToTab={handleNavigateToTab} />
            </TabsContent>

            <TabsContent value="general" className="mt-0">
              <GeneralSettingsSection />
            </TabsContent>

            <TabsContent value="payment" className="mt-0">
              <PaymentSettingsSection />
            </TabsContent>

            <TabsContent value="commission" className="mt-0">
              <CommissionSettingsSection />
            </TabsContent>

            <TabsContent value="currency" className="mt-0">
              <CurrencySettingsSection />
            </TabsContent>

            <TabsContent value="inventory" className="mt-0">
              <InventorySettingsSection />
            </TabsContent>

            <TabsContent value="tax" className="mt-0">
              <TaxSettingsSection />
            </TabsContent>

            <TabsContent value="shipping" className="mt-0">
              <ShippingSettingsSection />
            </TabsContent>

            <TabsContent value="delivery" className="mt-0">
              <DeliverySettingsSection />
            </TabsContent>

            <TabsContent value="security" className="mt-0">
              <SecuritySettingsSection />
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
              <NotificationSettingsSection />
            </TabsContent>

            <TabsContent value="seo" className="mt-0">
              <SeoSettingsSection />
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>

      {/* Enhanced Audit Log Section */}
      <AnimatePresence>
        {showAuditLog && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-[#CBB57B]/20 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#CBB57B]/10">
                      <History className="h-5 w-5 text-[#CBB57B]" />
                    </div>
                    <div>
                      <CardTitle>{t('auditLog.title')}</CardTitle>
                      <CardDescription>{t('auditLog.description')}</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowAuditLog(false)}>
                    {t('buttons.close')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <AuditLogViewer limit={20} />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <SettingsPageContent />
      </AdminLayout>
    </AdminRoute>
  );
}
