import React from 'react';
import { Button } from '@nextpik/ui';
import { Loader2, RotateCcw, Save } from 'lucide-react';

interface SettingsFooterProps {
  onReset: () => void;
  onSave: () => void;
  isLoading?: boolean;
  isDirty?: boolean;
  resetLabel?: string;
  saveLabel?: string;
  className?: string;
}

export function SettingsFooter({
  onReset,
  onSave,
  isLoading = false,
  isDirty = false,
  resetLabel = 'RESET',
  saveLabel = 'SAVE CHANGES',
  className = '',
}: SettingsFooterProps) {
  return (
    <div
      className={`flex items-center justify-between pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 ${className}`}
    >
      <Button
        type="button"
        variant="outline"
        onClick={onReset}
        disabled={isLoading || !isDirty}
        className="gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        {resetLabel}
      </Button>

      <Button
        type="submit"
        onClick={onSave}
        disabled={isLoading || !isDirty}
        className="gap-2 min-w-[160px]"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            SAVING...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            {saveLabel}
          </>
        )}
      </Button>
    </div>
  );
}
