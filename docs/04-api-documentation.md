# ThriftHub KE — API Documentation

Base URL (dev): `http://127.0.0.1:8000/api/` (proxied through the frontend at `/api` — see
`vite.config.js`). All request/response bodies are JSON unless noted.

A ready-to-import Postman collection is at [`backend/postman_collection.json`](../backend/postman_collection.json).
The DRF browsable API is also available at every endpoint URL when visited in a browser during dev.

## Conventions

- **Pagination** — every list endpoint returns:
  ```json
  { "count": 42, "num_pages": 3, "current_page": 1, "next": "...", "previous": null, "results": [...] }
  ```
  Override page size with `?page_size=N` (capped at 100).
- **Errors** — DRF validation errors return `400` with a field→message map, e.g.
  `{"email": ["This field is required."]}`. Business-rule violations (see `apps/core/exceptions.py`)
  return `400` with `{"detail": "...", "code": "insufficient_stock"}` — check `code` programmatically,
  `detail` is the human-readable message.
- **Auth header** — `Authorization: Bearer <access_token>` on every request that needs it.
- **Filtering/search/ordering** — list endpoints support `django-filter` query params (documented
  per-resource below), plus `?search=` (DRF `SearchFilter`) and `?ordering=field` /
  `?ordering=-field` where noted.

## Authentication flow

See `docs/02-system-design.md` §6 for the full rationale. In short:

1. `POST /auth/register/` or `POST /auth/login/` → JSON body has `access` + `user`; the
   `refresh_token` is set as an **httpOnly cookie** (not in the JSON body — never store it in
   `localStorage`).
2. Send `Authorization: Bearer <access>` on subsequent requests.
3. On a `401`, call `POST /auth/token/refresh/` (browser sends the cookie automatically) to get
   a new `access` token, then retry the original request. The frontend's Axios interceptor
   (`frontend/src/api/client.js`) already does this for you.
4. `POST /auth/logout/` blacklists the refresh token and clears the cookie.

## Auth & Accounts

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/auth/register/` | Public | `email, password, phone_number, first_name, last_name`. Phone must match `+2547XXXXXXXX` / `+2541XXXXXXXX`. Auto-logs in. |
| POST | `/auth/login/` | Public | `email, password` |
| POST | `/auth/logout/` | Authenticated | Blacklists refresh token |
| POST | `/auth/token/refresh/` | Cookie | No body needed |
| POST | `/auth/password-reset/` | Public | `{"email": "..."}` — always 200 regardless of whether the email exists (prevents enumeration) |
| POST | `/auth/password-reset/confirm/` | Public | `{"uid", "token", "new_password"}` |
| GET/PATCH | `/accounts/me/` | Authenticated | Profile fields + nested `profile` (gender, DOB, loyalty_points, newsletter_opt_in) |
| POST | `/accounts/change-password/` | Authenticated | `{"current_password", "new_password"}` |
| GET/POST | `/accounts/addresses/` | Authenticated | Scoped to the requesting user only |
| PATCH/DELETE | `/accounts/addresses/{id}/` | Authenticated (owner) | 404 (not 403) if it belongs to someone else — existence isn't leaked |

## Catalog

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/catalog/categories/` | Public | `?parent=`, `?is_active=`, `?search=` |
| POST/PATCH/DELETE | `/catalog/categories/` | Staff | |
| GET | `/catalog/products/` | Public (active only) / Staff (all) | Filters: `category` (slug), `size`, `brand`, `condition`, `gender`, `price_min`, `price_max`, `is_featured`. `?search=` hits title/description/brand. `?ordering=selling_price_kes,-created_at,-view_count` |
| GET | `/catalog/products/{slug}/` | Public/Staff | Increments `view_count` on each retrieve |
| GET | `/catalog/products/{slug}/related/` | Public | Same category, up to 8 |
| GET | `/catalog/products/{slug}/reviews/` | Public | Approved reviews only |
| POST | `/catalog/products/{slug}/images/` | Staff | multipart form: `image`, `alt_text`, `is_primary`, `sort_order` |
| POST/PATCH/DELETE | `/catalog/products/` | Staff | See `ProductWriteSerializer` for writable fields |
| GET/POST/PATCH/DELETE | `/catalog/suppliers/` | **Staff only (read + write)** | Not public — back-office data |
| GET/POST/PATCH/DELETE | `/catalog/bale-batches/` | Staff only | `items_listed_count`, `cost_per_item_kes` are computed read-only fields |

## Inventory (staff only)

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/inventory/low-stock/` | `{"low_stock": [...], "sold_out": [...]}` — quantity 1–2 vs. 0 |
| GET/POST | `/inventory/stock-movements/` | Ledger is append-only — no PATCH/DELETE. `POST` runs through `inventory.services.adjust_stock`, which also updates `Product.quantity` atomically |

## Orders

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/orders/checkout/` | Authenticated | See request/response example below |
| GET | `/orders/` | Authenticated | Own orders only, unless staff (sees all). `?status=` filter |
| GET | `/orders/{order_number}/` | Authenticated (owner or staff) | |
| PATCH | `/orders/{order_number}/status/` | Staff | `{"status": "shipped"}` — validated against the state machine (see below); invalid transitions return `400` |
| POST | `/orders/coupons/validate/` | Authenticated | `{"code", "subtotal"}` → discount preview without placing an order |
| GET/POST | `/orders/coupons/` | Staff | |
| GET/POST | `/orders/promotions/` | Public read (active only) / Staff write | |

### Checkout — request/response example

```http
POST /api/orders/checkout/
Authorization: Bearer <access>
Content-Type: application/json

{
  "items": [{ "product_id": 1, "quantity": 1 }],
  "payment_method": "mpesa",
  "address_id": 4,
  "coupon_code": "WELCOME10",
  "mpesa_phone": "+254712345678"
}
```
`address_id` can be replaced with inline fields (`recipient_name`, `phone_number`, `county`,
`town`, `street_address`) to ship somewhere not yet saved.

```json
{
  "order_number": "TH-0DF3CDDE9B",
  "status": "paid",
  "subtotal_kes": "1200.00",
  "discount_kes": "120.00",
  "shipping_fee_kes": "250.00",
  "total_kes": "1330.00",
  "items": [{ "title_snapshot": "Levi's 501 Blue Jeans", "quantity": 1, "line_total_kes": 1200.0 }],
  "payments": [{ "provider": "mpesa", "status": "success", "provider_reference": "MOCK-..." }]
}
```

### Order status state machine

```
pending → paid | processing | cancelled
paid → processing | cancelled | refunded
processing → shipped | cancelled | refunded
shipped → delivered | refunded
delivered → refunded
cancelled, refunded → (terminal)
```
Moving into `cancelled` or `refunded` automatically restocks every item on the order.

## Engagement (Wishlist & Reviews)

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET/POST | `/engagement/wishlist/` | Authenticated | `{"product_id": 1}` — 400 if already wishlisted |
| DELETE | `/engagement/wishlist/{id}/` | Authenticated (owner) | |
| GET | `/engagement/reviews/?product=<id>` | Public | Approved only |
| POST | `/engagement/reviews/` | Authenticated | `{"product_id", "rating" (1-5), "comment"}` — **400 with `code: "review_not_verified_purchase"`** unless the user has a `delivered` order containing that product; one review per (user, product) |
| PATCH/DELETE | `/engagement/reviews/{id}/` | Authenticated (owner) | |

## Analytics & Audit (staff/admin)

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/analytics/sales/?period=7d\|30d\|90d\|all` | Staff | Totals, daily trend, top products/categories. Excludes cancelled orders. |
| GET | `/analytics/inventory/` | Staff | Active/low-stock/sold-out counts, stock value, breakdown by category |
| GET | `/analytics/suppliers/` | Staff | Batches supplied, items listed/sold, total cost per supplier |
| GET | `/audit/logs/?model_name=&action=&object_id=` | **Admin (superuser) only** | Who changed product price/stock/`is_active`, order status, or user role/permissions, and when |

## Permission summary

| Role | Can do |
|---|---|
| Guest | Browse/search/filter catalog, view active promotions, register/login |
| Customer | + wishlist, checkout, own order history, reviews on delivered purchases |
| Staff (`is_staff=True`) | + manage products/categories/suppliers/bale-batches/stock/coupons/promotions, update order status, view analytics |
| Admin (`is_superuser=True`) | + view audit logs, full Django admin access |
