import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { inventoryApi } from "../../api/inventory";
import { catalogApi } from "../../api/catalog";
import { extractErrorMessage } from "../../api/client";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Spinner from "../../components/ui/Spinner";

function AdjustmentForm({ products, onSaved }) {
  const { register, handleSubmit, reset } = useForm({ defaultValues: { change_type: "adjustment" } });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await inventoryApi.createStockMovement({
        ...values,
        product: Number(values.product),
        quantity_delta: Number(values.quantity_delta),
      });
      reset();
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-5">
      <h2 className="mb-3 font-semibold">Manual Stock Adjustment</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Product</span>
          <select {...register("product")} required className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
            <option value="">Select…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Type</span>
          <select {...register("change_type")} className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
            <option value="adjustment">Adjustment</option>
            <option value="damage">Damage / write-off</option>
            <option value="return">Return</option>
          </select>
        </label>
        <Input label="Quantity change (+/-)" type="number" required {...register("quantity_delta")} />
        <Input label="Note" {...register("note")} />
        <div className="col-span-full">
          <Button type="submit" isLoading={isSubmitting}>
            Record Adjustment
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function AdminInventoryPage() {
  const [lowStock, setLowStock] = useState(null);
  const [products, setProducts] = useState([]);

  const load = () => {
    inventoryApi.lowStock().then((res) => setLowStock(res.data));
    catalogApi.listProducts({ page_size: 100 }).then((res) => setProducts(res.data.results));
  };

  useEffect(load, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Inventory</h1>

      <AdjustmentForm products={products} onSaved={load} />

      {!lowStock ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Low Stock</h2>
            {lowStock.low_stock.length === 0 ? (
              <p className="text-sm text-neutral-500">Nothing running low.</p>
            ) : (
              lowStock.low_stock.map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b border-neutral-100 py-2 text-sm last:border-0 dark:border-neutral-800">
                  <span>{p.title}</span>
                  <Badge tone="warning">{p.quantity} left</Badge>
                </div>
              ))
            )}
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Sold Out</h2>
            {lowStock.sold_out.length === 0 ? (
              <p className="text-sm text-neutral-500">No sold-out items.</p>
            ) : (
              lowStock.sold_out.map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b border-neutral-100 py-2 text-sm last:border-0 dark:border-neutral-800">
                  <span>{p.title}</span>
                  <Badge tone="danger">Sold out</Badge>
                </div>
              ))
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
