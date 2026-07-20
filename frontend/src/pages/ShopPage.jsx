import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { catalogApi } from "../api/catalog";
import ProductGrid from "../features/shop/ProductGrid";
import Filters from "../features/shop/Filters";
import Pagination from "../components/ui/Pagination";
import Spinner from "../components/ui/Spinner";

const SORT_OPTIONS = [
  ["-created_at", "Newest"],
  ["selling_price_kes", "Price: Low to High"],
  ["-selling_price_kes", "Price: High to Low"],
  ["-view_count", "Most Popular"],
];

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const filters = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);
  const page = Number(filters.page || 1);

  useEffect(() => {
    catalogApi.listCategories({ page_size: 100 }).then((res) => setCategories(res.data.results));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    catalogApi
      .listProducts(filters)
      .then((res) => setData(res.data))
      .finally(() => setIsLoading(false));
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateFilters = (patch) => {
    const next = { ...filters, ...patch, page: undefined };
    Object.keys(next).forEach((key) => next[key] === undefined && delete next[key]);
    setSearchParams(next);
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
      <Filters categories={categories} value={filters} onChange={updateFilters} />

      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-neutral-500">
            {data ? `${data.count} item${data.count === 1 ? "" : "s"}` : "Loading…"}
          </p>
          <select
            value={filters.ordering || "-created_at"}
            onChange={(e) => updateFilters({ ordering: e.target.value })}
            className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            {SORT_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? <Spinner full /> : <ProductGrid products={data?.results} />}

        {data && (
          <div className="mt-6">
            <Pagination
              currentPage={page}
              numPages={data.num_pages}
              onPageChange={(p) => setSearchParams({ ...filters, page: p })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
