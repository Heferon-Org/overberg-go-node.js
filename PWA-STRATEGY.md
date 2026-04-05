# OverBerg Go - PWA Analysis & Build Strategy

## Current State Assessment

The entire app lives in a **single 1,361-line HTML file** (`overberg-go.html`) wrapped in a phone-shaped CSS device frame. It's a **high-fidelity mockup**, not a functional app.

### What Exists (11 Screens)

| Screen | ID | Status | Notes |
|--------|----|--------|-------|
| Home | `s-home` | UI complete | Services grid, weather, promos, popular restaurants |
| Food / Restaurants | `s-food` | UI complete | 9 restaurant cards, category chips (non-functional filters) |
| Restaurant Menu | `s-menu` | Partial | Single hardcoded menu, category tabs switch visually only |
| Book a Ride | `s-ride` | UI complete | Fake CSS map, 3 ride types, driver card — all static |
| PnP Groceries | `s-pnp` | UI complete | 8 aisle categories, 8 products, Smart Shopper mock |
| Experiences & Services | `s-exp` | UI complete | 12 experience cards across 5 categories — most complete screen |
| Guest Houses & Stays | `s-stays` | UI complete | 6 accommodation cards with filters |
| Orders | `s-orders` | UI complete | 1 active order with tracker, 4 past orders — all static |
| Profile / Me | `s-me` | UI complete | Stats, payment methods, addresses, settings — all decorative |
| **Driver Dashboard** | `s-driver` | **Shell only** | Earnings display, 1 trip request, mini map — no real functionality |
| **Restaurant Dashboard** | `s-restaurant` | **Shell only** | 1 incoming order, 3 in-progress, menu toggles — no real functionality |

### What's Missing (Critical Gaps)

**Zero Infrastructure:**
- No PWA manifest, no service worker, no offline support
- No backend / API / database
- No authentication (login/signup)
- No real routing (screens toggle via CSS class swaps)
- No state management (3 global variables)
- Fixed 390x844 phone frame — not responsive at all

**Non-Functional Features:**
- Search bars are decorative (onclick opens food screen)
- Category filter chips don't filter anything
- Checkout flow shows `alert('Checkout flow — live integration coming!')`
- All "Book Now" buttons show toast messages only
- No payment integration (mentions PayFast/SnapScan)
- No real maps (CSS grid fake)
- No notifications (bell icon is decorative)
- Order tracking is completely static
- Driver/Restaurant dashboards are display-only mockups

---

## PWA Build Strategy - Get Working ASAP

### Recommended Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 14 (App Router)** | PWA-ready, SSR/SSG, API routes as backend, file-based routing |
| UI | **Tailwind CSS** | Port existing design tokens quickly, mobile-first |
| State | **Zustand** | Lightweight, no boilerplate, perfect for cart/auth state |
| Database | **Supabase** | Postgres + Auth + Realtime + Storage, free tier, fast setup |
| Maps | **Leaflet + OpenStreetMap** | Free, no API key needed for basic maps |
| Payments | **PayFast** | South African standard, simple integration |
| PWA | **next-pwa** or `@serwist/next` | Auto-generates service worker, caching strategies |
| Hosting | **Vercel** | Zero-config Next.js deployment, free tier |

### Phase 1: Foundation (Get it running as a real PWA)

**Priority: Convert mockup to installable, navigable PWA**

```
/app
  /layout.tsx          -- Root layout, fonts, theme, bottom nav
  /page.tsx            -- Home screen
  /food/page.tsx       -- Restaurant listing
  /food/[id]/page.tsx  -- Restaurant menu
  /ride/page.tsx       -- Ride booking
  /groceries/page.tsx  -- PnP groceries
  /explore/page.tsx    -- Experiences & services
  /stays/page.tsx      -- Guest houses
  /orders/page.tsx     -- Order history + tracking
  /profile/page.tsx    -- User profile
  /driver/page.tsx     -- Driver dashboard
  /vendor/page.tsx     -- Restaurant dashboard
  /auth/page.tsx       -- Login / signup
/components
  /BottomNav.tsx
  /ServiceGrid.tsx
  /RestaurantCard.tsx
  /CartBar.tsx
  /SearchBar.tsx
  ...
/lib
  /supabase.ts
  /store.ts            -- Zustand stores (cart, auth, location)
/public
  /manifest.json
  /icons/              -- PWA icons (192, 512)
  /sw.js               -- Service worker (auto-generated)
```

**Key tasks:**
1. `npx create-next-app@latest overberg-go --typescript --tailwind --app`
2. Port CSS variables to Tailwind config (colors, fonts, border-radius)
3. Convert each screen div into a route/page
4. Extract reusable components (cards, chips, buttons)
5. Add `manifest.json` + service worker via `next-pwa`
6. Remove phone frame wrapper -- make it full-screen responsive
7. Add `<meta name="theme-color">` + Apple touch icons

### Phase 2: Core Functionality (Make it actually work)

**Priority: Auth + Food ordering end-to-end**

1. **Supabase setup:**
   - `restaurants` table (name, emoji/image, rating, delivery_time, delivery_fee, tags, location, hours)
   - `menu_items` table (restaurant_id, name, description, price, category, emoji/image, available)
   - `orders` table (user_id, restaurant_id, items, status, total, created_at)
   - `users` / `profiles` table (via Supabase Auth)

2. **Auth flow:**
   - Phone number OTP via Supabase Auth (SA mobile numbers)
   - Or email/password as fallback
   - Protected routes for orders, profile, driver, vendor

3. **Food ordering (end-to-end):**
   - Browse restaurants (with real search + filter)
   - View menu (dynamic from DB)
   - Add to cart (Zustand store, persisted to localStorage)
   - Checkout page (address, payment method, order notes)
   - PayFast integration for payment
   - Order confirmation + status tracking

4. **Ride booking (basic):**
   - Leaflet map with pickup/dropoff pins
   - Fare calculator (distance-based)
   - Request ride flow (creates order in DB)
   - Driver matching (simple: notify nearest online driver)

### Phase 3: Driver & Vendor Apps (Make the supply side work)

**These are separate authenticated views, NOT separate apps.**

**Driver Dashboard (`/driver`):**
- Toggle online/offline status (updates `drivers` table in real-time)
- Receive trip requests via Supabase Realtime subscriptions
- Accept/decline with timer
- Navigation link (deep-link to Google Maps)
- Earnings summary (daily/weekly/monthly)
- Trip history

**Vendor/Restaurant Dashboard (`/vendor`):**
- Receive new orders via Supabase Realtime
- Accept/decline orders with prep time estimate
- Update order status (preparing -> ready -> picked up)
- Toggle menu item availability
- Daily revenue summary
- Menu management (add/edit/remove items)

### Phase 4: Polish & Scale

- Push notifications (web push via service worker)
- Offline menu browsing (cache restaurant data)
- Image uploads for restaurants/menu items (Supabase Storage)
- Reviews & ratings system
- Promo codes / discount engine
- PnP grocery integration (API or curated catalog)
- Experiences booking with calendar/availability
- Guest house booking with date picker
- Analytics dashboard for admin

---

## What to Build First (MVP Priority Order)

The fastest path to a working PWA:

1. **Next.js project + PWA config + deploy to Vercel** (installable in 1 day)
2. **Port all 11 screens as static pages** (preserves existing UI, 1-2 days)
3. **Supabase + Auth** (login works, 1 day)
4. **Restaurant data in DB + dynamic pages** (food screen works, 1 day)
5. **Cart + Checkout + PayFast** (first real transaction, 2 days)
6. **Order tracking with Realtime** (orders screen works, 1 day)
7. **Driver dashboard with Realtime** (drivers can accept trips, 1-2 days)
8. **Vendor dashboard with Realtime** (restaurants can manage orders, 1-2 days)

**Total to functional MVP: ~10-12 working days**

---

## Design Tokens to Preserve

From the existing CSS variables — these define the brand:

```css
--primary: #1E9E5A    /* Kelp Green */
--primary-d: #167042
--primary-l: #B3EACF
--sea: #0E9EC2        /* Sea Blue */
--sand: #F2EFE6       /* Sand White */
--sun: #F5A623        /* Sun Gold */
--coral: #E8503A      /* Coral Red */
--dark: #0D1F2D       /* Dark backgrounds */
--h: 'Plus Jakarta Sans'  /* Headings */
--b: 'DM Sans'            /* Body text */
```

---

## Key Architecture Decisions

1. **Single app, role-based views** — Don't build 3 separate apps. One Next.js PWA with role switching (customer/driver/vendor) based on user profile.

2. **Supabase Realtime for live updates** — Order status changes, driver location, new order notifications all flow through Supabase Realtime channels. No need for a separate WebSocket server.

3. **Progressive enhancement** — Start with static/cached content, add real-time features progressively. Users can browse restaurants offline after first visit.

4. **Mobile-first, no phone frame** — Remove the 390x844 device wrapper. Use responsive CSS that works on any screen. The phone frame is for demos only.

5. **Deep links for navigation** — Instead of the current `nav('food')` function that swaps CSS classes, use Next.js routing (`/food`, `/ride`, etc.) so users can bookmark and share links.
