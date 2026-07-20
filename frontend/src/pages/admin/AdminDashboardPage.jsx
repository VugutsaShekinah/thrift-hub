import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { analyticsApi } from "../../api/analytics";
import { inventoryApi } from "../../api/inventory";
import { formatKES } from "../../utils/currency";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";

function StatTile({ label, value, to }) {
  const content = (
    <Card className="p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </Card>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function AdminDashboardPage() {
  const [sales, setSales] = useState(null);
  const [lowStock, setLowStock] = useState(null);

  useEffect(() => {
    analyticsApi.sales("30d").then((res) => setSales(res.data));
    inventoryApi.lowStock().then((res) => setLowStock(res.data));
  }, []);

  if (!sales || !lowStock) return <Spinner full />;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Revenue (30d)" value={formatKES(sales.totals.revenue_kes)} to="/admin/analytics" />
        <StatTile label="Orders (30d)" value={sales.totals.order_count} to="/admin/orders" />
        <StatTile label="Low Stock" value={lowStock.low_stock.length} to="/admin/inventory" />
        <StatTile label="Sold Out" value={lowStock.sold_out.length} to="/admin/inventory" />
      </div>

      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Top Products (30d)</h2>
        <table className="w-full text-sm">
          <tbody>
            {sales.top_products.map((product) => (
              <tr key={product.product_id} className="border-b border-neutral-100 last:border-0 dark:border-neutral-800">
                <td className="py-2">{product.title_snapshot}</td>
                <td className="py-2 text-neutral-500">{product.units_sold} sold</td>
                <td className="py-2 text-right font-medium">{formatKES(product.revenue_kes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
