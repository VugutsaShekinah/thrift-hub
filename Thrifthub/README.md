# ThriftHub KE

An e-commerce platform for second-hand (mitumba) clothing retail in Kenya — built as a
production-quality system, not a toy CRUD app. ThriftHub KE sources clothing in bulk from
wholesale suppliers, unpacks it into individually graded and photographed listings, and sells
it online with M-Pesa/Cash-on-Delivery checkout, wishlist, verified-purchase reviews, coupons,
and a full admin back office (inventory, supplier performance, sales analytics, audit log).

## Stack

**Backend** — Python, Django, Django REST Framework, PostgreSQL, JWT (SimpleJWT), Pillow,
django-filter, django-cors-headers.
**Frontend** — React, Vite, React Router, Axios, Tailwind CSS, React Hook Form, Context API.
**Tooling** — Git, Docker-ready configs, `.env`-based config, a Postman collection.

## Quick start

```bash
# Backend
cd backend
python -m venv .venv && source .venv/Scripts/activate   # Windows Git Bash; use .venv/bin/activate on macOS/Linux
pip install -r requirements/dev.txt
cp .env.example .env   # then edit DB_* to match your local Postgres
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Full setup details (including creating the Postgres role/database)
are in [`docs/03-installation-guide.md`](./docs/03-installation-guide.md).

## Documentation

| Doc | Contents |
|---|---|
| [`docs/01-requirements-analysis.md`](./docs/01-requirements-analysis.md) | Functional/non-functional requirements, actors, business rules, risks, and every assumption made (no source report was available — see the note at the top of that file) |
| [`docs/02-system-design.md`](./docs/02-system-design.md) | Architecture, folder structure, ER diagram, API surface, auth flow, user/admin journeys, key architectural decisions and why |
| [`docs/03-installation-guide.md`](./docs/03-installation-guide.md) | Full local setup, including Postgres role creation and common issues |
| [`docs/04-api-documentation.md`](./docs/04-api-documentation.md) | Every endpoint, permissions, request/response examples, the order status state machine |
| [`docs/05-database-documentation.md`](./docs/05-database-documentation.md) | Every table's purpose and the normalization decisions behind it (e.g. why orders snapshot addresses instead of using an FK) |
| [`docs/06-environment-variables.md`](./docs/06-environment-variables.md) | Every env var, backend and frontend, with defaults and when it matters |
| [`docs/07-deployment-guide.md`](./docs/07-deployment-guide.md) | Docker Compose and manual deployment, M-Pesa go-live checklist, pre-launch security checklist |
| [`docs/08-testing-guide.md`](./docs/08-testing-guide.md) | How to run the 44-case pytest suite, what's covered, frontend testing status |
| [`docs/09-future-improvements.md`](./docs/09-future-improvements.md) | What's deliberately deferred and why — infra gaps vs. product decisions vs. lower-priority polish |
| [`backend/postman_collection.json`](./backend/postman_collection.json) | Importable Postman collection covering every endpoint |

## Repository layout

```
backend/    Django project (config/, apps/*, payments/, tests/)
frontend/   React + Vite SPA (src/api, src/auth, src/pages, src/features, src/components)
docs/       Everything listed in the table above
docker-compose.yml, backend/Dockerfile, frontend/Dockerfile   Container deployment
```

## Notable engineering decisions (details in the docs above)

- **JWT refresh token lives in an httpOnly cookie, never `localStorage`** — the access token is
  kept in memory only, closing the most common JWT/XSS weakness in naive React+JWT setups.
- **Stock changes are atomic and race-safe** — checkout locks the product row
  (`select_for_update`) before decrementing stock, so two customers can't both buy the last
  unit of a unique second-hand item.
- **Orders snapshot their shipping address and line-item prices** rather than referencing live
  `Address`/`Product` rows, so editing an address or a product later never rewrites history.
- **Payments are provider-agnostic** — M-Pesa and Cash-on-Delivery (and a future card gateway)
  all implement one `PaymentProvider` interface, with a `MockProvider` so dev/test never need
  real Safaricom Daraja credentials.
- **Reviews require a verified, delivered purchase** — enforced server-side by looking up a
  `delivered` order for that (user, product) pair, not trusted from the client.

## Testing

```bash
cd backend && python -m pytest       # 44 passing cases — auth, catalog, orders, inventory, permissions
cd frontend && npm run build && npm run lint   # build + lint clean
```
See [`docs/08-testing-guide.md`](./docs/08-testing-guide.md) for coverage details and what
manual verification was performed against a real PostgreSQL instance during development.

## License

Not yet specified — add one before any public/commercial release.
