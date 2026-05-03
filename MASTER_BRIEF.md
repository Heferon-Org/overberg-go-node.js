# OVERBERG GO — MASTER BUILD BRIEF FOR CLAUDE CODE

**To Claude Code: Read this entire document before writing a single line. Do NOT ask clarifying questions. Pick standard SA market choices and document them inline. After each Phase, commit, push to main, verify deploy succeeded, then move to next Phase.**

---

## 1. CURRENT STATE (DO NOT REBUILD)

### Live infrastructure
- **App URL:** https://overberg-go-node-js.vercel.app — DEPLOYED, all 27 routes returning 200
- **Repo:** https://github.com/Heferon-Org/overberg-go-node.js (branch: main)
- **Vercel project:** `overberg-go-node-js` (team: heferons-projects, prj_fnE8M6NJW3UQJF6fDeC0gDtwAmW2)
- **Supabase project:** `Overberg Go` — `fmdtdpqdtsjezjmyltgn` (operations@heferon.tech, eu-central-1, ACTIVE_HEALTHY)

### Database — already deployed, do not re-run schema
**18 tables live with RLS enabled, seeded:**
- profiles, restaurants (13 rows), menu_items (14 rows), orders, drivers, driver_earnings
- experiences (8 rows), stays (6 rows), reviews, notifications
- payments, dispatch_logs, surge_zones (3 rows), driver_ratings, merchant_ratings
- promo_codes (5 rows: NEWUSER, SEA20, FRESHFISH, FREEDEL50, LOYAL10)
- support_tickets (auto OBG-T-NNNNN), kyc_documents
- Sequences: order_number_seq (orders → OBG-NNNN starting 2850), support_ticket_seq

### Frontend — already built, do not rebuild
- Next.js 16.2.2 + React 19.2.4 + TS 5 + Tailwind 4
- 27 routes: addresses, auth, cart, chat, driver, explore, favorites, food, food/[id], groceries, loyalty, notifications, orders, profile, promos, referral, ride, search, services, settings, stays, vendor, wallet, home
- Zustand stores (7): cart, wallet, favorites, loyalty, addresses, location, toast
- next.config.ts: `output: 'standalone'` only (serwist removed)
- app/vercel.json: `{"framework":"nextjs"}` — repo Root Directory is `app`
- Theme: light green #1E9E5A, sea blue #0E9EC2, sand white #F2EFE6, dark #1A2E35
- Fonts: Plus Jakarta Sans + Inter

### Data layer — already wired
- `app/src/lib/supabase/client.ts`, `server.ts`, `types.ts`
- `app/src/lib/data.ts` has async fetchers (fetchRestaurants, fetchMenu, fetchExperiences, fetchStays, fetchGroceryProducts) with seed fallback
- All 9 consumer pages refactored to async useEffect loading

### PWA assets — already deployed
- 8 icon sizes (72/96/128/144/152/192/384/512) in `app/public/icons/`
- `apple-touch-icon.png`, `favicon.ico`
- `manifest.json` with full icon set + 3 shortcuts (Order Food / Book Ride / My Orders)
- Service worker: `app/public/sw.js` (custom, not serwist)

### Vercel env vars — already set
- `NEXT_PUBLIC_SUPABASE_URL` → https://fmdtdpqdtsjezjmyltgn.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (set on production+preview+development)
- `SUPABASE_SERVICE_ROLE_KEY` (set on production+preview+development)

---

## 2. STACK — USE ONLY THESE, NO SUBSTITUTIONS

| Layer | Service | Notes |
|---|---|---|
| Hosting | Vercel | overberg-go-node-js, free tier till revenue |
| Database | Supabase | fmdtdpqdtsjezjmyltgn |
| Realtime | Supabase Realtime | included |
| File storage | Supabase Storage | for KYC uploads, avatars, vendor photos |
| Edge functions | Supabase Edge Functions | for dispatch + surge calcs |
| Push notifications | Firebase FCM | project: overberg-go (ID: 1028977347003), GCP org: heferon.tech |
| SMS / OTP | Twilio | SA number, use Twilio Verify API |
| Email transactional | Brevo | for receipts, weekly statements |
| Payments | PayFast | SA-specific, ITN webhook |
| WhatsApp | Meta Business API | dedicated Overberg GO number |
| Maps | Mapbox | Token: `[MAPBOX_TOKEN_IN_VERCEL_ENV] |
| Geocoding | Mapbox Geocoding API | use the same token |
| Routing/Directions | Mapbox Directions API | use the same token |

**NOT USED — DO NOT TOUCH:**
- ❌ n8n (Overberg GO has no n8n dependency. Other Heferon projects use n8n.heferon.tech but Overberg GO is standalone.)
- ❌ Google Maps (use Mapbox)
- ❌ Clickatell, Telnyx (use Twilio)
- ❌ SendGrid, Resend (use Brevo)
- ❌ OneSignal, Pusher (use FCM)

---

## 3. CREDENTIALS — WHEN YOU HIT EACH PHASE

Eugene will provide credentials JUST-IN-TIME, not all upfront. At the start of each phase that needs new credentials, **stop and ask Eugene for these specific keys** (no others). Only ask once you reach that phase, not before.

### Already provided (in Vercel env vars)
- Supabase URL, anon key, service role key

### Needed for Phase 2 (Auth) — ask Eugene
- `TWILIO_ACCOUNT_SID` — starts with AC...
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID` — starts with VA...
- `TWILIO_FROM_NUMBER` — the SA Twilio number, +27 format
- `GOOGLE_OAUTH_CLIENT_ID` (for social login)
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `APPLE_OAUTH_CLIENT_ID`
- `APPLE_OAUTH_TEAM_ID`
- `APPLE_OAUTH_KEY_ID`
- `APPLE_OAUTH_PRIVATE_KEY` (P8 file content)

### Needed for Phase 3 (PayFast) — ask Eugene
- `PAYFAST_MERCHANT_ID`
- `PAYFAST_MERCHANT_KEY`
- `PAYFAST_PASSPHRASE`
- Confirm: production mode or sandbox

### Needed for Phase 4 (Maps)
- Already have Mapbox token. No further keys needed.

### Needed for Phase 5 (Dispatch)
- No new keys (uses Supabase Edge Functions + FCM)
- Will need FCM keys (see Phase 7)

### Needed for Phase 7 (Notifications) — ask Eugene
- `FCM_SERVER_KEY` (from Firebase Console → Project Settings → Cloud Messaging)
- `FCM_PROJECT_ID` = `overberg-go`
- `FCM_VAPID_KEY` (Web Push certificate)
- Service account JSON for FCM admin SDK
- `BREVO_API_KEY` — starts with xkeysib-

### Needed for Phase 10 (WhatsApp) — ask Eugene
- `META_WHATSAPP_ACCESS_TOKEN`
- `META_WHATSAPP_PHONE_NUMBER_ID`
- `META_WHATSAPP_BUSINESS_ACCOUNT_ID`
- `META_WHATSAPP_VERIFY_TOKEN` (you set this yourself, document in env)
- `ANTHROPIC_API_KEY` (for AI ordering agent — Eugene to provide)

---

## 4. PHASE-BY-PHASE BUILD ORDER

### Phase 2 — Real authentication (~6 hours)
**Goal:** User can sign up with phone OTP via Twilio Verify, persist session, optionally use Google/Apple social.

Build list:
1. Configure Twilio Verify in Supabase Dashboard → Auth → Providers → Phone (Twilio). Eugene to add SID/Token in Supabase UI; you write the code.
2. Replace demo OTP screen with real `supabase.auth.signInWithOtp({ phone: '+27...' })` flow.
3. Add OTP verify screen calling `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`.
4. Persist session via `@supabase/ssr` (already in deps) with cookies.
5. Add `app/middleware.ts` to refresh session on every request.
6. Wire Google + Apple social login via Supabase Auth → OAuth providers.
7. Build KYC flow for drivers:
   - Screen at `/driver/kyc` — upload SA ID, driver's license, PrDP, vehicle reg, vehicle insurance, roadworthy, banking proof
   - Files go to Supabase Storage bucket `kyc-documents`
   - Inserts into `kyc_documents` table with status='pending'
   - Updates `drivers.kyc_status` accordingly
8. Build KYC flow for vendors at `/vendor/kyc`:
   - Business registration, owner SA ID, banking proof, food handling cert (if applicable), liquor license (if applicable)
   - Same flow against `kyc_documents` table

Test: Eugene's phone gets real SMS, can log in, KYC docs upload to Storage.

Commit: `feat(auth): real Twilio OTP + Google/Apple social + KYC flows for driver and vendor`

### Phase 3 — PayFast + wallet (~12 hours)
**Goal:** Customers can top up wallet, pay for orders. Drivers and merchants get weekly payouts.

Build list:
1. Wallet top-up screen at `/wallet/topup` with R50/R100/R200/R500/custom buttons.
2. POST `/api/payfast/initiate` — creates a PayFast signature, returns redirect URL.
3. PayFast webhook at `/api/payfast/itn` — validate signature, validate origin (PayFast sandbox/production IPs), update `payments` table to status='completed', credit wallet.
4. Order checkout screen — wallet first, then card via PayFast if insufficient.
5. Driver earnings calc on order delivered:
   - 80% of delivery fee → driver_earnings (type='delivery', payout_status='pending')
   - First 100 trips: 100% to driver (no commission)
   - Tips → driver_earnings (type='tip')
6. Weekly payout cron (Friday 17:00 SAST) — Supabase Edge Function `weekly-payouts`:
   - Aggregate driver_earnings where payout_status='pending'
   - Create payment record type='driver_payout'
   - Generate tax invoice (PDF stored in Supabase Storage bucket `payout-invoices`)
   - Mark earnings as paid
   - Email driver via Brevo (use stub if Brevo key not yet provided — log to console for now)
7. Same for merchants: 15% commission (12% over R50k/month). Friday EFT to merchant bank account.
8. Refund flow on order cancellation — credits wallet back, creates payment type='refund'.

Test: Top up R100 from sandbox, place order, see PayFast confirm, balance debits.

Commit: `feat(payments): PayFast wallet top-up + order payment + driver/merchant payout system`

### Phase 4 — Maps + tracking (~8 hours)
**Goal:** Address autocomplete, live driver tracking, route polylines, ETA.

Build list:
1. Add `NEXT_PUBLIC_MAPBOX_TOKEN` to Vercel env vars (use the token from §2 — [MAPBOX_TOKEN_IN_VERCEL_ENV]
2. Replace any Google Maps imports/scripts with `mapbox-gl` and `@mapbox/mapbox-gl-geocoder`.
3. Address autocomplete on `/addresses/new` using Mapbox Geocoding API.
4. Driver app `/driver` adds geolocation tracking — every 5s when an order is active, posts lat/lng to `drivers.latitude`/`drivers.longitude`.
5. Customer order screen `/orders/[id]` shows live map with:
   - Restaurant pin (origin)
   - Customer pin (destination)
   - Driver pin (live, from Supabase Realtime channel `order:{id}`)
   - Route polyline via Mapbox Directions API
6. ETA calculation using Mapbox Directions API duration field.
7. Geofence check: if customer address outside Cape Agulhas Municipality bounds (-34.87 to -34.40 lat, 19.90 to 20.30 lng), show "Coming soon to your area" + waitlist signup form.

Test: Place order from Struisbaai, watch fake driver pin move on map.

Commit: `feat(maps): Mapbox integration — address autocomplete, live driver tracking, polyline routing, ETA`

### Phase 5 — Dispatch engine (~10 hours)
**Goal:** New order → automatically finds and assigns nearest available driver.

Build list:
1. Supabase Edge Function `dispatch-order` (Deno):
   - Trigger: webhook from order status='confirmed'
   - Query: `drivers WHERE is_online=true AND kyc_status='verified'`
   - Calc Haversine distance to restaurant pickup
   - Take 5 nearest within 10km
   - Insert dispatch_logs row (status='offered') for the nearest
   - Send FCM push to that driver: "New order — R45 fee, 3.2km"
   - Set 30s timeout
2. Driver accept/reject endpoint `/api/driver/dispatch/respond`:
   - Updates dispatch_logs (status='accepted' or 'rejected')
   - On accept: orders.driver_id = driver_id
   - On reject or timeout: dispatch to next nearest, log timed_out
3. Order status update webhook → Realtime broadcast on `order:{id}` channel.
4. Surge zones check: when order placed, if customer location is inside an active surge_zone, multiply delivery_fee by zone.multiplier (cap 2.5x). Show surge notice on order screen.

Test: Confirm an order, see dispatch log entries, see FCM push on test driver phone.

Commit: `feat(dispatch): proximity-based driver assignment with 30s fallback + surge zone pricing`

### Phase 6 — Realtime order updates (~3 hours)
**Goal:** Customer, merchant, driver all see live order status.

Build list:
1. Supabase Realtime channel `order:{id}` — broadcast on every UPDATE to orders table.
2. Customer screen subscribes — animates progress bar through: placed → confirmed → preparing → ready → picked_up → on_the_way → delivered.
3. Merchant dashboard at `/vendor/orders` — live list, sorted by created_at, with action buttons (Confirm, Mark Ready).
4. Driver app `/driver/active` — shows current order, navigation hint, action buttons (Picked Up, Arrived, Delivered).
5. Push notifications fire on every transition (use FCM stub if not configured yet).

Test: Place order in tab 1, accept as merchant in tab 2, watch tab 1 update live.

Commit: `feat(realtime): live order status across customer, merchant, driver via Supabase Realtime`

### Phase 7 — Notifications (~6 hours)
**Goal:** FCM push, Twilio SMS, Brevo email.

Build list:
1. FCM web push setup:
   - Add `firebase-admin` to package.json
   - Initialize with service account JSON (Eugene to provide)
   - Register service worker for FCM at `/firebase-messaging-sw.js`
   - On user login, request notification permission, get FCM token, save to `profiles.fcm_token` (add column via migration)
   - Send push on order events via `/api/notifications/push`
2. Twilio SMS for critical events:
   - Delivery code SMS to customer when driver picks up: "Driver arriving with code 4729"
   - Driver assigned SMS: "Daluvuyo (Ford Fiesta CS 20141) accepted your order"
   - Out-of-app fallback if FCM not registered
3. Brevo transactional email:
   - Order receipt
   - Weekly driver/merchant statement (PDF attached)
   - Welcome email
   - Password reset (Supabase handles, but customize template via Brevo)
4. Notification template registry at `app/src/lib/notifications/templates.ts` — central place for all SMS/email/push copy in EN.

Test: Place order, get push + SMS + email receipt. Mark delivered, get rating prompt push.

Commit: `feat(notifications): FCM push + Twilio SMS + Brevo transactional email + central template registry`

### Phase 8 — Admin dashboard (~16 hours)
**Goal:** Miquel runs the entire operation from one screen.

Build list:
1. New role check: `profiles.role='admin'`. Add Eugene + Miquel manually via SQL.
2. Route gate at `app/middleware.ts` — `/admin/*` requires role='admin'.
3. `/admin` home with KPIs:
   - Today's orders, GMV, active drivers, pending KYC, open tickets
   - Live order map (all active orders, real-time, Mapbox)
4. `/admin/orders` — paginated list with filters (status, date, restaurant, driver).
5. `/admin/drivers` — manage drivers: active/suspended toggle, KYC review (approve/reject documents), payout history.
6. `/admin/merchants` — manage restaurants/vendors: same pattern.
7. `/admin/payouts` — weekly run: see drafts, approve, mark paid (manual EFT), regenerate invoice.
8. `/admin/promos` — create/edit/disable promo codes (uses promo_codes table).
9. `/admin/tickets` — support ticket queue, assign, resolve.
10. `/admin/users` — user moderation: block, force password reset, refund last order.
11. `/admin/analytics` — charts via recharts:
   - Orders per day (last 30, 90, 365)
   - GMV per day
   - Take rate over time
   - Driver earnings distribution
   - Top restaurants by revenue
   - Surge zone activations heat-map

Test: Login as Eugene, manage everything end-to-end.

Commit: `feat(admin): full operations dashboard with KPIs, order management, driver/merchant CRUD, analytics`

### Phase 9 — Multi-language EN/AF (~6 hours)
**Goal:** Bredasdorp customers get Afrikaans by default.

Build list:
1. Add `next-intl` to deps.
2. `app/src/messages/en.json`, `af.json` — full UI copy.
3. `app/middleware.ts` — detect Accept-Language header, default to AF if `af-ZA` or `af`.
4. Language toggle in `/profile/settings`.
5. First-launch language picker overlay.
6. All hardcoded strings refactored to `t('key')`.
7. Translate seed data: restaurant subtitles, experience descriptions, stay descriptions all duplicated into a translations table OR added as `name_af`, `description_af` columns (decide simplest, document choice).

Test: Visit on AF browser, see Afrikaans by default. Toggle to EN, persists.

Commit: `feat(i18n): English + Afrikaans support via next-intl with locale detection`

### Phase 10 — WhatsApp ordering (~16 hours)
**Goal:** Customer texts WhatsApp number, AI handles intent, drops them into web app with prefilled cart.

Build list:
1. Meta WhatsApp Business webhook at `/api/whatsapp/webhook`.
   - GET handler for hub.challenge verification
   - POST handler for incoming messages
2. AI agent using Anthropic Claude Sonnet:
   - Parse message intent: order food | book ride | check status | support | greeting
   - Reply with menu or clarifying question
   - On full order intent, generate magic link to `/cart?prefill={token}` with cart prefilled
3. Order confirmations sent to customer WhatsApp on every status change (instead of/in addition to SMS).
4. Driver assignment WhatsApp: customer gets driver's name + photo + ETA via WhatsApp.
5. New table: `whatsapp_conversations` to track session state (customer_phone, last_message, intent_state, cart_draft).

Test: Send "I want a fish & chips" to Overberg GO WhatsApp, get menu link, finish in browser.

Commit: `feat(whatsapp): Meta Business API integration + Claude Sonnet ordering agent + status updates via WhatsApp`

### Phase 11 — AI surge pricing + driver hotspots (~10 hours)
**Goal:** Smart pricing + driver positioning hints.

Build list:
1. Edge Function `calculate-surge` (runs every 5 min via Supabase cron):
   - Read demand: orders placed in last 15 min by zone
   - Read supply: drivers online by zone
   - Read weather: OpenWeather API call (free tier — Eugene to provide key, or use Mapbox weather)
   - Read events: hardcoded list of "high-demand" days (school holidays, public holidays)
   - Calculate multiplier per zone, cap 1.0x–2.5x
   - Update surge_zones rows
2. Driver hotspot map at `/driver/hotspots`:
   - Heat map of expected demand by hour for next 4 hours
   - "Move to L'Agulhas Lighthouse — projected R220 in next 2 hours"
3. Smart promo codes: if user hasn't ordered in 14 days, generate personal "WELCOME_BACK_15" valid 48h.
4. Driver earnings projection: based on hours online + zone, estimate R for next 4hrs.

Test: Trigger surge function manually, see multiplier change, see hotspot map populate.

Commit: `feat(ai): surge pricing engine + driver hotspot map + smart promo generation`

### Phase 12 — Final polish (~2 hours)
1. Lighthouse 90+ on home, food, ride, orders.
2. Service worker offline mode tested — show "You're offline" banner, cache last-viewed orders.
3. Add to Home Screen prompt — show after 2nd visit.
4. Splash screen polish — Overberg GO logo + tagline.
5. 404 page custom branded.
6. README.md with full setup instructions.

Commit: `chore: Lighthouse pass, offline mode, A2HS, splash polish, README`

---

## 5. EXECUTION RULES

1. **Read every file before editing.** Don't assume structure.
2. **One Phase at a time.** Don't jump ahead.
3. **Commit after every Phase.** Never accumulate uncommitted changes across Phases.
4. **Verify Vercel deploy after every push.** Wait for status='READY'. If 'ERROR', read logs and fix before next Phase.
5. **No mockups.** Eugene specifically said no mockups. Production code only.
6. **No n8n.** Do not introduce n8n at any point.
7. **No Google Maps.** Mapbox only.
8. **No clickatell, no telnyx, no sendgrid, no resend.** Use Twilio + Brevo + FCM.
9. **Pause and ask Eugene** at the start of each Phase that needs new credentials (§3). Do not invent or fake keys. Do not commit any credentials to git — Vercel env vars only.
10. **When you finish all Phases**, send Eugene a final message with: list of all env vars set, list of all routes live, demo video script, what's left for production launch (e.g. domain DNS, app store listings, etc).

---

## 6. KNOWN STATE OF EXTERNAL ACCOUNTS

- GitHub PAT: `[GITHUB_PAT_IN_MCP]` (Eugene's, full repo + admin scopes)
- Vercel API token: `[VERCEL_TOKEN_IN_MCP]`
- Supabase PAT: `[SUPABASE_PAT_IN_MCP]`

These already exist in your `.mcp.json`. Confirm they work via `claude /mcp` before starting Phase 2.

---

## 7. EUGENE'S COMMUNICATION RULES (HONOR THESE)

- Direct, blunt, no fluff.
- No bullet-point walls in summaries — terse.
- Don't ask clarifying questions unless genuinely blocked.
- When you say "build" — produce files, code, deployable output. Not descriptions.
- Flag real risks. Don't protect his ego.
- Default to PowerShell for any Windows commands.
- Python is at `C:\Python314\`. Node is installed. Venv is at `C:\Johan\venv\`.

---

**Begin Phase 2 now. Stop and ask Eugene for the Twilio + Google + Apple credentials listed in §3 before writing the auth code.**
