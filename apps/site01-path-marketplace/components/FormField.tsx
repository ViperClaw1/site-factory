import type { ReactNode } from "react";

// Same bordered input look as the checkout email field.
export const INPUT_CLASS =
  "mt-2 w-full border-2 border-black/15 px-4 py-3 text-sm outline-none focus:border-pink aria-[invalid=true]:border-pink";

export interface FormFieldProps {
  id: string;
  label: string;
  error?: string | null;
  children: ReactNode;
}

// Label + control + inline error. The control should set
// aria-describedby={`${id}-error`} and aria-invalid={!!error}.
export function FormField({ id, label, error, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="eyebrow text-ink">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-pink-dark">
          {error}
        </p>
      )}
    </div>
  );
}
