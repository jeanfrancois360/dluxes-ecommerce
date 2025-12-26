'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, CheckCircle, ChevronDown, ChevronUp, ExternalLink, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@nextpik/ui';
import { Button } from '@nextpik/ui';
import { useState } from 'react';
import { useSettingsValidation } from '@/hooks/use-settings-validation';

interface SettingsValidationAlertProps {
  onNavigateToOverview?: () => void;
}

export function SettingsValidationAlert({ onNavigateToOverview }: SettingsValidationAlertProps) {
  const { validation, summary, hasCriticalIssues, hasWarnings } = useSettingsValidation();
  const [isExpanded, setIsExpanded] = useState(hasCriticalIssues);

  // Don't show if everything is fine
  if (!hasCriticalIssues && !hasWarnings) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  All Systems Operational
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {summary.message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const statusColor = summary.status === 'critical' ? 'red' : 'yellow';
  const StatusIcon = summary.status === 'critical' ? AlertTriangle : AlertCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className={`border-${statusColor}-200 bg-${statusColor}-50 dark:border-${statusColor}-800 dark:bg-${statusColor}-950 shadow-lg`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${statusColor}-100 dark:bg-${statusColor}-900`}>
                <StatusIcon className={`h-5 w-5 text-${statusColor}-600 dark:text-${statusColor}-400`} />
              </div>
              <div>
                <CardTitle className={`text-${statusColor}-900 dark:text-${statusColor}-100 text-lg`}>
                  {summary.status === 'critical' ? 'Critical Settings Missing' : 'Settings Need Attention'}
                </CardTitle>
                <p className={`text-sm text-${statusColor}-700 dark:text-${statusColor}-300 mt-1`}>
                  {summary.message}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onNavigateToOverview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNavigateToOverview}
                  className="gap-2 border-[#CBB57B] text-[#CBB57B] hover:bg-[#CBB57B] hover:text-white"
                >
                  <Eye className="h-4 w-4" />
                  Full Overview
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="gap-2"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {isExpanded ? 'Hide' : 'Show'} Details
              </Button>
            </div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="pt-0">
                {/* Critical Issues */}
                {validation.missing.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Critical Settings ({validation.missing.length})
                    </h4>
                    <div className="space-y-2">
                      {validation.missing.map((setting) => (
                        <div
                          key={setting.key}
                          className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-red-200 dark:border-red-800"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-foreground">
                                {setting.label}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {setting.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                                  {setting.category}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Blocks: {setting.requiredFor.join(', ')}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 flex-shrink-0"
                              onClick={() => {
                                // Convert category to lowercase to match tab values
                                const categoryLower = setting.category.toLowerCase();
                                const tabTrigger = document.querySelector(`[value="${categoryLower}"]`) as HTMLElement;
                                if (tabTrigger) {
                                  tabTrigger.click();
                                  setTimeout(() => {
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }, 100);
                                } else {
                                  console.warn(`Tab not found for category: ${setting.category} (${categoryLower})`);
                                }
                              }}
                            >
                              Configure
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {validation.warnings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Recommended Settings ({validation.warnings.length})
                    </h4>
                    <div className="space-y-2">
                      {validation.warnings.map((setting) => (
                        <div
                          key={setting.key}
                          className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-foreground">
                                {setting.label}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {setting.description}
                              </p>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 inline-block mt-2">
                                {setting.category}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 flex-shrink-0"
                              onClick={() => {
                                // Convert category to lowercase to match tab values
                                const categoryLower = setting.category.toLowerCase();
                                const tabTrigger = document.querySelector(`[value="${categoryLower}"]`) as HTMLElement;
                                if (tabTrigger) {
                                  tabTrigger.click();
                                  setTimeout(() => {
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }, 100);
                                } else {
                                  console.warn(`Tab not found for category: ${setting.category} (${categoryLower})`);
                                }
                              }}
                            >
                              Configure
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blocked Operations */}
                {validation.blockedOperations.length > 0 && (
                  <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                      ⚠️ Disabled Features
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300">
                      The following operations are currently blocked until critical settings are configured:
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {validation.blockedOperations.map((op) => (
                        <span
                          key={op}
                          className="text-xs px-2 py-1 rounded bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100"
                        >
                          {op}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
