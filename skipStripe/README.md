# Stripe Invoice Portal

Production-oriented MVP SaaS for generating professional PDF invoices from Stripe payments and serving them through a customer self-service portal.

## Stack

- Next.js App Router
- React + TailwindCSS
- shadcn/ui-style components
- Next.js Route Handlers
- Supabase Postgres, Auth, and Storage
- Stripe API
- Puppeteer PDF generation
- Vercel deployment target

## Features

- Secure dashboard login with Supabase Auth
- Encrypted Stripe restricted key storage
- Stripe payment listing with invoice generation
- PDF invoice rendering and Supabase Storage upload
- Public `/portal` with Supabase magic-link verification and self-service invoice downloads
- Signed portal tokens so Stripe credentials never reach the browser

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Fill in the required values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `ENCRYPTION_KEY`
- `PORTAL_SIGNING_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` for production magic-link delivery

Notes:
- `ENCRYPTION_KEY` should be a long random secret.
- Use a restricted read-only Stripe key inside the dashboard.
- Create a Supabase Storage bucket named `invoices` unless you change `SUPABASE_STORAGE_BUCKET`.
- In local development, magic-link request responses can expose a debug link for seeded demo emails.

4. Run the SQL in [schema.sql](/Users/paritoshshukla/Documents/Roblox/microsaas/new/gym/skipStripe/supabase/schema.sql) inside the Supabase SQL editor.

5. Start the app:

```bash
npm run dev
```

## Stripe Flow

- Dashboard users save a restricted Stripe key through `/api/connect-stripe`.
- `/api/stripe/payments` decrypts the key server-side and fetches recent Stripe charges.
- `/api/invoice/create` pulls a payment, renders invoice HTML, generates a PDF with Puppeteer, uploads it to Supabase Storage, and stores the invoice record.
- `/api/portal/request-magic-link` generates a Supabase Auth magic link for the portal email.
- `/api/portal/magic-link` verifies the token and sets an HTTP-only portal session cookie.
- `/portal` uses `/api/portal/search` only after that verified portal session is present.

## API Routes

- `POST /api/connect-stripe`
- `GET /api/stripe/payments`
- `POST /api/invoice/create`
- `GET /api/invoice/download?invoiceId=...`
- `POST /api/portal/request-magic-link`
- `GET /api/portal/magic-link`
- `POST /api/portal/search`

## Deployment on Vercel

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Add the environment variables from `.env.local` in Vercel Project Settings.
4. Ensure the Supabase Storage bucket exists and the SQL schema has been applied.
5. Deploy.

On Vercel the app uses `puppeteer-core` with `@sparticuz/chromium`. During local development it falls back to the full `puppeteer` package.

## Folder Structure

- `app/`
- `components/`
- `lib/`
- `supabase/`
- `templates/`

## Important Notes

- Stripe keys are encrypted with AES-256-GCM before being stored in Postgres.
- All Stripe access stays on the backend.
- Supabase service role access is used only in trusted server code for storage uploads and the public portal lookup flow.
- Invoice downloads now require either the owning dashboard user or a verified portal session for the invoice email.
