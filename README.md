# SmartBus

A bus ticket booking, live tracking, and fleet management platform built with
Next.js (App Router + TypeScript), Tailwind CSS, and Supabase
(Postgres/Auth/Realtime). This repo implements the foundation and a working
vertical slice of every phase from the spec, structured so you (or an AI
coding agent) can extend it phase by phase.

## What's actually implemented

- **Foundation**: Next.js + TS + Tailwind, Supabase client/server helpers,
  full DB schema + RLS migration, role-based route middleware.
- **Auth & roles**: email/password signup & login, `profiles.role`
  (`people` / `driver` / `admin`), role-gated layouts and middleware.
- **Passenger**: dashboard, search, seat map, atomic seat reservation,
  passenger details, mock payment step, QR ticket, ticket list, live
  tracking map (Supabase Realtime), nearby stops (geolocation + Haversine),
  passes (self-serve purchase), notifications list, feedback form, profile.
- **Driver**: dashboard (today's trip), trip list, active-trip screen with
  start/end trip, live GPS sharing (`watchPosition` → `trip_locations`),
  emergency/breakdown reporting, trip history, profile.
- **Admin**: dashboard with live stats, full CRUD reference implementation
  for **Buses** (`admin/buses`), read-only listings for routes/stops/
  schedules/drivers/trips/bookings/passes/feedback, user role management,
  a basic reports page.
- **Database**: every table from the spec, an atomic `reserve_seats()` RPC
  (the actual double-booking guard), `confirm_booking_payment()`,
  `cancel_booking()`, and RLS policies for every table.

## What's stubbed / left for you to finish

- **Payment gateway**: the booking flow calls `confirm_booking_payment()`
  with a mock transaction id. Wire up Razorpay checkout in
  `src/lib/payments` and verify the transaction server-side (a Next.js
  route handler or Supabase Edge Function) *before* calling that RPC.
- **Fares**: seat price is a flat placeholder (`FARE_PER_SEAT`). Add a fare
  table or a `base_fare`/`per_km_rate` column to `routes`/`schedules`.
- **CRUD for routes/stops/schedules/drivers**: these admin pages are
  read-only. Copy the pattern in `src/app/admin/buses/page.tsx` (list +
  modal form + `services/*.ts` insert/update/delete) for each.
- **ETA calculation**, ratings-driven driver leaderboards, lost & found UI,
  maintenance ticket UI, ticket QR scanning/validation at boarding.
- **PostGIS-based nearby-stops query** — the current implementation fetches
  all stops and filters client-side with the Haversine formula, which is
  fine at small scale. Move it into a Postgres RPC using
  `ST_DWithin` once `postgis` is enabled and stop counts grow.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project values
npm run dev
```

### 1. Create a Supabase project

1. Create a project at supabase.com.
2. In the SQL editor, run `supabase/migrations/0001_init.sql`, then
   `supabase/migrations/0002_booking_confirmation.sql`.
3. Optionally run `supabase/seed.sql` for demo buses/routes/stops/trips.
4. Copy your Project URL, anon key, and service-role key into `.env.local`.

### 2. Environment variables

See `.env.example`:

| Variable | Where it's used |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server Supabase clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server Supabase clients |
| `SUPABASE_SERVICE_ROLE_KEY` | **server-only** admin client (`lib/supabase/server.ts#createAdminClient`) — never import this file in a client component |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | add once you wire up real payments |
| `NEXT_PUBLIC_MAP_TILE_URL` | Leaflet tile source, defaults to OpenStreetMap |

### 3. Create demo accounts

Public sign-up always creates a passenger account. To get a driver or
admin account:

1. Sign up normally via `/signup`.
2. In the Supabase SQL editor:
   ```sql
   update profiles set role = 'admin' where email = 'you@example.com';
   -- or, for a driver:
   update profiles set role = 'driver' where email = 'driver@example.com';
   insert into drivers (profile_id, license_number, assigned_bus_id)
     select id, 'DL-0001', (select id from buses where bus_number = 'SB-101')
     from profiles where email = 'driver@example.com';
   ```
   (Or, once you're an admin, use `/admin/users` to change a passenger's
   role directly — driver-specific fields like license number still need
   a row in `drivers`.)

## Route / page list

```
/                              landing page
/login, /signup                auth

/passenger/dashboard
/passenger/search
/passenger/buses/[tripId]       seat selection (tripId, not a bus id)
/passenger/booking/[bookingId]  passenger details -> payment -> confirmation
/passenger/tickets
/passenger/tickets/[bookingId]
/passenger/passes
/passenger/tracking
/passenger/stops
/passenger/notifications
/passenger/feedback
/passenger/profile

/driver/dashboard
/driver/trips
/driver/trips/[tripId]          start/end trip, GPS sharing, emergency report
/driver/tracking
/driver/history
/driver/profile

/admin/dashboard
/admin/buses                    full CRUD (reference implementation)
/admin/routes, /stops, /schedules, /drivers, /trips, /bookings, /passes,
/feedback, /reports, /users
```

## RLS policy summary

- **Public read** on catalog data: `buses`, `routes`, `stops`, `route_stops`,
  `schedules`, `trips`, `seats`, `trip_locations` (needed for live tracking
  before login in some flows).
- **Admin-only write** on all catalog/fleet tables (`is_admin()` helper).
- **Passengers** can read/write only their own `bookings`,
  `booking_passengers`, `payments` (read-only), `tickets` (read-only),
  `passes`, `notifications`, `feedback`.
- **Drivers** can read their own `drivers` row and can `insert` into
  `trip_locations` only for a trip where they are the assigned driver and
  the trip's status is `running` — this is the actual authorization for
  GPS updates, not just a UI restriction.
- **Booking money-path** (`total_amount`, payment confirmation, ticket
  issuance, cancellation/refund) goes through `SECURITY DEFINER` RPCs
  (`set_booking_amount`, `confirm_booking_payment`, `cancel_booking`,
  `reserve_seats`) instead of raw table writes, so a client can't set its
  own price or mark its own payment as paid.

## Seat-booking correctness

Seat availability is **never** a stored flag on `seats`. Availability for a
given trip is computed by `available_seats_for_trip(trip_id)`, which
excludes seats that have a non-expired lock in `trip_seat_locks` for a
`pending` (within its hold window) or `confirmed` booking on that trip.
`reserve_seats(...)` inserts into `trip_seat_locks` inside a transaction; a
`unique_violation` on `(trip_id, seat_id)` is the double-booking guard, and
the function turns that into a friendly error. Expired holds are swept at
the start of every `reserve_seats()` call.

## Test checklist (MVP acceptance criteria)

- [ ] Passenger can register and log in.
- [ ] Passenger can search a route + date and see matching trips.
- [ ] Passenger can select a seat; a seat already locked for that trip
      cannot be selected by a second passenger (test with two browser
      sessions).
- [ ] Booking + mock payment produces a `confirmed` booking and a ticket
      with a QR code.
- [ ] Passenger can view and cancel an eligible booking.
- [ ] Driver can log in, see today's assigned trip, start it, and see their
      location update live on `/driver/trips/[id]`.
- [ ] A passenger with a confirmed booking on that trip sees the same
      location update on `/passenger/tracking` in near real time.
- [ ] Admin can create/edit/delete a bus from `/admin/buses`.
- [ ] Logging in as a passenger and hitting `/admin/*` redirects away
      (middleware + RLS both block it).
- [ ] Layouts are usable at a 375px mobile width and on desktop.

## Deployment

1. Push this repo to GitHub.
2. Import it into Vercel (or your host of choice); set the environment
   variables from `.env.example` in the project settings.
3. Confirm the Supabase project's **Auth → URL configuration** allows your
   deployed domain as a redirect URL.
4. Run the two migration files (and `seed.sql` if wanted) against your
   production Supabase project before first use.

## Folder structure

```
src/
  app/            routes, grouped by (auth) / passenger / driver / admin
  components/     ui/ (primitives), booking/, maps/, layout/
  lib/supabase/   browser + server + middleware Supabase clients
  services/       thin query/RPC wrappers used by pages
  types/          hand-written DB types (replace with `supabase gen types`)
supabase/
  migrations/     0001_init.sql (schema + RLS), 0002_booking_confirmation.sql
  seed.sql        demo buses/routes/stops/schedules/trips/seats
```
