# ThriftHub KE — Deployment Guide

> **Note on this guide's testing status**: the Docker configuration below was authored to a
> standard, well-tested pattern (multi-stage build, gunicorn, nginx reverse proxy) but **could
> not be executed in this development environment** — no Docker CLI was available in the
> session that built this project. Before relying on it, run `docker compose build && docker
> compose up` once yourself and fix anything environment-specific (proxy settings, registry
> access, etc.) that a review can't catch from source alone.

## Architecture

```
                  ┌────────────────────┐
   Browser  ───▶  │  nginx (frontend)  │  serves the built React SPA,
                  │  proxies /api,     │  proxies /api & /media to backend
                  │  /media → backend  │
                  └─────────┬──────────┘
                            │
                  ┌─────────▼──────────┐
                  │  gunicorn (backend)│  Django + DRF, 3 workers
                  └─────────┬──────────┘
                            │
                  ┌─────────▼──────────┐
                  │    PostgreSQL      │
                  └────────────────────┘
```

Same-origin by design (nginx proxies `/api` and `/media` to the backend container) — this is
the same reasoning as the Vite dev proxy: it means the httpOnly refresh-token cookie needs no
cross-origin cookie configuration in production either.

## Option A — Docker Compose (recommended starting point)

1. Copy `backend/.env.example` to `backend/.env` and fill in real values — **at minimum**:
   `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS` (your real domain), `DJANGO_DEBUG=False`,
   `DB_PASSWORD` (a real password, not `thrifthub`), and SMTP credentials if you want real
   password-reset emails to send.
2. From the repo root:
   ```bash
   docker compose build
   docker compose up -d
   ```
3. The frontend is served on port 80, the backend directly on port 8000 (exposed mainly for
   debugging — in a real deployment, put this whole stack behind a TLS-terminating load
   balancer/reverse proxy and don't expose 8000 publicly).
4. Migrations and `collectstatic` run automatically on backend container start (see
   `backend/Dockerfile`'s `CMD`). Create your first admin user with:
   ```bash
   docker compose exec backend python manage.py createsuperuser
   ```

**Why the backend image pins Python 3.12** (`backend/Dockerfile`) while local dev in this
project used whatever was installed (3.14): production wants a widely-deployed, well-supported
version with mature wheel availability for every dependency, not the newest release. Nothing in
this codebase uses a 3.13+-only language feature, so 3.12 is a safe, more conservative choice
for the container image specifically.

## Option B — Manual deployment (no Docker)

1. Provision PostgreSQL, create the database/role (see `03-installation-guide.md` §2.1).
2. On the app server: `pip install -r requirements/prod.txt`, set env vars, then:
   ```bash
   python manage.py migrate
   python manage.py collectstatic --noinput
   gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
   ```
   Run gunicorn under a process supervisor (systemd, supervisord) so it restarts on crash/reboot.
3. Build the frontend (`npm run build` in `frontend/`) and serve the `dist/` folder from
   nginx/Caddy/any static host, proxying `/api` and `/media` to the Django app the same way
   `frontend/nginx.conf` does.
4. Put TLS termination (Let's Encrypt via Certbot, or your load balancer) in front of
   everything — `config/settings/prod.py` sets `SECURE_SSL_REDIRECT=True` and HSTS headers on
   the assumption that HTTPS is present.

## Database backups

Not automated in this codebase — set up a scheduled job appropriate to your host:
```bash
pg_dump -U thrifthub -h <host> thrifthub > backup-$(date +%F).sql
```
Restore with `psql -U thrifthub -h <host> thrifthub < backup-2026-07-20.sql`. Store backups
off-box (S3, another server) — a backup on the same disk as the database doesn't protect
against disk failure.

## Media storage in production

Local filesystem storage (the dev default) does **not** survive container restarts/redeploys
and doesn't scale across multiple backend instances. `config/settings/prod.py` already wires up
`django-storages`' S3 backend the moment `AWS_STORAGE_BUCKET_NAME` is set — point it at any
S3-compatible provider (AWS S3, DigitalOcean Spaces, Backblaze B2, etc.) before going live with
real product photos.

## M-Pesa (Daraja) go-live checklist

The payment layer runs on `PAYMENT_PROVIDER=mock` until you have:
1. A registered Safaricom Daraja app (sandbox first, then production) with consumer
   key/secret, shortcode, and passkey.
2. A **public HTTPS** `MPESA_CALLBACK_URL` that Safaricom's servers can reach — this cannot be
   `localhost` or an internal address.
3. Set `PAYMENT_PROVIDER=mpesa` and the `MPESA_*` env vars, then test a real STK push end to
   end in sandbox before flipping `MPESA_ENV=production`.

## Pre-launch security checklist

- [ ] `DJANGO_DEBUG=False`, real `DJANGO_SECRET_KEY`, real DB password
- [ ] `DJANGO_ALLOWED_HOSTS` restricted to your real domain(s)
- [ ] HTTPS everywhere (see `SECURE_SSL_REDIRECT`/HSTS in `prod.py`)
- [ ] `CORS_ALLOWED_ORIGINS` restricted if frontend/backend are cross-origin
- [ ] Real SMTP configured (password reset currently silently "succeeds" with the console
      backend if left unconfigured — verify email actually arrives)
- [ ] Object storage configured for media (`AWS_STORAGE_BUCKET_NAME` etc.)
- [ ] Database backups scheduled and tested (a backup you've never restored isn't a backup)
- [ ] M-Pesa credentials are production, not sandbox, if going live with real payments
