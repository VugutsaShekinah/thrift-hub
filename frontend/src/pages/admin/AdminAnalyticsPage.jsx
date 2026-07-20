import { useEffect, useState } from "react";
import { analyticsApi } from "../../api/analytics";
import { formatKES } from "../../utils/currency";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";

function RevenueBarChart({ daily }) {
  if (!daily || daily.length === 0) {
    return <p className="text-sm text-neutral-500">No sales in this period yet.</p>;
  }
  const max = Math.max(...daily.map((d) => Number(d.revenue_kes)), 1);

  return (
    <div className="flex h-40 items-end gap-1">
      {daily.map((d) => (
        <div key={d.day} className="group relative flex flex-1 flex-col items-center justify-end">
          <div
            className="w-full rounded-t bg-brand-400 transition-colors group-hover:bg-brand-500"
            style={{ height: `${(Number(d.revenue_kes) / max) * 100}%`, minHeight: 2 }}
          />
          <span className="pointer-events-none absolute -top-8 hidden whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-xs text-white group-hover:block">
            {d.day}: {formatKES(d.revenue_kes)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const [sales, setSales] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [suppliers, setSuppliers] = useState(null);
  const [customers, setCustomers] = useState(null);

  useEffect(() => {
    analyticsApi.sales(period).then((res) => setSales(res.data));
    analyticsApi.customers(period).then((res) => setCustomers(res.data));
  }, [period]);

  useEffect(() => {
    analyticsApi.inventory().then((res) => setInventory(res.data));
    analyticsApi.suppliers().then((res) => setSuppliers(res.data));
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {!sales ? (
        <Spinner full />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-5">
              <p className="text-sm text-neutral-500">Revenue</p>
              <p className="mt-1 text-2xl font-bold">{formatKES(sales.totals.revenue_kes)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-neutral-500">Orders</p>
              <p className="mt-1 text-2xl font-bold">{sales.totals.order_count}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-neutral-500">Avg. Order Value</p>
              <p className="mt-1 text-2xl font-bold">{formatKES(sales.totals.average_order_value_kes)}</p>
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="mb-4 font-semibold">Revenue Trend</h2>
            <RevenueBarChart daily={sales.daily} />
          </Card>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-3 font-semibold">Top Products</h2>
              <table className="w-full text-sm">
                <tbody>
                  {sales.top_products.map((p) => (
                    <tr key={p.product_id} className="border-b border-neutral-100 last:border-0 dark:border-neutral-800">
                      <td className="py-2">{p.title_snapshot}</td>
                      <td className="py-2 text-neutral-500">{p.units_sold} sold</td>
                      <td className="py-2 text-right font-medium">{formatKES(p.revenue_kes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card className="p-5">
              <h2 className="mb-3 font-semibold">Top Categories</h2>
              <table className="w-full text-sm">
                <tbody>
                  {sales.top_categories.map((c) => (
                    <tr key={c.category} className="border-b border-neutral-100 last:border-0 dark:border-neutral-800">
                      <td className="py-2">{c.category || "Uncategorized"}</td>
                      <td className="py-2 text-right font-medium">{formatKES(c.revenue_kes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </>
      )}

      {inventory && (
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Inventory Overview</h2>
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-neutral-500">Active Products</p>
              <p className="text-lg font-bold">{inventory.active_product_count}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Low Stock</p>
              <p className="text-lg font-bold">{inventory.low_stock_count}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Sold Out</p>
              <p className="text-lg font-bold">{inventory.sold_out_count}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Stock Value</p>
              <p className="text-lg font-bold">{formatKES(inventory.total_stock_value_kes)}</p>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500">
                <th className="pb-2">Category</th>
                <th className="pb-2">Products</th>
                <th className="pb-2 text-right">Stock Value</th>
              </tr>
            </thead>
            <tbody>
              {inventory.by_category.map((c) => (
                <tr key={c.category_name} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="py-2">{c.category_name || "Uncategorized"}</td>
                  <td className="py-2">{c.product_count}</td>
                  <td className="py-2 text-right">{formatKES(c.stock_value_kes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {customers && (
        <Card className="overflow-x-auto p-5">
          <h2 className="mb-3 font-semibold">Customer Analytics</h2>
          <div className="mb-4 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-neutral-500">Total Customers</p>
              <p className="text-lg font-bold">{customers.total_customers}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">New This Period</p>
              <p className="text-lg font-bold">{customers.new_customers}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Repeat Customers</p>
              <p className="text-lg font-bold">{customers.repeat_customers}</p>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500">
                <th className="pb-2">Customer</th>
                <th className="pb-2">Orders</th>
                <th className="pb-2 text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {customers.top_customers.map((c) => (
                <tr key={c["user__id"]} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="py-2">
                    {c["user__first_name"]} {c["user__last_name"]}
                    <span className="ml-1 text-neutral-500">({c["user__email"]})</span>
                  </td>
                  <td className="py-2">{c.order_count}</td>
                  <td className="py-2 text-right">{formatKES(c.total_spent_kes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {suppliers && (
        <Card className="overflow-x-auto p-5">
          <h2 className="mb-3 font-semibold">Supplier Performance</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500">
                <th className="pb-2">Supplier</th>
                <th className="pb-2">Batches</th>
                <th className="pb-2">Items Listed</th>
                <th className="pb-2">Items Sold</th>
                <th className="pb-2 text-right">Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="py-2">{s.name}</td>
                  <td className="py-2">{s.batch_count}</td>
                  <td className="py-2">{s.items_listed}</td>
                  <td className="py-2">{s.items_sold}</td>
                  <td className="py-2 text-right">{formatKES(s.total_cost_kes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
