import React from 'react';
import { Card, CardContent, CardHeader } from '@nextpik/ui';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@nextpik/ui/components/tooltip';
import { HelpCircle, LucideIcon } from 'lucide-react';

interface SettingsCardProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  tooltip?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsCard({
  icon: Icon,
  title,
  description,
  tooltip,
  children,
  className = '',
}: SettingsCardProps) {
  return (
    <Card className={`border-[#CBB57B]/20 shadow-sm ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-lg bg-[#CBB57B]/10">
              <Icon className="h-5 w-5 text-[#CBB57B]" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-gray-600 mt-0.5">
                {description}
              </p>
            )}
          </div>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  );
}
