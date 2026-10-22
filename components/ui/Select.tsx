"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  id?: string;
  name: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { label, id, name, options, error, hint, required, disabled, placeholder, className, children, ...props },
    ref,
  ) {
    const fieldId = id ?? name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={fieldId} className="block text-sm font-medium text-ink mb-1.5">
            {label}
            {required && <span className="text-danger-600 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={fieldId}
          name={name}
          required={required}
          disabled={disabled}
          className={cn(
            "h-11 rounded-xl border border-brand-200 bg-white px-3.5 text-sm text-ink transition-colors duration-200",
            "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30",
            "disabled:bg-surface-muted disabled:cursor-not-allowed",
            error && "border-danger-500 focus:border-danger-500 focus:ring-danger-500/30",
            className,
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          {children}
        </select>
        {error && (
          <p id={`${fieldId}-error`} className="mt-1.5 text-sm text-danger-600" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${fieldId}-hint`} className="mt-1.5 text-sm text-ink-muted">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";