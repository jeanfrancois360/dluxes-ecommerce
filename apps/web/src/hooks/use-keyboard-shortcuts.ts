import { useEffect, useCallback } from 'react';

interface ShortcutHandlers {
  onSave?: () => void;
  onReset?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts({ onSave, onReset, onEscape }: ShortcutHandlers) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? event.metaKey : event.ctrlKey;

    // Cmd/Ctrl + S = Save
    if (modifier && event.key === 's') {
      event.preventDefault();
      onSave?.();
    }

    // Cmd/Ctrl + Z = Reset (when not in input)
    if (modifier && event.key === 'z' && !isInputFocused()) {
      event.preventDefault();
      onReset?.();
    }

    // Escape = Close/Cancel
    if (event.key === 'Escape') {
      onEscape?.();
    }
  }, [onSave, onReset, onEscape]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

function isInputFocused(): boolean {
  const active = document.activeElement;
  return active instanceof HTMLInputElement ||
         active instanceof HTMLTextAreaElement ||
         active?.getAttribute('contenteditable') === 'true';
}
