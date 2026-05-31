import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@nextpik/ui';
import { Check, Loader2, RotateCcw, Save } from 'lucide-react';

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
  const isMac =
    typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierKey = isMac ? '⌘' : 'Ctrl';
  const prevLoadingRef = useRef(false);
  const [justSaved, setJustSaved] = useState(false);

  // Detect when save completes: isLoading transitions true → false
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (prevLoadingRef.current && !isLoading) {
      setJustSaved(true);
      timer = setTimeout(() => setJustSaved(false), 2500);
    }
    prevLoadingRef.current = isLoading;
    return () => {
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [isLoading]);

  return (
    <div
      className={`sticky bottom-0 z-10 flex items-center justify-between pt-4 pb-4 px-1 mt-6 border-t border-slate-200 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.05)] ${className}`}
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

      <div className="flex items-center gap-4">
        {isDirty && !isLoading && (
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-amber-600 font-medium">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
            Unsaved changes
          </span>
        )}
        {justSaved && !isDirty && (
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <Check className="h-3 w-3" />
            Saved
          </span>
        )}
        <div className="flex flex-col items-end gap-1">
          <Button
            type="button"
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
    </div>
  );
}
