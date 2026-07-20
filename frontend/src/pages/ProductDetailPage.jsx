import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { catalogApi } from "../api/catalog";
import { engagementApi } from "../api/engagement";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../context/CartContext";
import { formatKES } from "../utils/currency";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import ProductGrid from "../features/shop/ProductGrid";
import ReviewList from "../features/reviews/ReviewList";
import ReviewForm from "../features/reviews/ReviewForm";
import { extractErrorMessage } from "../api/client";

const CONDITION_LABELS = {
  new_with_tags: "New with tags",
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
};

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [wishlistMessage, setWishlistMessage] = useState(null);
  const [addedMessage, setAddedMessage] = useState(false);

  const loadReviews = () => {
    catalogApi.productReviews(slug).then((res) => setReviews(res.data.results ?? res.data));
  };

  useEffect(() => {
    setProduct(null);
    catalogApi.getProduct(slug).then((res) => setProduct(res.data));
    catalogApi.relatedProducts(slug).then((res) => setRelated(res.data));
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (!product) return <Spinner full />;

  const handleAddToCart = () => {
    addItem({ ...product, id: product.id, primary_image: product.images?.[0]?.image });
    setAddedMessage(true);
    setTimeout(() => setAddedMessage(false), 2000);
  };

  const handleWishlist = async () => {
    try {
      await engagementApi.addToWishlist(product.id);
      setWishlistMessage("Added to wishlist");
    } catch (err) {
      setWishlistMessage(extractErrorMessage(err));
    }
    setTimeout(() => setWishlistMessage(null), 2500);
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
            {product.images?.length > 0 ? (
              <img
                src={product.images[activeImage]?.image}
                alt={product.images[activeImage]?.alt_text || product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl text-neutral-300">👕</div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(idx)}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${
                    idx === activeImage ? "border-brand-500" : "border-transparent"
                  }`}
                >
                  <img src={img.image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            {product.is_featured && <Badge tone="brand">Featured</Badge>}
            <Badge>{CONDITION_LABELS[product.condition] || product.condition}</Badge>
            {product.is_low_stock && <Badge tone="warning">Only {product.quantity} left</Badge>}
          </div>
          <h1 className="text-2xl font-bold">{product.title}</h1>
          {product.average_rating && (
            <p className="text-sm text-amber-500">
              ★ {product.average_rating} ({product.review_count} review{product.review_count === 1 ? "" : "s"})
            </p>
          )}
          <p className="text-2xl font-semibold text-brand-600 dark:text-brand-400">
            {formatKES(product.selling_price_kes)}
          </p>
          <dl className="grid grid-cols-2 gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            {product.brand && (
              <div>
                <dt className="font-medium text-neutral-800 dark:text-neutral-200">Brand</dt>
                <dd>{product.brand}</dd>
              </div>
            )}
            {product.size && (
              <div>
                <dt className="font-medium text-neutral-800 dark:text-neutral-200">Size</dt>
                <dd>{product.size}</dd>
              </div>
            )}
            {product.color && (
              <div>
                <dt className="font-medium text-neutral-800 dark:text-neutral-200">Color</dt>
                <dd>{product.color}</dd>
              </div>
            )}
            {product.material && (
              <div>
                <dt className="font-medium text-neutral-800 dark:text-neutral-200">Material</dt>
                <dd>{product.material}</dd>
              </div>
            )}
          </dl>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{product.description}</p>

          <div className="mt-2 flex gap-3">
            <Button onClick={handleAddToCart} disabled={product.quantity === 0} size="lg">
              {product.quantity === 0 ? "Sold Out" : addedMessage ? "Added ✓" : "Add to Cart"}
            </Button>
            <Button variant="secondary" size="lg" onClick={handleWishlist} disabled={!isAuthenticated}>
              ♥ Wishlist
            </Button>
          </div>
          {wishlistMessage && <p className="text-sm text-neutral-500">{wishlistMessage}</p>}
          {!isAuthenticated && <p className="text-xs text-neutral-500">Sign in to save items to your wishlist.</p>}
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Reviews</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <ReviewList reviews={reviews} />
          {isAuthenticated && <ReviewForm productId={product.id} onSubmitted={loadReviews} />}
        </div>
      </section>

      {related.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
