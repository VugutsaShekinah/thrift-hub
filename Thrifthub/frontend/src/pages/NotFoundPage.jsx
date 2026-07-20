import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-neutral-500">This page doesn't exist.</p>
      <Link to="/" className="text-brand-600 hover:underline">
        Back to home
      </Link>
    </div>
  );
}
