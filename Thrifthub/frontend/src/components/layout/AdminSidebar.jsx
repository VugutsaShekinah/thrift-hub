import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/inventory", label: "Inventory" },
  { to: "/admin/suppliers", label: "Suppliers" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/coupons", label: "Coupons & Promotions" },
  { to: "/admin/analytics", label: "Analytics" },
];

export default function AdminSidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-neutral-200 dark:border-neutral-800">
      <nav className="flex flex-col gap-1 p-4">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium ${
                isActive
                  ? "bg-brand-500 text-white"
                  : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
