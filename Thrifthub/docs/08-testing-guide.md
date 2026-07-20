# ThriftHub KE — Testing Guide

## Backend (pytest + pytest-django)

```bash
cd backend
source .venv/Scripts/activate     # or .venv/bin/activate on macOS/Linux
python -m pytest                  # run everything
python -m pytest apps/orders      # just one app
python -m pytest -k "checkout"    # by keyword
```

Requires the `thrifthub` Postgres role to have `CREATEDB` (pytest-django creates and tears
down a throwaway test database per run):
```sql
ALTER ROLE thrifthub CREATEDB;
```

### Configuration

- `pytest.ini` points `DJANGO_SETTINGS_MODULE` at `config.settings.test`, which forces
  `PASSWORD_HASHERS` to the fast (insecure) MD5 hasher, `PAYMENT_PROVIDER=mock`, and the
  in-memory email backend — so tests never hit a real payment gateway or send real mail, and
  run fast.
- `conftest.py` (repo-level, auto-discovered) provides `api_client`, `user`, `staff_user`,
  `admin_user`, and pre-authenticated `auth_client` / `staff_client` fixtures.
- `tests/factories.py` holds shared `factory_boy` factories (`UserFactory`, `ProductFactory`,
  `CouponFactory`, etc.) used across every app's test suite.

### What's covered

| Area | File | What it proves |
|---|---|---|
| Authentication | `apps/accounts/tests/test_auth.py` | Registration validation (weak password, duplicate email, malformed Kenyan phone), login/logout/refresh cookie lifecycle, refresh token blacklisting on logout, address ownership isolation |
| Products | `apps/catalog/tests/test_products.py` | Public visibility only shows active products, staff sees all, write permissions (401/403/201 by role), filtering (category/price), search, the auto-deactivate-at-zero-stock business rule |
| Inventory | `apps/inventory/tests/test_stock.py` | `adjust_stock` intake/sale math, oversell rejection (`DomainError`, no partial write), quantity-hits-zero deactivation, low-stock endpoint permissions |
| Orders/Checkout | `apps/orders/tests/test_checkout.py` | End-to-end checkout (auth required, stock decrements, coupon discount math, expired-coupon rejection, insufficient-stock rejection, COD leaves order `processing`/payment `pending`), order status transition permissions and the state-machine's invalid-transition rejection, restocking on cancellation, order visibility scoping (customers only see their own) |
| Engagement | `apps/engagement/tests/test_reviews_and_wishlist.py` | BR-2 verified-purchase enforcement on reviews, duplicate-review rejection, rating bounds validation, wishlist add/list/duplicate-rejection, auth requirements |

Run with coverage:
```bash
python -m coverage run -m pytest
python -m coverage report --include="apps/*"
```
At last check this sits around **90%** on the exercised backend apps.

### Why business logic is tested through the API, not just unit-tested on services

Most tests hit the DRF endpoints (`auth_client.post("/api/orders/checkout/", ...)`) rather than
calling `services.checkout()` directly, deliberately — it exercises serializer validation,
permission classes, and URL routing in the same pass as the business logic, which is where the
routing bugs found during manual verification actually surfaced (see the `SimpleRouter` vs
`DefaultRouter` fix in `apps/orders/urls.py`).

## Frontend

No automated test runner is wired up yet (see `09-future-improvements.md`) — Vite/React unit
and component tests (Vitest + React Testing Library would be the natural fit given the existing
stack) are a deliberate near-term gap, not an oversight. In the meantime:

```bash
cd frontend
npm run build   # catches import errors, JSX syntax errors, and type mistakes surfaced by the build
npm run lint    # oxlint — catches unused vars, hook-rule violations, etc.
```

Both were run clean as part of building this project. Manual verification during development
was done by running both dev servers together and exercising flows via `curl` against the API
directly (registration → login → browse → checkout → status transitions → analytics) — this
confirms the API contract the frontend depends on is correct, but does **not** substitute for
actually clicking through the UI in a browser, which wasn't available in this build environment.
Before shipping, walk through: register → browse/filter → add to cart → checkout (both M-Pesa
mock and COD) → order history → leave a review after marking an order delivered (as staff) →
admin dashboards.

## Manual API verification (already performed once, worth re-running after changes)

Every endpoint in `04-api-documentation.md` was exercised end-to-end via `curl` against a real
PostgreSQL instance during development, not just covered by pytest — including the two real
bugs that surfaced only under live testing (a Decimal/float arithmetic `TypeError` in shipping
fee calculation, and the router-collision bug above). The Postman collection
(`backend/postman_collection.json`) is the fastest way to repeat this manually.
