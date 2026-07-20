import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "thrifthub_cart";

function readStoredCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      // Second-hand items are almost always unique (quantity=1), so adding
      // an already-present product just nudges quantity up to the cap
      // rather than silently no-op'ing — the server re-validates stock at
      // checkout regardless (see apps/orders/services.py checkout()).
      const maxQuantity = product.quantity ?? 1;
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, maxQuantity) }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          slug: product.slug,
          title: product.title,
          price: Number(product.selling_price_kes),
          image: product.primary_image ?? null,
          quantity: 1,
          maxQuantity,
        },
      ];
    });
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.maxQuantity)) }
          : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const value = { items, addItem, removeItem, updateQuantity, clearCart, subtotal, itemCount };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
