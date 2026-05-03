# OverBerg Go

A full-stack super app for the Overberg region (Cape Agulhas, Struisbaai, Bredasdorp, Arniston). Food delivery, rides, groceries, experiences, stays — all in one PWA.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Edge Functions, Storage)
- **Maps:** Mapbox GL JS (geocoding, directions, live driver tracking)
- **Payments:** PayFast (sandbox → production), GoWallet
- **Notifications:** FCM web push, Twilio SMS, Brevo email, WhatsApp (Meta Business API)
- **AI:** Claude Sonnet (WhatsApp ordering agent), OpenWeather (surge pricing)
- **PWA:** Serwist service worker, offline mode, Add to Home Screen
- **Charts:** Recharts (admin analytics)
- **i18n:** next-intl (English + Afrikaans)

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Supabase project (or local via `supabase start`)

### Setup

```bash
cd app
cp .env.example .env.local   # Fill in your credentials
npm install
npm run dev
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your-mapbox-token

# PayFast (sandbox)
PAYFAST_MERCHANT_ID=10000100
PAYFAST_MERCHANT_KEY=your-key
PAYFAST_PASSPHRASE=your-passphrase

# FCM Push (optional — gracefully skips if missing)
FIREBASE_SERVICE_ACCOUNT_JSON={"project_id":"...","client_email":"...","private_key":"..."}
NEXT_PUBLIC_FIREBASE_API_KEY=your-key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key

# Twilio SMS (optional)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_FROM_NUMBER=+27xxxxxxxxx

# Brevo Email (optional)
BREVO_API_KEY=your-key

# WhatsApp (optional)
META_WHATSAPP_TOKEN=your-token
META_PHONE_NUMBER_ID=your-phone-number-id
META_WHATSAPP_VERIFY_TOKEN=your-verify-token

# AI Agent (optional)
ANTHROPIC_API_KEY=your-key

# Weather for surge pricing (optional)
OPENWEATHER_API_KEY=your-key
```

### Database Migrations

Apply in order:

```bash
supabase db push  # or apply manually via Supabase Dashboard → SQL Editor
```

Migration files are in `supabase/migrations/`.

## Project Structure

```
app/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── admin/            # Admin dashboard (role-gated)
│   │   ├── api/              # API routes
│   │   ├── auth/             # Authentication
│   │   ├── driver/           # Driver dashboard + active trip + hotspots
│   │   ├── food/             # Restaurant browsing + menu
│   │   ├── orders/           # Order list + live tracking
│   │   ├── vendor/           # Merchant dashboard + live orders
│   │   └── ...
│   ├── components/           # Shared UI components
│   ├── i18n/                 # Internationalization (EN/AF)
│   ├── lib/
│   │   ├── mapbox/           # Geocoding, directions, geofence
│   │   ├── notifications/    # FCM, SMS, email, templates
│   │   ├── supabase/         # Client, server, admin, hooks, types
│   │   ├── whatsapp/         # Meta Business API + AI agent
│   │   ├── dispatch/         # Driver dispatch invocation
│   │   └── store.ts          # Zustand stores
│   └── messages/             # i18n JSON (en.json, af.json)
├── supabase/
│   ├── functions/            # Edge Functions (dispatch, surge, payouts)
│   └── migrations/           # SQL migration files
└── public/                   # Static assets, SW, manifest
```

## Key Features

| Feature | Route | Description |
|---------|-------|-------------|
| Home | `/` | Service grid, promos, nearby restaurants |
| Food ordering | `/food`, `/food/[id]` | Browse, add to cart, checkout |
| Live tracking | `/orders/[id]` | Real-time driver position on Mapbox |
| Driver app | `/driver` | Accept dispatches, navigate, complete trips |
| Vendor dashboard | `/vendor/orders` | Live order queue, status transitions |
| Admin console | `/admin` | KPIs, order/driver/merchant management |
| Analytics | `/admin/analytics` | Orders/GMV charts, top restaurants |
| WhatsApp ordering | Webhook | AI agent parses intent, generates cart link |
| Surge pricing | Edge Function | Auto-calculates demand/supply multiplier |
| Push notifications | FCM | Real-time order updates |

## Deployment

Deployed on Vercel. Push to the configured branch triggers auto-deploy.

```bash
vercel --prod
```

## License

Private — Heferon AI / OverBerg Go.
