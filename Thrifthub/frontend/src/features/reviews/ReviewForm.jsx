import { useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../../components/ui/Button";
import { engagementApi } from "../../api/engagement";
import { extractErrorMessage } from "../../api/client";

export default function ReviewForm({ productId, onSubmitted }) {
  const { register, handleSubmit, reset } = useForm({ defaultValues: { rating: 5, comment: "" } });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await engagementApi.createReview({
        product_id: productId,
        rating: Number(values.rating),
        comment: values.comment,
      });
      reset();
      onSubmitted?.();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h3 className="font-semibold">Write a review</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <label className="flex items-center gap-2 text-sm">
        Rating
        <select {...register("rating")} className="rounded-lg border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900">
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </label>
      <textarea
        {...register("comment")}
        placeholder="How was the fit, quality, and condition?"
        rows={3}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
      <Button type="submit" isLoading={isSubmitting} className="self-start">
        Submit review
      </Button>
      <p className="text-xs text-neutral-500">
        You can only review products from orders that have been delivered to you.
      </p>
    </form>
  );
}
