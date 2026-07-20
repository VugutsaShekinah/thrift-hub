import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { catalogApi } from "../api/catalog";
import Spinner from "../components/ui/Spinner";

export default function CategoriesPage() {
  const [categories, setCategories] = useState(null);

  useEffect(() => {
    catalogApi.listCategories({ page_size: 100 }).then((res) => setCategories(res.data.results));
  }, []);

  if (!categories) return <Spinner full />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Shop by Category</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/shop?category=${category.slug}`}
            className="flex flex-col items-center gap-3 rounded-xl border border-neutral-200 p-6 text-center hover:shadow-md dark:border-neutral-800"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl dark:bg-brand-900/40">
              🧺
            </div>
            <span className="font-medium">{category.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
