"use client";

import { useT } from "@/lib/i18n";
import { useState, type InputHTMLAttributes } from "react";
import { INPUT_CLASS } from "./FormField";

// Password field with a show/hide toggle (aria-pressed exposes the state to
// screen readers). Takes normal <input> props; `type` is managed here.
export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className">) {
  const { t } = useT();
  const [shown, setShown] = useState(false);

  return (
    <div className="relative">
      <input {...props} type={shown ? "text" : "password"} className={`${INPUT_CLASS} pr-12`} />
      <button
        type="button"
        onClick={() => setShown((value) => !value)}
        aria-label={t(shown ? "auth.hidePassword" : "auth.showPassword")}
        aria-pressed={shown}
        className="absolute inset-y-0 right-0 mt-2 flex w-12 items-center justify-center text-black/45 transition-colors hover:text-pink"
      >
        <i className={`fa-solid ${shown ? "fa-eye-slash" : "fa-eye"}`} aria-hidden="true" />
      </button>
    </div>
  );
}
