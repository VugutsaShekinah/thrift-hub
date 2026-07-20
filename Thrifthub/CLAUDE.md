# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ThriftHub KE — an e-commerce platform for second-hand (mitumba) clothing retail in Kenya.
Django REST Framework backend + React/Vite SPA frontend. M-Pesa/Cash-on-Delivery checkout,
wishlist, verified-purchase reviews, coupons, and an admin back office (inventory, supplier
performance, sales analytics, audit log).

Full docs live in `docs/01-*.md` through `docs/09-*.md` (requirements, system design, install,
API reference, DB design, env vars, deployment, testing, deferred work) — read the relevant one
before making non-trivial changes; don't re-derive what's already written there.

## Commands

### Backend (from `backend/`, with `.venv` activated)
```bash
python manage.py runserver 127.0.0.1:8000
python manage.py migrate
python manage.py makemigrations <app>

python -m pytest                     # full suite
python -m pytest apps/orders         # one app
python -m pytest -k "checkout"       # by keyword
python -m coverage run -m pytest && python -m coverage report --include="apps/*"
```
Running the test suite requires the `thrifthub` Postgres role to have `CREATEDB` (pytest-django
creates/drops a throwaway test DB per run). Tests force `DJANGO_SETTINGS_MODULE=config.settings.test`
(fast MD5 password hasher, `PAYMENT_PROVIDER=mock`, in-memory email) via `pytest.ini` — never
real payment/email calls.

### Frontend (from `frontend/`)
```bash
npm run dev       # Vite dev server, http://localhost:5173
npm run build     # also the closest thing to a type/import-error check — no test runner is wired up yet
npm run lint      # oxlint
```
There is no frontend automated test runner (Vitest/RTL would be the natural fit, deliberately
deferred — see `docs/09-future-improvements.md`). Treat `npm run build && npm run lint` as the
correctness gate for frontend changes, and manually exercise the UI for anything touching a
user flow.

## Architecture

**Style:** layered monolith, not microservices. Each Django app under `backend/apps/` owns one
bounded context: `accounts`, `catalog`, `inventory`, `orders`, `engagement`, `audit`, `analytics`,
`core` (shared base classes/utilities/permissions).

**Backend request flow, in every app:**
```
views (thin DRF ViewSets/APIView)
  → serializers (validation + shape)
    → services (business logic: stock decrement, coupon validation, order totals)
      → models (persistence, DB constraints)
permissions.py (per-app, composable DRF permission classes)
```
Services exist specifically where business rules span more than one model — e.g. checkout
touches `Product`, `StockMovement`, `Coupon`, `Order`, `OrderItem`, `Payment` inside one atomic
transaction. That logic belongs in a service, not inline in a view or spread across fat model
methods. Domain/business-rule failures raise `apps.core.exceptions.DomainError`, which the
custom DRF exception handler (`config` wiring) turns into a clean 400 rather than a stack trace.

**Frontend:** `src/api` (Axios instance + one module per resource) → `src/features/*` (feature
components) → `src/pages` (one file per route, composes features/components). `src/context`
holds `CartContext` (guest + authenticated cart); `src/auth` holds `AuthContext`/`ProtectedRoute`.

### Cross-cutting decisions worth knowing before touching related code

- **Auth:** access token issued in the JSON login response and kept in memory only
  (`AuthContext`); refresh token lives in an httpOnly, Secure, SameSite=Lax cookie — never
  `localStorage`. Axios response interceptor calls `/api/auth/token/refresh/` on a 401 and
  retries the original request once. Logout blacklists the refresh token server-side
  (SimpleJWT blacklist app).
- **Stock changes are atomic and race-safe:** checkout uses `select_for_update` on the product
  row before decrementing stock, so two customers can't both buy the last unit of a unique
  second-hand item. `StockMovement` is an append-only ledger; `Product.quantity` is a
  denormalized running total kept in sync inside the same transaction — fast reads plus a full
  audit trail, rather than `SUM()` on every page load. Quantity hitting zero auto-deactivates
  the product (`is_active=False`).
- **Orders snapshot data at time of purchase:** shipping address (name/phone/county/town/street)
  and each line item's title/price/condition are stored as plain fields on `Order`/`OrderItem`,
  not FKs to live `Address`/`Product` rows — so editing an address or a product later never
  rewrites order history, and refunds/analytics reflect what was actually sold.
- **Payments are provider-agnostic:** M-Pesa and Cash-on-Delivery both implement the
  `PaymentProvider` ABC in `backend/payments/base.py`, selected via `PAYMENT_PROVIDER` env var
  (`payments/factory.py`). `mock_provider.py` gives instant simulated success so dev/test never
  need real Safaricom Daraja credentials; `mpesa_provider.py` is the real Daraja adapter.
- **Reviews require a verified, delivered purchase** — enforced server-side by looking up a
  `delivered` order for that (user, product) pair via `OrderItem`, never trusted from the client.
- No raw SQL — PostgreSQL + Django ORM only, removing SQL-injection surface by construction.

### Settings

`backend/config/settings/{base,dev,test,prod}.py` — `dev`/`test`/`prod` each import from `base`
and override. `DJANGO_SETTINGS_MODULE` env var picks which one loads; pytest always forces
`config.settings.test` regardless of the env var. `SIMPLE_JWT`, refresh-cookie settings, and DRF
throttle rates are defined directly in these files rather than as env vars, deliberately — so
they can't be silently misconfigured via a stray `.env` value in production.

### Tests

- Root-level `backend/conftest.py` provides `api_client`, `user`/`staff_user`/`admin_user`, and
  pre-authenticated `auth_client`/`staff_client` fixtures — check there before writing new ones.
- `backend/tests/factories.py` holds shared `factory_boy` factories (`UserFactory`,
  `ProductFactory`, `CouponFactory`, etc.) reused across every app's suite.
- Per-app tests mostly hit DRF endpoints (`auth_client.post("/api/orders/checkout/", ...)`)
  rather than calling `services.*()` directly — this is deliberate, since it exercises
  serializer validation, permission classes, and URL routing in the same pass, which is where
  real bugs surfaced during manual verification.

### Known gaps (see `docs/09-future-improvements.md` for the full/current list)

- No frontend automated test runner.
- `RETURN_WINDOW_HOURS` is a documented policy value, not yet enforced in code.
