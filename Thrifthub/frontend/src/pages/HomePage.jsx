import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { catalogApi } from "../api/catalog";
import ProductGrid from "../features/shop/ProductGrid";
import Spinner from "../components/ui/Spinner";

export default function HomePage() {
  const [featured, setFeatured] = useState(null);
  const [newArrivals, setNewArrivals] = useState(null);

  useEffect(() => {
    catalogApi
      .listProducts({ is_featured: true, page_size: 8 })
      .then((res) => setFeatured(res.data.results));
    catalogApi
      .listProducts({ ordering: "-created_at", page_size: 8 })
      .then((res) => setNewArrivals(res.data.results));
  }, []);

  return (
    <div className="flex flex-col gap-14">
      <section className="flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 px-6 py-16 text-center text-white">
        <h1 className="text-3xl font-bold sm:text-4xl">Quality Mitumba, Delivered Across Kenya</h1>
        <p className="max-w-xl text-brand-50">
          Hand-picked second-hand clothing — inspected, graded, and priced fairly. New drops every week.
        </p>
        <Link
          to="/shop"
          className="rounded-lg bg-white px-5 py-3 text-base font-medium text-brand-700 hover:bg-brand-50"
        >
          Shop Now
        </Link>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Featured Picks</h2>
          <Link to="/shop?is_featured=true" className="text-sm text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        {featured ? <ProductGrid products={featured} /> : <Spinner full />}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">New Arrivals</h2>
          <Link to="/shop?ordering=-created_at" className="text-sm text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        {newArrivals ? <ProductGrid products={newArrivals} /> : <Spinner full />}
      </section>
    </div>
  );
}
