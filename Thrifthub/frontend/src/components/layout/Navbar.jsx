import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useCart } from "../../context/CartContext";

export default function Navbar() {
  const { isAuthenticated, isStaff, user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (event) => {
    event.preventDefault();
    navigate(search ? `/shop?search=${encodeURIComponent(search)}` : "/shop");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="shrink-0 text-lg font-bold text-brand-600 dark:text-brand-400">
          ThriftHub <span className="text-neutral-900 dark:text-neutral-100">KE</span>
        </Link>

        <form onSubmit={handleSearch} className="hidden flex-1 max-w-md md:block">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jeans, jackets, brands…"
            aria-label="Search products"
            className="w-full rounded-full border border-neutral-300 px-4 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </form>

        <nav className="hidden items-center gap-4 text-sm font-medium sm:flex">
          <Link to="/shop" className="hover:text-brand-600 dark:hover:text-brand-400">
            Shop
          </Link>
          <Link to="/categories" className="hover:text-brand-600 dark:hover:text-brand-400">
            Categories
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link to="/wishlist" aria-label="Wishlist" className="p-1.5 hover:text-brand-600 dark:hover:text-brand-400">
            ♥
          </Link>
          <Link to="/cart" aria-label="Cart" className="relative p-1.5 hover:text-brand-600 dark:hover:text-brand-400">
            🛒
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] text-white">
                {itemCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium dark:bg-neutral-800"
              >
                {user?.first_name || "Account"}
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    Profile
                  </Link>
                  <Link to="/orders" className="block px-4 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    Order History
                  </Link>
                  {isStaff && (
                    <Link to="/admin" className="block px-4 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800">
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => logout()}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-brand-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
