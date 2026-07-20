# ThriftHub KE — Future Improvements

Honest list of what's deliberately out of scope for this build, split by why it was deferred.

## Deferred because no real credentials/infrastructure exist in this environment

- **Real M-Pesa Daraja integration** — `payments/mpesa_provider.py` is written and wired
  behind the same interface as the mock provider, but has never been exercised against
  Safaricom's sandbox (no consumer key/secret, no public HTTPS callback URL available here).
  Needs a real end-to-end test before go-live.
- **Real SMTP email** — password-reset emails render correctly (verified via Django's console
  backend) but have never been sent through a real mail provider. Needs SMTP or a transactional
  email service (SES, Postmark, Mailgun) configured and tested.
- **S3-compatible object storage** — configured in `config/settings/prod.py` but never
  connected to a real bucket; media has only been tested against local filesystem storage.
- **Docker Compose stack** — written to a standard pattern but never actually built/run (no
  Docker CLI in this environment). Treat it as a strong starting point, not a verified artifact.

## Deferred as genuine scope cuts (would need product/business decisions first)

- **Return/refund workflow** — `ReturnRequest` model exists but there's no API surface or UI
  for customers to open a return or staff to adjudicate one. BR-4's 48-hour inspection window
  is documented but not enforced by any code.
- **Guest checkout** — checkout requires an account (assumption A4). Supporting true guest
  checkout would need a way to attach orders to an email/phone rather than a `User` row, and
  changes how reviews-by-verified-purchaser (BR-2) would need to work.
- **Multi-vendor marketplace mode** — the whole schema assumes ThriftHub KE is a single
  retailer sourcing from suppliers (assumption A1). Turning suppliers into independent sellers
  with their own storefronts and payouts is a different product, not an incremental feature.
- **Full tax engine** — a single `VAT_RATE` constant assumes VAT-inclusive pricing storewide
  (assumption A2). Category-specific tax rates or exclusive pricing would need a real tax
  service, not a settings constant.
- **Card payments (Flutterwave/Paystack)** — the `PaymentProvider` interface supports adding
  this as a third adapter alongside M-Pesa/COD; no adapter has been written yet.

## Straightforward technical follow-ups (no product decision needed, just time)

- **Frontend automated tests** — Vitest + React Testing Library for the pages/components in
  `frontend/src/`, and Playwright/Cypress for the golden-path E2E flow (browse → cart →
  checkout → order history). Backend has 44 pytest cases; frontend currently has none.
- **Rate-limit tuning** — `DEFAULT_THROTTLE_RATES` in `config/settings/base.py` are reasonable
  starting guesses, not load-tested numbers.
- **Structured request logging / APM** — `LOGGING` in `base.py` is console-only; add Sentry (a
  dependency is already listed in `requirements/prod.txt`) or similar for real error tracking.
- **Search relevance** — current search is DRF's `SearchFilter` (basic `icontains` across
  title/description/brand). A real product catalog at scale would benefit from PostgreSQL full
  text search (`SearchVectorField`) or an external search service.
- **Caching** — no caching layer yet (Redis would be the natural addition) for hot read paths
  like the product list and category tree.
- **Recently Viewed** — mentioned as a business improvement in the original brief; not built.
  Would be a small addition: a `RecentlyViewed` model or simply client-side `localStorage`
  tracking (same pattern as the cart), surfaced as a "Recently Viewed" rail on the homepage.
- **Search suggestions / autocomplete** — the search bar submits a full query today; a
  debounced typeahead against `/catalog/products/?search=` would be a frontend-only addition.
- **Seasonal promotion banners on the homepage** — the `Promotion` model and API exist
  (`/orders/promotions/`) but the homepage doesn't yet render active promotions as banners.
- **Admin bulk actions** — e.g. bulk product deactivation, bulk stock adjustment from a CSV
  import of a newly-unpacked bale batch.

## Why these were prioritized the way they were

Given the size of the brief, the build prioritized a **fully working core commerce loop** (
browse → cart → checkout → payment → fulfillment → review) and the **inventory/sourcing
backbone** (suppliers → bale batches → products → stock ledger) over breadth — every listed
gap above is either infrastructure this environment couldn't provide credentials for, a product
decision that shouldn't be made silently by an AI build, or a genuinely lower-priority
enhancement relative to the graded/core requirements.
