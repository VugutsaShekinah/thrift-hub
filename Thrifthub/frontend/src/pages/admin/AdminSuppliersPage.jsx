import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { catalogApi } from "../../api/catalog";
import { extractErrorMessage } from "../../api/client";
import { formatKES } from "../../utils/currency";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Spinner from "../../components/ui/Spinner";

function NewSupplierForm({ onCreated }) {
  const { register, handleSubmit, reset } = useForm();
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await catalogApi.createSupplier(values);
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
      <h2 className="mb-3 font-semibold">Add Supplier</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
        <Input label="Name" required {...register("name")} />
        <Input label="Contact person" {...register("contact_person")} />
        <Input label="Phone number" {...register("phone_number")} />
        <Input label="County" {...register("county")} />
        <div className="col-span-full">
          <Button type="submit" isLoading={isSubmitting}>
            Add Supplier
          </Button>
        </div>
      </form>
    </Card>
  );
}

function NewBatchForm({ suppliers, onCreated }) {
  const { register, handleSubmit, reset } = useForm();
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await catalogApi.createBaleBatch({ ...values, supplier: Number(values.supplier) });
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
      <h2 className="mb-3 font-semibold">Record Bale Batch Intake</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Supplier</span>
          <select {...register("supplier")} required className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
            <option value="">Select…</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <Input label="Batch code" required {...register("batch_code")} />
        <Input label="Date received" type="date" required {...register("date_received")} />
        <Input label="Cost (KES)" type="number" step="0.01" required {...register("cost_kes")} />
        <Input label="Weight (kg)" type="number" step="0.01" required {...register("weight_kg")} />
        <Input label="Estimated item count" type="number" required {...register("item_count_estimated")} />
        <div className="col-span-full">
          <Button type="submit" isLoading={isSubmitting}>
            Record Batch
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState(null);
  const [batches, setBatches] = useState(null);

  const load = () => {
    catalogApi.listSuppliers({ page_size: 100 }).then((res) => setSuppliers(res.data.results));
    catalogApi.listBaleBatches({ page_size: 100 }).then((res) => setBatches(res.data.results));
  };

  useEffect(load, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Suppliers & Bale Batches</h1>

      <NewSupplierForm onCreated={load} />
      {suppliers && <NewBatchForm suppliers={suppliers} onCreated={load} />}

      <Card className="overflow-x-auto p-5">
        <h2 className="mb-3 font-semibold">Bale Batches</h2>
        {!batches ? (
          <Spinner />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500">
                <th className="pb-2">Batch</th>
                <th className="pb-2">Supplier</th>
                <th className="pb-2">Cost</th>
                <th className="pb-2">Items Listed</th>
                <th className="pb-2">Cost / Item</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="py-2">{b.batch_code}</td>
                  <td className="py-2">{b.supplier_name}</td>
                  <td className="py-2">{formatKES(b.cost_kes)}</td>
                  <td className="py-2">{b.items_listed_count}</td>
                  <td className="py-2">{b.cost_per_item_kes ? formatKES(b.cost_per_item_kes) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
