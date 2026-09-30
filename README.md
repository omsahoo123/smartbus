# 🚌 SmartBus — Intelligent Bus Booking & Fleet Management System

> A full-stack bus booking platform built for real-world concurrency, security, and scalability.

---

## 📋 Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Tech Stack](#tech-stack)
4. [System Architecture](#system-architecture)
5. [Database Design](#database-design)
6. [User Roles & Permissions](#user-roles--permissions)
7. [Core Features](#core-features)
8. [Critical Errors in Booking Systems & How We Solved Them](#critical-errors-in-booking-systems--how-we-solved-them)
9. [Database Functions (RPCs)](#database-functions-rpcs)
10. [Security Model](#security-model)
11. [Migration Strategy](#migration-strategy)
12. [Running the Project](#running-the-project)

---

## 🎯 Problem Statement

Public transport management in most cities relies on outdated, manual, or fragmented systems. Key problems include:

- **No real-time seat availability** — passengers cannot see which seats are free before boarding.
- **Double booking** — two users can accidentally book the same seat at the same time.
- **No digital ticketing** — tickets are paper-based and easy to forge or lose.
- **No live bus tracking** — passengers have no way to know where their bus is or when it will arrive.
- **Admin bottleneck** — bus operators, routes, and schedules must be managed manually with no dashboard.
- **No structured refund policy** — cancellations are handled inconsistently.
- **No stoppage-level booking** — passengers cannot select a specific boarding and dropping stop; they pay for the full route.

These issues lead to poor commuter experience, revenue loss, and operational inefficiency.

---

## ✅ Solution Overview

**SmartBus** is a comprehensive, production-grade bus management and booking platform that solves all of the above problems:

| Problem | Solution |
|---|---|
| No real-time seat view | Interactive seat map with live availability derived from atomic database locks |
| Double booking | PostgreSQL Advisory Locks + Primary Key constraints on `trip_seat_locks` |
| No digital ticketing | Auto-generated QR-code tickets stored securely in the database |
| No live tracking | GPS telemetry table (`trip_locations`) with real-time Supabase subscriptions |
| Admin bottleneck | Full Admin Dashboard to manage buses, routes, stops, trips, drivers, and schedules |
| No refund policy | Configurable `cancellation_policies` table with time-based refund percentages |
| No stoppage booking | `boarding_stop_id` and `dropping_stop_id` per booking with route stop management |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 14** (App Router) | React framework with server-side rendering |
| **TypeScript** | Type-safe development across the entire codebase |
| **Tailwind CSS** | Utility-first responsive styling |
| **Leaflet + React Leaflet** | Interactive maps for stop visualization and bus tracking |
| **Lucide React** | Modern icon library |
| **QRCode.js** | QR code generation for digital tickets |
| **Zod** | Runtime schema validation for forms and API responses |

### Backend & Database
| Technology | Purpose |
|---|---|
| **Supabase** | Managed PostgreSQL + Auth + Realtime + Storage |
| **PostgreSQL 15** | Primary relational database |
| **PostGIS** | Geospatial extension for GPS coordinates |
| **pgcrypto** | Cryptographic functions for secure token generation |
| **Row Level Security (RLS)** | Database-enforced authorization for every table |
| **SECURITY DEFINER Functions** | Privileged stored procedures for atomic booking logic |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Supabase Auth** | JWT-based user authentication |
| **Supabase Realtime** | WebSocket subscriptions for live bus tracking |
| **Supabase Storage** | File storage for avatars and lost & found images |

---

## 🏗 System Architecture

```
+-----------------------------------------------------+
|                    CLIENT (Browser)                 |
|              Next.js 14 + TypeScript                |
|   +----------+  +----------+  +------------------+  |
|   | Passenger|  |  Driver  |  |  Admin Dashboard |  |
|   |   Pages  |  |  Pages   |  |      Pages       |  |
|   +----+-----+  +----+-----+  +--------+---------+  |
+--------+--------------+-----------------+-----------+
         |              |                 |
         v              v                 v
+-----------------------------------------------------+
|               Supabase Client SDK                   |
|          (@supabase/ssr  +  @supabase/supabase-js)  |
+------------------+----------------------------------+
                   |  HTTPS / WebSocket
                   v
+-----------------------------------------------------+
|                   Supabase Cloud                    |
|  +---------+ +----------+ +---------+ +----------+  |
|  |  Auth   | | PostgREST| |Realtime | | Storage  |  |
|  |  (JWT)  | |  (API)   | |(WS Hub) | |  (CDN)   |  |
|  +---------+ +----+-----+ +---------+ +----------+  |
|                   |                                 |
|          +--------v--------+                        |
|          |   PostgreSQL    |                        |
|          |   + RLS + RPCs  |                        |
|          +-----------------+                        |
+-----------------------------------------------------+
```

---

## 🗃 Database Design

### Entity Relationship Overview

```
profiles ---- drivers ---- buses ---- seats
    |                        |
    |                    schedules ---- routes ---- route_stops ---- stops
    |                        |
    |                      trips
    |                        |
    +------- bookings --------+
                |
        booking_passengers
                |
        trip_seat_locks <---- (Concurrency Guard)
                |
            payments
                |
            tickets (QR Token)
```

### Key Tables

| Table | Description |
|---|---|
| `profiles` | User account extended info (name, phone, role) |
| `buses` | Fleet registry (capacity, type, status) |
| `seats` | Physical seat layout per bus |
| `routes` | Named routes with source to destination |
| `stops` | Individual geo-located bus stops |
| `route_stops` | Ordered join table mapping stops to routes with timing |
| `schedules` | Recurring timetables (days of week, departure/arrival time) |
| `trips` | A specific run of a schedule on a date |
| `bookings` | Passenger booking records with hold expiry |
| `trip_seat_locks` | **The anti-double-booking table** — one row per (trip, seat) |
| `booking_passengers` | Passenger details per booking (name, age, gender) |
| `payments` | Payment records tied to bookings |
| `tickets` | Issued QR tickets with validity window |
| `trip_locations` | Live GPS pings from driver's app |
| `passes` | Monthly/weekly/route-specific travel passes |
| `notifications` | In-app notification system |
| `cancellation_policies` | Configurable refund tiers by hours before departure |
| `feedback` | Post-trip ratings and comments |
| `maintenance` | Bus issue reports by drivers |
| `lost_found` | Lost and found item tracking |

---

## 👥 User Roles & Permissions

The system has three roles defined in the `user_role` database enum:

### Admin
- Full access to all data
- Manages buses, routes, stops, schedules, trips, drivers
- Views all bookings, payments, and tickets
- Configures cancellation policies
- Manages maintenance reports

### Driver
- Views their own assigned trips
- Updates trip status (start/end)
- Logs GPS location (live tracking)
- Submits maintenance reports

### Passenger (People)
- Searches routes and trips
- Books seats with boarding/dropping stop selection
- Views their own bookings, tickets, payments
- Cancels bookings and receives refunds
- Tracks their bus live on a map
- Purchases travel passes
- Submits feedback and lost & found reports

---

## ⭐ Core Features

### Passenger App
- **Search trips** by source, destination, and date
- **Interactive Seat Map** — color-coded live availability
- **Boarding & Dropping Stop Selection** — pay only for your segment
- **10-Minute Hold** — seats locked while you pay
- **Payment Confirmation** — Razorpay-ready atomic payment flow
- **QR Ticket** — scannable digital ticket with unique token
- **Smart Cancellation** — auto-calculated refund based on time remaining
- **Live Bus Tracking** — real-time GPS on interactive map
- **Travel Passes** — daily, weekly, monthly, or route-specific

### Driver App
- **Trip Management** — start and end trips
- **GPS Broadcasting** — send live location to the server
- **Maintenance Reports** — report broken bus components

### Admin Dashboard
- **Fleet Management** — add/edit buses and seat layouts
- **Route & Stop Management** — define routes, stops, and their sequences on a map
- **Schedule & Trip Management** — create schedules, generate daily trips
- **Driver Management** — assign drivers to buses
- **Bookings Overview** — view all passenger bookings
- **Notification System** — push in-app alerts to users

---

## ⚠️ Critical Errors in Booking Systems & How We Solved Them

This is one of the most technically important parts of this project. Building a real ticketing system exposes a class of problems that don't exist in simple CRUD apps.

---

### 1. Dirty Read Problem (Race Condition / Double Booking)

**What is it?**
A "dirty read" in a booking system happens when two users simultaneously read the database, both see a seat as available, and both proceed to book it — resulting in the same seat being sold twice.

**Example Scenario:**
```
Time 00ms: User A reads Seat 12 → Available
Time 05ms: User B reads Seat 12 → Available
Time 10ms: User A inserts booking for Seat 12
Time 15ms: User B inserts booking for Seat 12 ← DOUBLE BOOKING
```

**How SmartBus Solves It:**

Two-layer protection:

**Layer 1 — Database Primary Key Constraint:**
The `trip_seat_locks` table has a composite primary key `(trip_id, seat_id)`. PostgreSQL will reject the second insert with a unique violation, which is caught and converted to a user-friendly error.

```sql
create table trip_seat_locks (
  trip_id    uuid not null,
  seat_id    uuid not null,
  booking_id uuid not null,
  primary key (trip_id, seat_id)  -- The hard constraint
);
```

**Layer 2 — Advisory Lock (Full Serialization):**
The `reserve_seats()` function acquires a `pg_advisory_xact_lock` scoped to the trip ID before any reads happen. This means only one transaction can evaluate and lock seats for a given trip at a time.

```sql
perform pg_advisory_xact_lock(hashtext('trip_seat_lock_' || p_trip_id::text));
```

This completely eliminates the race condition window.

---

### 2. Phantom Read Problem (Seat Appeared Available But Wasn't)

**What is it?**
A user sees a seat as available on the UI, but by the time they complete the booking form and submit, someone else has already taken it. The UI showed a "phantom" availability.

**How SmartBus Solves It:**
- Seat availability is recalculated **inside the server-side `reserve_seats()` transaction**, not trusted from the client.
- Before checking availability, all expired holds are cleaned up atomically in the same transaction, giving the most accurate real-time view.

---

### 3. Stale Hold / Zombie Lock Problem

**What is it?**
A user selects seats but abandons the app before paying. The seat remains "locked" indefinitely, preventing other passengers from booking it.

**How SmartBus Solves It:**
- Every booking gets a `hold_expires_at` timestamp set to 10 minutes from creation.
- At the beginning of every new `reserve_seats()` call, expired holds are automatically deleted from `trip_seat_locks` and their bookings are marked `expired`.

```sql
-- Runs at the START of every reservation attempt
delete from trip_seat_locks tsl
using bookings b
where tsl.booking_id = b.id
  and tsl.trip_id = p_trip_id
  and (b.booking_status = 'expired'
       or (b.booking_status = 'pending' and b.hold_expires_at < now()));
```

---

### 4. Expired Hold Payment (Paying After Timeout)

**What is it?**
A user holds seats for 10 minutes, then pays at the 12-minute mark. A basic system might still confirm the booking even though the hold expired and the seats may have been given to someone else.

**How SmartBus Solves It:**
The `confirm_booking_payment()` function checks the hold expiry with a row-level lock (`FOR UPDATE`) before confirming:

```sql
-- Row-level lock prevents concurrent confirmation
select * into v_booking from bookings
where id = p_booking_id and user_id = auth.uid()
for update;

-- Strict hold check
if v_booking.hold_expires_at < now() then
  delete from trip_seat_locks where booking_id = p_booking_id;
  update bookings set booking_status = 'expired' where id = p_booking_id;
  raise exception 'Your seat reservation has expired.';
end if;
```

---

### 5. Migration Error: Cannot Change Function Return Type

**What is it?**
In PostgreSQL, `CREATE OR REPLACE FUNCTION` cannot change the return type or argument types of an existing function. This causes the error:

```
ERROR: 42P13: cannot change return type of existing function
HINT: Use DROP FUNCTION cancel_booking(uuid) first.
```

This happens when a function is evolved from `returns void` to `returns jsonb` across migrations.

**How SmartBus Solves It:**
Each migration that changes function signatures explicitly drops the old version first:

```sql
drop function if exists cancel_booking(uuid);

create or replace function cancel_booking(p_booking_id uuid)
returns jsonb  -- now returns rich refund data instead of void
...
```

---

### 6. Authorization Bypass (Direct Table Manipulation)

**What is it?**
Without proper protection, a malicious user could directly call the Supabase REST API to insert a booking for someone else, or to insert a ticket without paying.

**How SmartBus Solves It:**
- Row Level Security (RLS) is enabled on every single table.
- Critical tables like `trip_seat_locks` have no direct insert policy — inserts only happen through the `SECURITY DEFINER` RPC functions which run with elevated database privileges and enforce all business rules.
- Helper functions `is_admin()` and `is_driver()` are used inside RLS policies for role checks.

---

### 7. Non-Configurable Refund Policy (Hard-Coded Rules)

**What is it?**
Many systems hard-code refund rules (e.g., "always 50% refund") into application code. This is a maintenance nightmare — every policy change requires a code deployment.

**How SmartBus Solves It:**
A dedicated `cancellation_policies` table stores the rules. The `cancel_booking()` function queries this table at runtime:

```sql
select refund_percentage into v_refund_percent
from cancellation_policies
where hours_before_departure <= v_hours_until
order by hours_before_departure desc
limit 1;
```

Default policies seeded in the database:

| Hours Before Departure | Refund % |
|---|---|
| 24+ hours | 90% |
| 6–24 hours | 50% |
| 0–6 hours | 0% |

These can be updated from the Admin Dashboard without any code change.

---

## 🗄 Database Functions (RPCs)

| Function | Description |
|---|---|
| `reserve_seats(trip_id, user_id, seat_ids, boarding_stop, dropping_stop)` | Atomically locks seats and creates a pending booking |
| `confirm_booking_payment(booking_id, transaction_id)` | Validates hold, confirms booking, issues QR ticket |
| `cancel_booking(booking_id)` | Cancels booking, calculates refund, releases seat locks |
| `available_seats_for_trip(trip_id)` | Returns all seats not currently locked for a trip |
| `set_booking_amount(booking_id, amount)` | Server-side update of booking total (prevents client tampering) |
| `reorder_route_stops(route_id, stop_ids)` | Atomically reorders stop sequences for a route |
| `is_admin()` | Returns true if the current JWT user is an admin |
| `is_driver()` | Returns true if the current JWT user is a driver |

---

## 🔐 Security Model

SmartBus implements a defence-in-depth security architecture:

```
Request → Supabase Auth (JWT Verification)
             |
             v
         PostgREST API (Passes auth.uid() to DB)
             |
             v
         Row Level Security (Per-table, per-operation policies)
             |
             v
         SECURITY DEFINER Functions (For privileged booking logic)
             |
             v
         Business Logic + Data Integrity Constraints
```

### RLS Policy Summary

| Table | Passenger | Driver | Admin |
|---|---|---|---|
| `profiles` | Own row only | Own row only | All rows |
| `buses` | Read only | Read only | Full access |
| `routes`, `stops` | Read only | Read only | Full access |
| `bookings` | Own bookings | Their trip's bookings | All bookings |
| `trip_seat_locks` | Read only | Read only | Read only |
| `tickets` | Own tickets | — | All tickets |
| `payments` | Own payments | — | All payments |
| `trip_locations` | Read only | Insert (own trip only) | Full access |
| `notifications` | Own only | Own only | Full access |

---

## 📁 Migration Strategy

Database changes are managed through sequential numbered SQL migration files:

| File | Purpose |
|---|---|
| `0001_init.sql` | Base schema — all tables, enums, indexes, RLS policies, initial RPCs |
| `0002_booking_confirmation.sql` | Booking confirmation flow, cancellation policies, cancel function |
| `0003_concurrency_and_stoppages.sql` | Advisory locks, hardened payment validation, smart refunds, stop reordering |

**Important Rule:** If a function's return type or argument list changes in a migration, it must be explicitly dropped first:

```sql
drop function if exists function_name(arg_type);
create or replace function function_name(...) returns new_type
...
```

---

## 🚀 Running the Project

### Prerequisites
- Node.js 18+
- A Supabase project (create one at supabase.com)

### Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd smartbus

# 2. Install dependencies
npm install

# 3. Set environment variables
cp .env.example .env.local
# Fill in your Supabase URL and anon key

# 4. Push the database migrations
npx supabase link --project-ref <your-project-ref>
npx supabase db push

# 5. Start the development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 📊 Summary

SmartBus demonstrates how a real-world, safety-critical booking system must handle concurrency, authorization, and state consistency at the **database level** — not just in the application layer. The key insight is that application code can always be bypassed, but database constraints, RLS policies, and ACID-compliant stored procedures cannot.

The project specifically addresses the classical concurrency problems taught in Database Management Systems courses (dirty reads, phantom reads, lost updates) and shows a practical PostgreSQL implementation using advisory locks and atomic stored procedures.

---

*Built with Next.js 14, TypeScript, and Supabase*
