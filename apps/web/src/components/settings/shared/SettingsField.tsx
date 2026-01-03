import React from 'react';
import { Input } from '@nextpik/ui';
import { Label } from '@nextpik/ui';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@nextpik/ui/components/tooltip';
import { HelpCircle, AlertCircle } from 'lucide-react';

interface SettingsFieldProps {
  label: string;
  id: string;
  required?: boolean;
  tooltip?: string;
  helperText?: string;
  error?: string;
  prefix?: string; // e.g., "$"
  suffix?: string; // e.g., "%"
  children?: React.ReactNode; // For custom input components
  className?: string;
}

export function SettingsField({
  label,
  id,
  required = false,
  tooltip,
  helperText,
  error,
  prefix,
  suffix,
  children,
  className = '',
}: SettingsFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Label htmlFor={id} className="text-sm font-medium text-slate-900 ">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-slate-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Input wrapper with prefix/suffix */}
      {(prefix || suffix) && !children ? (
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
              {prefix}
            </span>
          )}
          <div className={prefix ? 'pl-7' : suffix ? 'pr-8' : ''}>
            {children}
          </div>
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
              {suffix}
            </span>
          )}
        </div>
      ) : (
        children
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}

      {/* Helper text (shown when no error) */}
      {!error && helperText && (
        <p className="text-xs text-slate-500 ">{helperText}</p>
      )}
    </div>
  );
}
