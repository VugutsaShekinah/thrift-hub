import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { engagementApi } from "../api/engagement";
import { useCart } from "../context/CartContext";
import { formatKES } from "../utils/currency";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Spinner from "../components/ui/Spinner";

export default function WishlistPage() {
  const [items, setItems] = useState(null);
  const { addItem } = useCart();

  const load = () => engagementApi.listWishlist().then((res) => setItems(res.data.results));

  useEffect(() => {
    load();
  }, []);

  const handleRemove = async (id) => {
    await engagementApi.removeFromWishlist(id);
    load();
  };

  if (!items) return <Spinner full />;

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your wishlist is empty"
        description="Save items you love while browsing so you can find them again later."
        action={
          <Link to="/shop" className="text-brand-600 hover:underline">
            Start shopping
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My Wishlist</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
            <Link to={`/products/${item.product.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
              {item.product.primary_image && (
                <img src={item.product.primary_image} alt={item.product.title} className="h-full w-full object-cover" />
              )}
            </Link>
            <div className="flex flex-1 flex-col gap-1">
              <Link to={`/products/${item.product.slug}`} className="line-clamp-2 text-sm font-medium">
                {item.product.title}
              </Link>
              <p className="font-semibold text-brand-600 dark:text-brand-400">
                {formatKES(item.product.selling_price_kes)}
              </p>
              <div className="mt-auto flex gap-2">
                <Button size="sm" onClick={() => addItem(item.product)}>
                  Add to Cart
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleRemove(item.id)}>
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
