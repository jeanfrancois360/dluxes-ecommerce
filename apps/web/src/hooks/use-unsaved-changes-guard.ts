import { useEffect } from 'react';

/**
 * Warns the user before closing/refreshing the tab when there are unsaved changes.
 * Call with `isDirty` from react-hook-form's formState.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);
}
