# ThriftHub KE — Database Documentation

Engine: PostgreSQL. Full ER diagram: [`02-system-design.md` §4.2](./02-system-design.md#42-er-diagram).
This document describes each table's purpose and the normalization/design decisions behind it;
field-level types live in the Django models (`backend/apps/*/models.py`), which are the source
of truth — this doc explains *why*, the models say *what*.

## accounts app

### `users` (custom `AbstractBaseUser`)
Email is the login identifier (`USERNAME_FIELD`), not a separate username — there's no product
reason for Kenyan thrift customers to have a username distinct from their email. `phone_number`
is validated against `+2547XXXXXXXX` / `+2541XXXXXXXX` and is unique, since it doubles as the
default M-Pesa contact. `role` is a denormalized convenience field alongside `is_staff` /
`is_superuser` — authorization checks always use the latter two; `role` exists purely for
readable admin/audit display.

### `customer_profiles`
Split from `users` in a 1:1 rather than inlined, because it holds *customer-specific* data
(loyalty points, gender, DOB, newsletter opt-in) that conceptually doesn't belong on the core
identity/auth record — and keeps the auth table lean if a future `Vendor` or `SupplierUser`
actor type is ever added (see `09-future-improvements.md`).

### `addresses`
Multiple per user, one flagged `is_default` (enforced in `Address.save()`, not a DB constraint,
since "only one default" is an update-time invariant simplest to enforce in application code).
**Not referenced by FK from `Order`** — see `orders` section below for why.

## catalog app

### `categories`
Self-referential (`parent_id`) for a shallow hierarchy (e.g. Men → Shirts). `slug` is unique
and auto-generated from `name` if not supplied.

### `suppliers`
Wholesale bale suppliers — **not platform user accounts** (see `01-requirements-analysis.md`
§2 on the single-retailer assumption). `rating` is a manually-maintained 0–5 quality score;
`analytics.SupplierPerformanceView` computes objective stats (batch count, cost, sell-through)
alongside it.

### `bale_batches`
One row per bulk purchase from a supplier. `FK → supplier` is `PROTECT` (a supplier can't be
deleted while batches reference it — preserves sourcing history). `category` is nullable and is
the *general* category of the bale (e.g. "assorted men's jeans"), independent of the specific
categories its unpacked products end up in. `items_listed_count` and `cost_per_item_kes` are
computed properties, not stored columns — they're cheap to derive from `products.count()` and
would otherwise risk drifting out of sync.

### `products`
The catalog's core entity. `bale_batch_id` is nullable + `SET_NULL` (a product's *sourcing*
history is nice-to-have, not something that should block deleting an old batch record).
`category_id` is `PROTECT` — a category with active products can't be deleted out from under
them. `quantity` defaults to **1**, reflecting that mitumba items are usually unique
single units (see assumption A5 in the requirements doc); the schema still supports `quantity > 1`
for the rare bulk accessory. A composite index on `(is_active, category)` and
`(is_active, is_featured)` supports the two most common storefront query patterns (browsing a
category, showing featured picks) without a full table scan.

### `product_images`
One-to-many, with `is_primary` (enforced single-primary-per-product in `save()`, same pattern
as `Address.is_default`) and `sort_order` for gallery ordering.

## inventory app

### `stock_movements`
**Append-only ledger.** Every quantity change — intake, sale, return, manual adjustment,
damage/write-off — is a row here, with `quantity_delta` (signed) and a `reference` (order
number or batch code). `Product.quantity` is a **denormalized running total** kept in sync by
`inventory.services.adjust_stock()`, which is the single choke point for every stock mutation
in the codebase (checkout, returns, manual adjustments all funnel through it). This gives O(1)
reads for the storefront (`Product.quantity`) while still producing a full audit trail via the
ledger — the alternative (computing stock as `SUM(stock_movements.quantity_delta)` on every
page load) would be correct but needlessly slow at scale.

## orders app

### `coupons` / `promotions`
Independent of each other: a coupon is redeemed at checkout (code-based, usage-capped);
a promotion is a passive storewide-or-per-category discount banner. Both live in the `orders`
app rather than `catalog`, since they're fundamentally pricing/checkout concerns even though
`promotions.category_id` points into `catalog`.

### `orders`
**Snapshots the shipping address as plain columns** (`shipping_name`, `shipping_phone`,
`shipping_county`, `shipping_town`, `shipping_street`) rather than an FK to `addresses`. This
is the single most important normalization *departure* in the schema, and it's deliberate:
if a customer edits or deletes a saved address after placing an order, that order's fulfillment
record must still show what was true *at the time it shipped*. The same reasoning applies to
`OrderItem` below. `order_number` is a human-readable public identifier (`TH-XXXXXXXXXX`),
separate from the internal PK, so it's safe to expose in URLs/receipts.

### `order_items`
Snapshots `title_snapshot`, `price_kes_snapshot`, `condition_snapshot` from the `Product` at
purchase time — again, historical accuracy over strict normalization. `product_id` is nullable
+ `SET_NULL` so a product record can still theoretically be removed without breaking order
history (though in practice BR-1 means products are deactivated, never hard-deleted).

### `payments`
Separate from `Order` (rather than payment fields inlined on `Order`) because an order can, in
principle, have more than one payment attempt (e.g. a failed M-Pesa STK push retried). `raw_response`
stores the provider's raw JSON for debugging/reconciliation without needing extra columns per
provider quirk.

### `return_requests`
Minimal by design — a placeholder for BR-4 (48-hour inspection-window returns) rather than a
fully worked return/refund workflow, which is flagged as a deliberate scope decision in
`09-future-improvements.md`.

## engagement app

### `wishlist_items`
`unique_together(user, product)` — the DB itself prevents duplicate wishlist entries, backed up
by a `UniqueTogetherValidator` at the serializer layer for a clean 400 instead of a raw
`IntegrityError`.

### `reviews`
`unique_together(user, product)` — one review per product per customer. `order_item_id` is the
enforcement mechanism for BR-2 (verified-purchase reviews): it's populated server-side by
`engagement.services.get_verified_purchase()`, which looks up a `delivered` `OrderItem` for that
`(user, product)` pair — the client never supplies it directly.

## audit app

### `audit_logs`
Generic `(model_name, object_id)` rather than per-model FKs, so one table covers `Product`,
`Order`, and `User` changes (price, stock, `is_active`, order status, role/permission changes)
without a join table per tracked model. Populated via Django signals
(`apps/audit/signals.py`) that diff before/after values in `pre_save` and log in `post_save` —
so a save that raises partway through never produces a phantom log entry. `AuditLog` rows are
never updated or deleted by application code (enforced in `admin.py` by disabling those admin
actions).

## Design decisions that cut across tables

- **No raw SQL anywhere** — every query goes through the Django ORM, which parameterizes by
  construction and removes SQL injection as an attack surface.
- **`PROTECT` vs `SET_NULL` vs `CASCADE`** is chosen per-relationship based on whether the
  parent's deletion should be blocked (categories/suppliers with live products/batches),
  silently detach the reference (a product's now-irrelevant bale batch), or cascade (a user's
  own addresses/wishlist items, which have no meaning without the user).
- **Snapshotting over strict 3NF** on `Order`/`OrderItem` is the one intentional denormalization
  in the schema, justified above — everything else follows standard normalization to 3NF.
