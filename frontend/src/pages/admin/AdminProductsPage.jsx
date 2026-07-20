import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { catalogApi } from "../../api/catalog";
import { extractErrorMessage } from "../../api/client";
import { formatKES } from "../../utils/currency";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";

function NewProductForm({ categories, baleBatches, onCreated }) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { condition: "good", gender: "unisex", quantity: 1 },
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await catalogApi.createProduct({
        ...values,
        category: Number(values.category),
        bale_batch: values.bale_batch ? Number(values.bale_batch) : null,
        quantity: Number(values.quantity),
      });
      reset();
      onCreated();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-5">
      <h2 className="mb-3 font-semibold">Add Product</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
        <Input label="Title" required {...register("title")} />
        <Input label="Brand" {...register("brand")} />
        <Input label="Size" {...register("size")} />
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Category</span>
          <select {...register("category")} required className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Bale Batch</span>
          <select {...register("bale_batch")} className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
            <option value="">None</option>
            {baleBatches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batch_code}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Condition</span>
          <select {...register("condition")} className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
            <option value="new_with_tags">New with tags</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Gender</span>
          <select {...register("gender")} className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
            <option value="unisex">Unisex</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="kids">Kids</option>
          </select>
        </label>
        <Input label="Price (KES)" type="number" step="0.01" required {...register("selling_price_kes")} />
        <Input label="Quantity" type="number" required {...register("quantity")} />
        <label className="flex items-center gap-2 self-end text-sm">
          <input type="checkbox" {...register("is_featured")} /> Featured
        </label>
        <div className="col-span-full">
          <Button type="submit" isLoading={isSubmitting}>
            Create Product
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [baleBatches, setBaleBatches] = useState([]);

  const loadProducts = () => catalogApi.listProducts({ page_size: 50 }).then((res) => setProducts(res.data.results));

  useEffect(() => {
    loadProducts();
    catalogApi.listCategories({ page_size: 100 }).then((res) => setCategories(res.data.results));
    catalogApi.listBaleBatches({ page_size: 100 }).then((res) => setBaleBatches(res.data.results));
  }, []);

  const toggleActive = async (product) => {
    await catalogApi.updateProduct(product.slug, { is_active: !product.is_active });
    loadProducts();
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Products</h1>
      <NewProductForm categories={categories} baleBatches={baleBatches} onCreated={loadProducts} />

      <Card className="overflow-x-auto p-5">
        {!products ? (
          <Spinner />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500">
                <th className="pb-2">Title</th>
                <th className="pb-2">Price</th>
                <th className="pb-2">Qty</th>
                <th className="pb-2">Status</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="py-2">{product.title}</td>
                  <td className="py-2">{formatKES(product.selling_price_kes)}</td>
                  <td className="py-2">{product.quantity}</td>
                  <td className="py-2">
                    <Badge tone={product.is_active ? "success" : "danger"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="py-2 text-right">
                    <button onClick={() => toggleActive(product)} className="text-brand-600 hover:underline">
                      {product.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
