const TONES = {
  neutral: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  brand: "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200",
  success: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  danger: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export default function Badge({ tone = "neutral", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
