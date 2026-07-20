import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ordersApi } from "../api/orders";
import { formatKES } from "../utils/currency";
import Spinner from "../components/ui/Spinner";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

const STATUS_TONES = {
  pending: "neutral",
  paid: "brand",
  processing: "brand",
  shipped: "warning",
  delivered: "success",
  cancelled: "danger",
  refunded: "danger",
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    ordersApi.listOrders().then((res) => setOrders(res.data.results));
  }, []);

  if (!orders) return <Spinner full />;

  if (orders.length === 0) {
    return <EmptyState title="No orders yet" description="Your past orders will appear here." />;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Order History</h1>
      <div className="flex flex-col gap-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            to={`/orders/${order.order_number}`}
            className="flex items-center justify-between rounded-xl border border-neutral-200 p-4 hover:shadow-sm dark:border-neutral-800"
          >
            <div>
              <p className="font-medium">{order.order_number}</p>
              <p className="text-sm text-neutral-500">
                {new Date(order.placed_at).toLocaleDateString("en-KE", { dateStyle: "medium" })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={STATUS_TONES[order.status] || "neutral"}>{order.status}</Badge>
              <span className="font-semibold">{formatKES(order.total_kes)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
