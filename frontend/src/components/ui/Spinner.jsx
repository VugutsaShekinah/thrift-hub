export default function Spinner({ full = false }) {
  const spinner = (
    <span
      className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500"
      role="status"
      aria-label="Loading"
    />
  );

  if (!full) return spinner;

  return <div className="flex min-h-[50vh] items-center justify-center">{spinner}</div>;
}
