import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ordersApi } from "../../api/orders";
import { extractErrorMessage } from "../../api/client";
import { formatKES } from "../../utils/currency";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";

function NewCouponForm({ onCreated }) {
  const { register, handleSubmit, reset } = useForm({ defaultValues: { discount_type: "percentage" } });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await ordersApi.createCoupon(values);
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
      <h2 className="mb-3 font-semibold">Create Coupon</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
        <Input label="Code" required {...register("code")} />
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Type</span>
          <select {...register("discount_type")} className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed (KES)</option>
          </select>
        </label>
        <Input label="Discount value" type="number" step="0.01" required {...register("discount_value")} />
        <Input label="Min order (KES)" type="number" step="0.01" {...register("min_order_value_kes")} />
        <Input label="Max uses" type="number" {...register("max_uses")} />
        <Input label="Valid from" type="datetime-local" required {...register("valid_from")} />
        <Input label="Valid until" type="datetime-local" required {...register("valid_until")} />
        <div className="col-span-full">
          <Button type="submit" isLoading={isSubmitting}>
            Create Coupon
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState(null);

  const load = () => ordersApi.listCoupons().then((res) => setCoupons(res.data.results));

  useEffect(load, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Coupons & Promotions</h1>
      <NewCouponForm onCreated={load} />

      <Card className="overflow-x-auto p-5">
        <h2 className="mb-3 font-semibold">Coupons</h2>
        {!coupons ? (
          <Spinner />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500">
                <th className="pb-2">Code</th>
                <th className="pb-2">Discount</th>
                <th className="pb-2">Used</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="py-2 font-mono">{coupon.code}</td>
                  <td className="py-2">
                    {coupon.discount_type === "percentage"
                      ? `${coupon.discount_value}%`
                      : formatKES(coupon.discount_value)}
                  </td>
                  <td className="py-2">
                    {coupon.times_used}
                    {coupon.max_uses ? ` / ${coupon.max_uses}` : ""}
                  </td>
                  <td className="py-2">
                    <Badge tone={coupon.is_active ? "success" : "danger"}>
                      {coupon.is_active ? "Active" : "Inactive"}
                    </Badge>
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
