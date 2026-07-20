import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { ordersApi } from "../api/orders";
import { extractErrorMessage } from "../api/client";
import { useCart } from "../context/CartContext";
import { formatKES } from "../utils/currency";
import AddressSelector from "../features/checkout/AddressSelector";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import { Link } from "react-router-dom";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState(null);
  const [addressId, setAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponPreview, setCouponPreview] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [error, setError] = useState(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    authApi.addresses().then((res) => {
      setAddresses(res.data.results);
      const defaultAddress = res.data.results.find((a) => a.is_default) || res.data.results[0];
      if (defaultAddress) setAddressId(defaultAddress.id);
    });
  }, []);

  const handleAddNewAddress = async (form) => {
    const { data } = await authApi.createAddress(form);
    setAddresses((prev) => [...prev, data]);
    setAddressId(data.id);
  };

  const handleApplyCoupon = async () => {
    setCouponError(null);
    setCouponPreview(null);
    try {
      const { data } = await ordersApi.validateCoupon({ code: couponCode, subtotal: subtotal.toFixed(2) });
      setCouponPreview(data);
    } catch (err) {
      setCouponError(extractErrorMessage(err));
    }
  };

  const handlePlaceOrder = async () => {
    setError(null);
    setIsPlacingOrder(true);
    try {
      const payload = {
        items: items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
        payment_method: paymentMethod,
        address_id: addressId,
        ...(couponPreview ? { coupon_code: couponCode } : {}),
        ...(paymentMethod === "mpesa" ? { mpesa_phone: mpesaPhone } : {}),
      };
      const { data } = await ordersApi.checkout(payload);
      clearCart();
      navigate(`/orders/${data.order_number}/confirmation`, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState
        title="Nothing to check out"
        description="Add items to your cart before checking out."
        action={
          <Link to="/shop" className="text-brand-600 hover:underline">
            Browse the shop
          </Link>
        }
      />
    );
  }

  if (!addresses) return <Spinner full />;

  const discount = Number(couponPreview?.discount_kes || 0);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-8">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Delivery Address</h2>
          <AddressSelector
            addresses={addresses}
            selectedId={addressId}
            onSelect={setAddressId}
            onAddNew={handleAddNewAddress}
          />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Payment Method</h2>
          <div className="flex gap-3">
            {[
              ["mpesa", "M-Pesa"],
              ["cod", "Cash on Delivery"],
            ].map(([value, label]) => (
              <label
                key={value}
                className={`flex-1 cursor-pointer rounded-lg border p-3 text-center text-sm ${
                  paymentMethod === value ? "border-brand-500 ring-1 ring-brand-500" : "border-neutral-300 dark:border-neutral-700"
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  className="sr-only"
                  checked={paymentMethod === value}
                  onChange={() => setPaymentMethod(value)}
                />
                {label}
              </label>
            ))}
          </div>
          {paymentMethod === "mpesa" && (
            <div className="mt-3 max-w-xs">
              <Input
                label="M-Pesa phone number"
                placeholder="+2547XXXXXXXX"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
              />
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Coupon</h2>
          <div className="flex max-w-xs gap-2">
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Coupon code"
            />
            <Button variant="secondary" onClick={handleApplyCoupon} disabled={!couponCode}>
              Apply
            </Button>
          </div>
          {couponError && <p className="mt-1 text-sm text-red-600">{couponError}</p>}
          {couponPreview && (
            <p className="mt-1 text-sm text-green-600">
              Coupon applied — you save {formatKES(couponPreview.discount_kes)}
            </p>
          )}
        </section>
      </div>

      <aside className="h-fit rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatKES(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{formatKES(discount)}</span>
            </div>
          )}
          <p className="text-xs text-neutral-500">Shipping fee is calculated after placing the order.</p>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <Button
          onClick={handlePlaceOrder}
          isLoading={isPlacingOrder}
          disabled={!addressId}
          className="mt-4 w-full"
          size="lg"
        >
          Place Order
        </Button>
      </aside>
    </div>
  );
}
