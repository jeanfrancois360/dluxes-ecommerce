import React from 'react';
import { Label } from '@nextpik/ui';
import { Switch } from '@nextpik/ui';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@nextpik/ui/components/tooltip';
import { HelpCircle } from 'lucide-react';

interface SettingsToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  tooltip?: string;
  className?: string;
}

export function SettingsToggle({
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  tooltip,
  className = '',
}: SettingsToggleProps) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700 transition-colors ${className}`}
    >
      <div className="flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium text-slate-900 dark:text-white cursor-pointer">
            {label}
          </Label>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-slate-400 dark:text-slate-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}
