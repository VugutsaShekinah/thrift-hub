function Stars({ rating }) {
  return (
    <span aria-label={`${rating} out of 5 stars`} className="text-amber-500">
      {"★".repeat(rating)}
      <span className="text-neutral-300 dark:text-neutral-700">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default function ReviewList({ reviews }) {
  if (!reviews || reviews.length === 0) {
    return <p className="text-sm text-neutral-500">No reviews yet — be the first to review this item.</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {reviews.map((review) => (
        <li key={review.id} className="border-b border-neutral-100 pb-4 last:border-0 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="font-medium">{review.reviewer_name}</span>
            <Stars rating={review.rating} />
          </div>
          {review.comment && <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{review.comment}</p>}
        </li>
      ))}
    </ul>
  );
}
