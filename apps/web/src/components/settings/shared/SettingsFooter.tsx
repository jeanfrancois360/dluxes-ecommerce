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
  // Detect Mac vs Windows
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierKey = isMac ? '⌘' : 'Ctrl';

  return (
    <div
      className={`flex items-center justify-between pt-6 mt-6 border-t border-slate-200 ${className}`}
    >
      <div className="flex flex-col items-start gap-1">
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
        <span className="text-xs text-muted-foreground hidden sm:inline ml-1">
          {modifierKey}+Z to reset
        </span>
      </div>

      <div className="flex flex-col items-end gap-1">
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
        <span className="text-xs text-muted-foreground hidden sm:inline mr-1">
          {modifierKey}+S to save
        </span>
      </div>
    </div>
  );
}
