import { useEffect, useState } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

/** A snapshot of the form's values, updated at most once per `delayMs` while the user types. */
export function useDebouncedValues<T extends FieldValues>(form: UseFormReturn<T>, delayMs: number): T {
  const [values, setValues] = useState<T>(() => ({ ...form.getValues() }));
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscription = form.watch(() => {
      clearTimeout(timer);
      timer = setTimeout(() => setValues({ ...form.getValues() }), delayMs);
    });
    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [form, delayMs]);
  return values;
}
