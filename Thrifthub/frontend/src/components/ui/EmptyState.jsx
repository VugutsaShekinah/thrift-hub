export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-12 text-center">
      <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{title}</h3>
      {description && <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">{description}</p>}
      {action}
    </div>
  );
}
