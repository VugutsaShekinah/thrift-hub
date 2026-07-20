# ThriftHub KE — Installation Guide

## Prerequisites

| Tool | Version used in this project |
|---|---|
| Python | 3.12–3.14 |
| Node.js | 20+ (built/tested on 24) |
| PostgreSQL | 15+ (built/tested on 18) |
| Git | any recent version |
| Docker + Docker Compose | optional, for containerized deployment (see `07-deployment-guide.md`) |

## 1. Clone and inspect

```bash
git clone <your-repo-url> thrifthub
cd thrifthub
```

## 2. Backend setup

```bash
cd backend
python -m venv .venv

# Windows (PowerShell/Git Bash)
source .venv/Scripts/activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements/dev.txt
cp .env.example .env
```

Edit `.env` and set at minimum `DJANGO_SECRET_KEY`, `DB_*`. See
[`06-environment-variables.md`](./06-environment-variables.md) for the full reference.

### 2.1 Create the PostgreSQL role and database

```sql
-- psql -U postgres
CREATE ROLE thrifthub WITH LOGIN PASSWORD 'thrifthub';
CREATE DATABASE thrifthub OWNER thrifthub;
GRANT ALL PRIVILEGES ON DATABASE thrifthub TO thrifthub;
-- required only if you intend to run the test suite (pytest-django
-- creates/drops a throwaway test database per run):
ALTER ROLE thrifthub CREATEDB;
```

### 2.2 Migrate and create an admin user

```bash
python manage.py migrate
python manage.py createsuperuser
```

### 2.3 Run the API

```bash
python manage.py runserver 127.0.0.1:8000
```

The Django admin is at `http://127.0.0.1:8000/admin/`; the API root is `http://127.0.0.1:8000/api/`.

## 3. Frontend setup

```bash
cd ../frontend
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173` and proxies `/api` and `/media` to
`http://127.0.0.1:8000` in dev (see `vite.config.js`), so the backend must be running first.

## 4. Seed demo data (optional but recommended)

There is no bundled fixture file; the fastest way to get a browsable catalog is to create a
superuser (§2.2), log into the Django admin, and add a Category → Supplier → Bale Batch →
Product with an image. The Postman collection (`backend/postman_collection.json`) also has
ready-made requests for creating these via the API instead of the admin UI.

## 5. Running tests

```bash
cd backend
source .venv/Scripts/activate
python -m pytest
```

See [`08-testing-guide.md`](./08-testing-guide.md) for details, coverage, and what's covered.

## 6. Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| `password authentication failed for user "thrifthub"` | Role/database not created yet, or `.env` password mismatch | Re-run §2.1, confirm `DB_PASSWORD` in `.env` matches |
| `pytest` fails to create the test database | `thrifthub` role lacks `CREATEDB` | `ALTER ROLE thrifthub CREATEDB;` |
| Frontend requests get CORS errors | Hitting `:8000` directly from the browser instead of going through the Vite proxy at `:5173` | Use `http://localhost:5173`, not `127.0.0.1:8000`, while developing |
| `ValueError: The annotation '...' conflicts with a field on the model` (if you extend analytics) | Django ORM `.values(x=F(...))` cannot reuse a real field name as the alias | Pick a different alias, e.g. `category_name` instead of `category` |
