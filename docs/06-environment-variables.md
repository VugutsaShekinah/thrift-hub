# ThriftHub KE — Environment Variables

## Backend (`backend/.env`, based on `backend/.env.example`)

| Variable | Default (dev) | Purpose |
|---|---|---|
| `DJANGO_SECRET_KEY` | insecure placeholder | **Must** be a long random string in any non-local environment |
| `DJANGO_DEBUG` | `True` | Never `True` in production |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated; add your real domain(s) in prod |
| `DJANGO_SETTINGS_MODULE` | `config.settings.dev` | `config.settings.dev` \| `.test` \| `.prod` |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` | `thrifthub` / `thrifthub` / `thrifthub` / `localhost` / `5432` | PostgreSQL connection |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated frontend origin(s). Only matters if frontend and backend are on different origins — same-origin deployments (Docker Compose/nginx proxy) don't need this |
| `FRONTEND_URL` | `http://localhost:5173` | Used to build the password-reset link sent by email |
| `EMAIL_BACKEND` | console backend | Set to `django.core.mail.backends.smtp.EmailBackend` in prod |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` / `EMAIL_USE_TLS` | blank | SMTP credentials — only needed once `EMAIL_BACKEND` is SMTP |
| `DEFAULT_FROM_EMAIL` | `ThriftHub KE <no-reply@thrifthub.co.ke>` | From-address on outgoing email |
| `VAT_RATE` | `0.16` | Kenya standard VAT, assumed prices are VAT-inclusive (assumption A2) |
| `DEFAULT_SHIPPING_FEE_KES` | `250` | Flat shipping fee below the free-shipping threshold |
| `FREE_SHIPPING_THRESHOLD_KES` | `5000` | Order subtotal-after-discount at or above which shipping is free |
| `RETURN_WINDOW_HOURS` | `48` | Documented policy window (assumption A6); not yet enforced in code — see future improvements |
| `PAYMENT_PROVIDER` | `mock` | `mock` (instant simulated success, used in dev/test) or `mpesa` (real Daraja API) |
| `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET` / `MPESA_SHORTCODE` / `MPESA_PASSKEY` / `MPESA_CALLBACK_URL` / `MPESA_ENV` | blank / `sandbox` | Only needed once `PAYMENT_PROVIDER=mpesa` — see `payments/mpesa_provider.py`. `MPESA_CALLBACK_URL` must be a **public HTTPS URL** reachable by Safaricom's servers |
| `AWS_STORAGE_BUCKET_NAME` / `AWS_S3_REGION_NAME` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_S3_ENDPOINT_URL` | blank | Prod-only, S3-compatible object storage for media (see `config/settings/prod.py`); falls back to local filesystem storage if unset |

## Frontend (`frontend/.env.local`, based on `frontend/.env.example`)

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | Only override this for a build that talks to a different-origin API; local dev relies on the Vite proxy instead (see `vite.config.js`) |

## Notes

- Neither `.env` file is committed (`.gitignore` excludes them everywhere except the
  `.env.example` templates).
- `SIMPLE_JWT`, `REFRESH_TOKEN_COOKIE*`, and the DRF throttle rates are intentionally **not**
  environment variables — they're security-relevant constants defined directly in
  `config/settings/base.py`/`dev.py`/`prod.py` so they can't be silently misconfigured via a
  stray `.env` value in production.
