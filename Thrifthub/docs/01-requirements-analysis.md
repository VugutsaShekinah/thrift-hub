# ThriftHub KE — Phase 1: Requirement Analysis

> **Source note:** No project report file was provided in this workspace. This analysis
> treats the master prompt as the requirements brief and fills every gap with an explicit,
> professionally-reasoned assumption. Every assumption is labeled **[ASSUMPTION]** so it can
> be swapped for the real report's wording later without re-deriving the whole system.

## 1. Business Context

ThriftHub KE is a single-retailer e-commerce platform (not a multi-vendor marketplace). The
business buys second-hand clothing in bulk ("mitumba bales") from wholesale suppliers,
unpacks each bale into individual sellable items, photographs and lists them, and sells them
online to individual Kenyan consumers. This framing matters architecturally: **suppliers and
bale batches are back-office inventory-sourcing records, not platform user accounts.**
Customers only ever interact with ThriftHub KE itself.

**[ASSUMPTION]** — Single-tenant retailer, not a marketplace of many sellers. If the real
report intends a multi-vendor marketplace (independent thrift sellers each with their own
storefront), the data model would need a `Vendor` actor with its own auth and payout flow —
flagged as a future-improvement fork, not built now.

## 2. Actors

| Actor | Description | Auth required |
|---|---|---|
| Guest | Unauthenticated visitor. Can browse, search, filter, view products. | No |
| Customer | Registered buyer. Can purchase, review, wishlist, track orders. | Yes |
| Inventory Staff | Back-office role. Manages products, bale batches, suppliers, stock. | Yes (staff) |
| Admin (superuser) | Full access: staff management, analytics, coupons, promotions, audit logs. | Yes (admin) |
| *(Future)* Supplier Portal User | Self-service supplier login to see their own batch/performance history. | Not built now — see §7 |

Two staff roles are separated by Django's `is_staff` (Inventory Staff) and `is_superuser`
(Admin) flags plus a `role` field, rather than a full custom RBAC table — sufficient for the
actor set above without over-engineering. **[ASSUMPTION]**

## 3. Functional Requirements

### 3.1 Authentication & Accounts
- FR-1 Register with email + password (+ phone number, required for delivery/M-Pesa).
- FR-2 Login issuing JWT access + refresh tokens.
- FR-3 Logout that invalidates the refresh token (blacklist), not just a client-side discard.
- FR-4 Password reset via emailed time-limited token.
- FR-5 Authenticated profile view/update (name, phone, avatar).
- FR-6 Multiple saved delivery addresses per customer.

### 3.2 Catalog
- FR-7 Hierarchical categories (e.g. Men > Shirts, Women > Dresses), with slugs for SEO.
- FR-8 Products with: title, description, category, brand, size, gender, **condition
  grade**, price, originating bale batch, multiple images (one primary), slug, active flag.
- FR-9 Full-text search across title/description/brand.
- FR-10 Filtering by category, size, brand, price range, condition, gender.
- FR-11 Sorting: newest, price asc/desc, most popular.
- FR-12 Pagination on every list endpoint.
- FR-13 Related products (same category) and Recently Viewed (client + optional server log).
- FR-14 Featured Products / New Arrivals flags surfaced on the landing page.

### 3.3 Inventory & Sourcing
- FR-15 Suppliers CRUD (name, contact, location, rating).
- FR-16 Bale Batches: supplier, date received, cost (KES), item count, category, weight (kg).
- FR-17 Each Product links to the batch it was unpacked from, for cost/margin tracking.
- FR-18 Inventory quantity per product — **[ASSUMPTION]** since items are second-hand and
  usually unique, default quantity is 1 and the product auto-deactivates at 0; the schema
  still supports quantity > 1 for the rare bulk-buy accessory (e.g. a pack of belts).
- FR-19 Low-stock / sold-out alerts surfaced to Inventory Staff.
- FR-20 Supplier performance reporting (batches supplied, items listed, defect/return rate).

### 3.4 Shopping & Orders
- FR-21 Cart (client-side, persisted per authenticated user server-side at checkout time).
- FR-22 Checkout: select/add address, apply coupon, choose payment method, place order.
- FR-23 Order lifecycle: `pending → paid → processing → shipped → delivered`, plus
  `cancelled` and `refunded` side-states.
- FR-24 Order history and order detail view for customers.
- FR-25 Stock is only committed at order-creation time, inside a DB transaction, to prevent
  two customers buying the same unique item.

### 3.5 Engagement
- FR-26 Wishlist (add/remove/list, unique per customer+product).
- FR-27 Reviews with 1–5 star rating + comment — **[ASSUMPTION]** restricted to customers
  whose order containing that product has reached `delivered`, i.e. verified purchase only.
- FR-28 Coupons: fixed or percentage discount, expiry date, min order value, usage limits.
- FR-29 Seasonal Promotions: time-boxed category or storewide discount banners.

### 3.6 Admin & Analytics
- FR-30 Admin dashboard: revenue over time, top categories, top products, low-stock list.
- FR-31 Audit log of sensitive actions (price changes, stock adjustments, order status
  changes, user role changes) — who did what, when, before/after values.
- FR-32 Image upload with server-side validation (type, size) and thumbnail generation.

## 4. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Security | Passwords hashed (Django PBKDF2/Argon2); JWT access token short-lived, refresh token rotated + blacklistable; refresh token in `httpOnly` `Secure` cookie (not `localStorage`) to limit XSS blast radius; DRF serializer validation on every input; CORS allow-list; parameterized ORM queries only (no raw SQL); file upload MIME/size validation; throttling on auth & search endpoints. |
| Performance | `select_related`/`prefetch_related` on all list endpoints; DB indexes on FK, slug, search fields; pagination everywhere; Pillow-generated thumbnails; lazy-loaded images and route-based code-splitting on frontend. |
| Scalability | Stateless API (JWT, no server sessions) so it can scale horizontally; 12-factor config via `.env`; Docker-ready for container orchestration later. |
| Availability | Migration-based schema evolution; documented backup strategy (`pg_dump`); structured logging. |
| Usability/Accessibility | Mobile-first Tailwind layout; semantic HTML; alt text on all images; visible focus states; color contrast meeting WCAG AA. |
| Maintainability | Layered backend (serializers / views / services / permissions); typed props on frontend where practical; tests on critical paths. |
| Localization | **[ASSUMPTION]** Currency KES, `Africa/Nairobi` timezone, Kenyan phone format (`+2547XXXXXXXX`), addresses use County/Town rather than US State/ZIP. |

## 5. Business Rules

- BR-1 A product's `quantity` reaching 0 automatically flips `is_active=False` and removes
  it from public listings; it is never hard-deleted (retained for order history integrity).
- BR-2 Reviews may only be created for a `(customer, product)` pair where an order line for
  that product exists with status `delivered`. One review per customer per product.
- BR-3 A coupon may be applied only if: not expired, usage count `<` limit, order subtotal
  `≥` minimum, and only one coupon per order.
- BR-4 **[ASSUMPTION]** Because items are unique second-hand pieces, the default return
  policy is *inspection-only*: a return/exchange request may be opened within 48 hours of
  delivery for a materially-misdescribed item, adjudicated by staff — not a no-questions-asked
  policy. Modeled as a lightweight `ReturnRequest` for future implementation.
- BR-5 **[ASSUMPTION]** Prices are stored and displayed VAT-inclusive (Kenya standard VAT
  16%), with the rate held as a settings constant rather than a fully general tax engine.
- BR-6 **[ASSUMPTION]** Payment methods at launch: **M-Pesa (STK Push)** as primary and
  **Cash on Delivery** as fallback, since these are the dominant modes for this market. Card
  payment (Flutterwave/Paystack) is architected for but not wired up at launch.
- BR-7 Stock decrement and order-line creation happen inside one atomic transaction with a
  row lock (`select_for_update`) to close the double-sell race condition on unique items.

## 6. Constraints

- No source report was available in this workspace — this document *is* the substitute, and
  is the artifact to reconcile against if/when the real report surfaces.
- No live payment credentials (Safaricom Daraja API keys) are available in this environment.
  The payment layer must be built behind an interface with a mock provider for dev/test, so a
  real Daraja adapter can be dropped in at deployment without touching call sites.
- No outbound email/SMTP credentials available — dev uses Django's console/file email
  backend; SMTP settings are documented as env vars for production.
- Development occurs on Windows; Docker configuration must remain OS-agnostic.
- This is being built solo, incrementally, across a chat session rather than a sprint team —
  scope is prioritized (core commerce loop first) rather than attempted all-at-once.

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Scope (full marketplace feature set) is large enough that shallow coverage everywhere beats depth anywhere. | Build in milestones: core browse→cart→checkout→order loop and inventory backbone first; engagement features (wishlist/reviews/coupons) next; analytics last. Each milestone is fully working, not a stub. |
| M-Pesa Daraja requires a public HTTPS callback URL not available locally. | Abstract `PaymentProvider` interface; ship a `MockProvider` (instant "success") for dev/test and a `DarajaProvider` adapter wired via env flag for prod. |
| Concurrent purchase of a unique (qty=1) item. | Atomic transaction + `select_for_update` at order-creation time (BR-7). |
| JWT theft via XSS if stored in `localStorage`. | Refresh token in `httpOnly Secure SameSite=Lax` cookie; access token kept in memory (React context) only. |
| Local image storage doesn't survive container restarts / doesn't scale. | Use Django's storage abstraction from day one (`django-storages` compatible) so swapping to S3-compatible object storage later is a config change, not a rewrite. |
| Academic deadline pressure vs. "production-ready" ambition. | Document what's MVP-complete vs. explicitly deferred in `docs/future-improvements.md`, so grading criteria and commercial ambition are both visible and not conflated. |

## 8. Missing Requirements Identified — Recommended Additions

Beyond the table list given in the prompt, the following are needed for a *working* system
and are added to the design:

1. **Condition grading** (`Grade A/B/C`, `New with tags`, etc.) — core to mitumba retail, was
   missing from the generic table list; added as a `Product.condition` field.
2. **Size/attribute fields** on products (clothing size, shoe size) — needed for filtering.
3. **Shipping model** — method + cost + free-shipping threshold; Kenya courier/pickup point
   as a simple enum for now, extensible to a full `ShippingMethod` table later.
4. **Payment abstraction** (see §6) plus a `Payment` table recording provider, reference,
   status, amount — separate from `Order` so multiple payment attempts can be tracked.
5. **Email notifications**: order confirmation, password reset, low-stock alert to staff.
6. **Slugs** on `Category` and `Product` for clean URLs and SEO.
7. **`ReturnRequest`** model (BR-4) — minimal now, expandable later.
8. **Audit logging via signals** rather than manual calls scattered through views, so it
   can't be forgotten on new code paths.
9. **Throttling** on auth and search endpoints (DRF `AnonRateThrottle`/`UserRateThrottle`).
10. **Seed/demo data command** — a real thrift catalog needs realistic fixtures to be
    demoable and testable; a `seed_demo_data` management command is included.
11. **Guest browsing, account-required checkout** — **[ASSUMPTION]** wishlist/cart works for
    guests client-side, but placing an order requires an account so order history, reviews,
    and analytics have a stable customer record to attach to.

## 9. Explicit Assumptions Log (for quick reference)

| # | Assumption | Rationale |
|---|---|---|
| A1 | Single-retailer platform, not multi-vendor marketplace | Matches "Supplier"/"Bale Batch" language, which implies internal sourcing, not seller accounts |
| A2 | Currency KES, VAT-inclusive pricing, 16% constant | Kenya market norm; avoids a full tax-jurisdiction engine that isn't needed at this scale |
| A3 | Payment: M-Pesa STK Push + Cash on Delivery at launch | Dominant Kenyan retail payment modes; card deferred behind same interface |
| A4 | Checkout requires an account; browsing/wishlist doesn't | Needed for order history, reviews-by-verified-purchaser, and analytics integrity |
| A5 | Default product quantity = 1 (unique second-hand item) | Matches the real nature of mitumba inventory; schema still allows >1 |
| A6 | Return policy: 48-hour inspection window, not blanket returns | Realistic for unique second-hand goods; avoids overpromising a policy the business likely can't sustain |
| A7 | JWT refresh token in httpOnly cookie, access token in memory | Materially more secure than the common localStorage pattern; worth the small added complexity |

---
Next: [`docs/02-system-design.md`](./02-system-design.md) — architecture, schema, API and
auth flow design building on the requirements above.
