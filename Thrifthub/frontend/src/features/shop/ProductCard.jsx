import { Link } from "react-router-dom";
import Badge from "../../components/ui/Badge";
import { formatKES } from "../../utils/currency";

const CONDITION_LABELS = {
  new_with_tags: "New with tags",
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
};

export default function ProductCard({ product }) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="aspect-square w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {product.primary_image ? (
          <img
            src={product.primary_image}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-neutral-300 dark:text-neutral-700">
            👕
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-center gap-1.5">
          {product.is_featured && <Badge tone="brand">Featured</Badge>}
          <Badge tone="neutral">{CONDITION_LABELS[product.condition] || product.condition}</Badge>
        </div>
        <h3 className="line-clamp-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {product.title}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {product.brand} {product.size && `· Size ${product.size}`}
        </p>
        <p className="mt-auto font-semibold text-brand-600 dark:text-brand-400">
          {formatKES(product.selling_price_kes)}
        </p>
      </div>
    </Link>
  );
}
