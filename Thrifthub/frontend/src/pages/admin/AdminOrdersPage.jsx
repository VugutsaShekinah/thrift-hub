import { useEffect, useState } from "react";
import { ordersApi } from "../../api/orders";
import { extractErrorMessage } from "../../api/client";
import { formatKES } from "../../utils/currency";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";

const NEXT_STATUSES = {
  pending: ["paid", "processing", "cancelled"],
  paid: ["processing", "cancelled", "refunded"],
  processing: ["shipped", "cancelled", "refunded"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);

  const load = () => ordersApi.listOrders({ page_size: 50 }).then((res) => setOrders(res.data.results));

  useEffect(load, []);

  const handleStatusChange = async (order, status) => {
    setError(null);
    try {
      await ordersApi.updateOrderStatus(order.order_number, status);
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  if (!orders) return <Spinner full />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Orders</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Card className="overflow-x-auto p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500">
              <th className="pb-2">Order</th>
              <th className="pb-2">Total</th>
              <th className="pb-2">Payment</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Update</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const nextOptions = NEXT_STATUSES[order.status] || [];
              return (
                <tr key={order.id} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="py-2">{order.order_number}</td>
                  <td className="py-2">{formatKES(order.total_kes)}</td>
                  <td className="py-2 capitalize">{order.payment_method}</td>
                  <td className="py-2">
                    <Badge tone="brand">{order.status}</Badge>
                  </td>
                  <td className="py-2">
                    {nextOptions.length > 0 ? (
                      <select
                        defaultValue=""
                        onChange={(e) => e.target.value && handleStatusChange(order, e.target.value)}
                        className="rounded-lg border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                      >
                        <option value="" disabled>
                          Move to…
                        </option>
                        {nextOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-neutral-400">Final</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
