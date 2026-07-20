import { forwardRef } from "react";

const Input = forwardRef(function Input({ label, error, id, className = "", ...props }, ref) {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        aria-invalid={Boolean(error)}
        className={`rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-900 dark:text-neutral-100 focus:border-brand-500 ${
          error ? "border-red-500" : "border-neutral-300 dark:border-neutral-700"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
});

export default Input;
