import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ordersApi } from "../api/orders";
import { formatKES } from "../utils/currency";
import Spinner from "../components/ui/Spinner";
import Badge from "../components/ui/Badge";

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    ordersApi.getOrder(orderNumber).then((res) => setOrder(res.data));
  }, [orderNumber]);

  if (!order) return <Spinner full />;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl dark:bg-green-900/40">
        ✓
      </div>
      <h1 className="text-2xl font-bold">Thank you for your order!</h1>
      <p className="text-neutral-500">
        Order <span className="font-medium text-neutral-800 dark:text-neutral-200">{order.order_number}</span> has
        been placed. <Badge tone="brand">{order.status}</Badge>
      </p>
      <div className="w-full rounded-xl border border-neutral-200 p-4 text-left dark:border-neutral-800">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between py-1 text-sm">
            <span>
              {item.title_snapshot} × {item.quantity}
            </span>
            <span>{formatKES(item.line_total_kes)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-neutral-200 pt-2 font-semibold dark:border-neutral-800">
          <span>Total</span>
          <span>{formatKES(order.total_kes)}</span>
        </div>
      </div>
      <div className="flex gap-3">
        <Link to="/orders" className="text-brand-600 hover:underline">
          View order history
        </Link>
        <Link to="/shop" className="text-brand-600 hover:underline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
