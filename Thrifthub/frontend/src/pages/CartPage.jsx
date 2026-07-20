import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../auth/AuthContext";
import { formatKES } from "../utils/currency";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Browse the shop to find your next favorite piece."
        action={
          <Link to="/shop" className="text-brand-600 hover:underline">
            Start shopping
          </Link>
        }
      />
    );
  }

  const handleCheckout = () => {
    navigate(isAuthenticated ? "/checkout" : "/login", { state: { from: { pathname: "/checkout" } } });
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Your Cart</h1>
        {items.map((item) => (
          <div key={item.productId} className="flex gap-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
              {item.image && <img src={item.image} alt={item.title} className="h-full w-full object-cover" />}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <Link to={`/products/${item.slug}`} className="text-sm font-medium">
                {item.title}
              </Link>
              <p className="font-semibold text-brand-600 dark:text-brand-400">{formatKES(item.price)}</p>
              <div className="mt-auto flex items-center gap-3">
                <label className="text-sm text-neutral-500">
                  Qty:
                  <input
                    type="number"
                    min={1}
                    max={item.maxQuantity}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
                    className="ml-2 w-16 rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </label>
                <button onClick={() => removeItem(item.productId)} className="text-sm text-red-600 hover:underline">
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <aside className="h-fit rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatKES(subtotal)}</span>
        </div>
        <p className="mt-1 text-xs text-neutral-500">Shipping and any coupon are calculated at checkout.</p>
        <Button onClick={handleCheckout} className="mt-4 w-full" size="lg">
          Proceed to Checkout
        </Button>
      </aside>
    </div>
  );
}
