export default function Pagination({ currentPage, numPages, onPageChange }) {
  if (numPages <= 1) return null;

  const pages = Array.from({ length: numPages }, (_, i) => i + 1).filter(
    (page) => page === 1 || page === numPages || Math.abs(page - currentPage) <= 1
  );

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-md px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        Previous
      </button>
      {pages.map((page, idx) => (
        <span key={page} className="flex items-center">
          {idx > 0 && pages[idx - 1] !== page - 1 && <span className="px-1 text-neutral-400">…</span>}
          <button
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 text-sm ${
              page === currentPage
                ? "bg-brand-500 text-white"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            {page}
          </button>
        </span>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === numPages}
        className="rounded-md px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        Next
      </button>
    </nav>
  );
}
