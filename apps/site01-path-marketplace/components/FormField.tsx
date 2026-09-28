import type { ReactNode } from "react";

// Same bordered input look as the checkout email field.
export const INPUT_CLASS =
  "mt-2 w-full border-2 border-black/15 px-4 py-3 text-sm outline-none focus:border-pink aria-[invalid=true]:border-pink";

export interface FormFieldProps {
  id: string;
  label: string;
  error?: string | null;
  // Optional link/button shown at the right end of the label row.
  labelAction?: ReactNode;
  children: ReactNode;
}

// Label + control + inline error. The control should set
// aria-describedby={`${id}-error`} and aria-invalid={!!error}.
export function FormField({ id, label, error, labelAction, children }: FormFieldProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="eyebrow text-ink">
          {label}
        </label>
        {labelAction}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-pink-dark">
          {error}
        </p>
      )}
    </div>
  );
}
