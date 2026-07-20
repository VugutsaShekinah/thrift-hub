import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ordersApi } from "../api/orders";
import { formatKES } from "../utils/currency";
import Spinner from "../components/ui/Spinner";
import Badge from "../components/ui/Badge";

export default function OrderDetailPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    ordersApi.getOrder(orderNumber).then((res) => setOrder(res.data));
  }, [orderNumber]);

  if (!order) return <Spinner full />;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{order.order_number}</h1>
        <Badge tone="brand">{order.status}</Badge>
      </div>

      <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="mb-2 font-semibold">Items</h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between border-b border-neutral-100 py-2 text-sm last:border-0 dark:border-neutral-800">
            <span>
              {item.title_snapshot} × {item.quantity}
            </span>
            <span>{formatKES(item.line_total_kes)}</span>
          </div>
        ))}
        <div className="mt-3 flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatKES(order.subtotal_kes)}</span>
          </div>
          {Number(order.discount_kes) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{formatKES(order.discount_kes)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{formatKES(order.shipping_fee_kes)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatKES(order.total_kes)}</span>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="mb-2 font-semibold">Delivery Address</h2>
        <p className="text-sm">{order.shipping_name}</p>
        <p className="text-sm text-neutral-500">
          {order.shipping_street}, {order.shipping_town}, {order.shipping_county}
        </p>
        <p className="text-sm text-neutral-500">{order.shipping_phone}</p>
      </section>

      <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="mb-2 font-semibold">Payment</h2>
        {order.payments.map((payment) => (
          <div key={payment.id} className="flex justify-between text-sm">
            <span className="capitalize">{payment.provider}</span>
            <Badge tone={payment.status === "success" ? "success" : "warning"}>{payment.status}</Badge>
          </div>
        ))}
      </section>
    </div>
  );
}
