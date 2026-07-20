export default function Footer() {
  return (
    <footer className="mt-16 border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-neutral-500 dark:text-neutral-400 sm:px-6">
        <p>&copy; {new Date().getFullYear()} ThriftHub KE. Quality mitumba, delivered across Kenya.</p>
      </div>
    </footer>
  );
}
