export default function Card({ className = "", children, ...props }) {
  return (
    <div
      className={`rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
