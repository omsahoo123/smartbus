-- SmartBus initial schema
-- Run via: supabase db push  (or paste into the Supabase SQL editor)

create extension if not exists "pgcrypto";
create extension if not exists postgis;

-- ========== ENUMS ==========
create type user_role as enum ('people', 'driver', 'admin');
create type bus_status as enum ('active', 'inactive', 'maintenance');
create type trip_status as enum ('scheduled', 'running', 'completed', 'cancelled');
create type booking_status as enum ('pending', 'confirmed', 'cancelled', 'expired');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type ticket_status as enum ('valid', 'used', 'cancelled');
create type pass_status as enum ('active', 'expired', 'cancelled');
create type pass_type as enum ('daily', 'weekly', 'monthly', 'route_specific');
create type maintenance_status as enum ('open', 'in_progress', 'resolved');
create type notification_type as enum (
  'booking_confirmed', 'payment_success', 'payment_failed', 'trip_reminder',
  'bus_arriving', 'trip_delayed', 'trip_cancelled', 'refund_processed',
  'pass_expiring', 'system'
);

-- ========== PROFILES ==========
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  role user_role not null default 'people',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========== FLEET ==========
create table buses (
  id uuid primary key default gen_random_uuid(),
  bus_number text not null unique,
  registration_number text not null unique,
  bus_type text not null default 'seater', -- seater | sleeper | ac | non_ac etc (free text tag list ok)
  capacity int not null check (capacity > 0),
  status bus_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table drivers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  license_number text not null unique,
  assigned_bus_id uuid references buses(id) on delete set null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (profile_id)
);

-- ========== ROUTES / STOPS ==========
create table routes (
  id uuid primary key default gen_random_uuid(),
  route_name text not null,
  source text not null,
  destination text not null,
  distance numeric, -- km
  estimated_duration interval,
  status text not null default 'active'
);

create table stops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  address text
);

create table route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes(id) on delete cascade,
  stop_id uuid not null references stops(id) on delete cascade,
  sequence int not null,
  arrival_time time,
  departure_time time,
  unique (route_id, sequence)
);

-- ========== SCHEDULES / TRIPS ==========
create table schedules (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes(id) on delete cascade,
  bus_id uuid not null references buses(id) on delete cascade,
  departure_time time not null,
  arrival_time time not null,
  days_of_week int[] not null default '{0,1,2,3,4,5,6}', -- 0=Sun..6=Sat
  status text not null default 'active'
);

create table trips (
  id uuid primary key default gen_random_uuid(),
  bus_id uuid not null references buses(id),
  route_id uuid not null references routes(id),
  driver_id uuid references drivers(id),
  schedule_id uuid references schedules(id),
  trip_date date not null,
  start_time timestamptz,
  end_time timestamptz,
  status trip_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  unique (schedule_id, trip_date)
);
create index trips_date_idx on trips (trip_date);
create index trips_status_idx on trips (status);

-- ========== SEATS ==========
-- Seats are the physical layout of a bus (template). Per-trip availability
-- is derived from bookings for that trip, never stored as a global flag.
create table seats (
  id uuid primary key default gen_random_uuid(),
  bus_id uuid not null references buses(id) on delete cascade,
  seat_number text not null,
  row_number int not null,
  column_number int not null,
  seat_type text not null default 'standard',
  status text not null default 'active', -- active | disabled (e.g. broken seat)
  unique (bus_id, seat_number)
);

-- ========== BOOKINGS ==========
create table bookings (
  id uuid primary key default gen_random_uuid(),
  booking_code text not null unique,
  user_id uuid not null references profiles(id),
  trip_id uuid not null references trips(id),
  boarding_stop_id uuid references stops(id),
  dropping_stop_id uuid references stops(id),
  total_amount numeric not null default 0,
  payment_status payment_status not null default 'pending',
  booking_status booking_status not null default 'pending',
  hold_expires_at timestamptz, -- temporary reservation expiry before payment
  created_at timestamptz not null default now()
);
create index bookings_user_idx on bookings (user_id);
create index bookings_trip_idx on bookings (trip_id);

create table booking_passengers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  seat_id uuid not null references seats(id),
  name text not null,
  age int not null,
  gender text not null,
  phone text
);

-- The core anti-double-booking guarantee: one seat can be attached to only
-- one *active* (pending-hold or confirmed) booking per trip. Enforced via a
-- partial unique index on (trip derived from booking) + seat.
create table trip_seat_locks (
  trip_id uuid not null references trips(id) on delete cascade,
  seat_id uuid not null references seats(id) on delete cascade,
  booking_id uuid not null references bookings(id) on delete cascade,
  locked_at timestamptz not null default now(),
  primary key (trip_id, seat_id)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  gateway text not null default 'razorpay',
  transaction_id text,
  amount numeric not null,
  status payment_status not null default 'pending',
  paid_at timestamptz,
  unique (booking_id)
);

create table tickets (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  qr_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  issued_at timestamptz,
  valid_until timestamptz,
  status ticket_status not null default 'valid',
  unique (booking_id)
);

-- ========== LIVE TRACKING ==========
create table trip_locations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  bus_id uuid not null references buses(id),
  latitude double precision not null,
  longitude double precision not null,
  speed numeric,
  recorded_at timestamptz not null default now()
);
create index trip_locations_trip_idx on trip_locations (trip_id, recorded_at desc);

-- ========== PASSES ==========
create table passes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  pass_type pass_type not null,
  route_id uuid references routes(id),
  valid_from date not null,
  valid_until date not null,
  amount numeric not null,
  qr_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  status pass_status not null default 'active'
);

-- ========== NOTIFICATIONS ==========
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type notification_type not null default 'system',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ========== FEEDBACK / MAINTENANCE / LOST & FOUND ==========
create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  trip_id uuid references trips(id),
  driver_rating int check (driver_rating between 1 and 5),
  bus_rating int check (bus_rating between 1 and 5),
  punctuality_rating int check (punctuality_rating between 1 and 5),
  overall_rating int check (overall_rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table maintenance (
  id uuid primary key default gen_random_uuid(),
  bus_id uuid not null references buses(id) on delete cascade,
  reported_by uuid references profiles(id),
  issue text not null,
  status maintenance_status not null default 'open',
  notes text,
  created_at timestamptz not null default now()
);

create table lost_found (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  trip_id uuid references trips(id),
  item_description text not null,
  image_url text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

-- ========== ATOMIC SEAT RESERVATION RPC ==========
-- The client NEVER inserts into bookings/trip_seat_locks directly for the
-- booking flow. It calls this function, which does the availability check
-- and lock creation inside a single transaction.
create or replace function reserve_seats(
  p_trip_id uuid,
  p_user_id uuid,
  p_seat_ids uuid[],
  p_boarding_stop_id uuid,
  p_dropping_stop_id uuid,
  p_hold_minutes int default 10
) returns uuid
language plpgsql
security definer
as $$
declare
  v_booking_id uuid;
  v_booking_code text;
  v_total numeric := 0;
  v_seat_id uuid;
begin
  -- Release any expired holds for this trip first.
  delete from trip_seat_locks tsl
  using bookings b
  where tsl.booking_id = b.id
    and tsl.trip_id = p_trip_id
    and b.booking_status = 'pending'
    and b.hold_expires_at < now();

  update bookings set booking_status = 'expired'
  where booking_status = 'pending' and hold_expires_at < now();

  v_booking_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));

  insert into bookings (booking_code, user_id, trip_id, boarding_stop_id, dropping_stop_id, total_amount, hold_expires_at)
  values (v_booking_code, p_user_id, p_trip_id, p_boarding_stop_id, p_dropping_stop_id, 0, now() + (p_hold_minutes || ' minutes')::interval)
  returning id into v_booking_id;

  foreach v_seat_id in array p_seat_ids loop
    -- This insert fails with a unique_violation if the seat is already
    -- locked for this trip -- that failure is the double-booking guard.
    insert into trip_seat_locks (trip_id, seat_id, booking_id)
    values (p_trip_id, v_seat_id, v_booking_id);
  end loop;

  return v_booking_id;
exception
  when unique_violation then
    raise exception 'One or more selected seats were just booked by someone else. Please choose different seats.';
end;
$$;

-- Seats currently available for a trip = all active seats on the bus minus
-- seats with a non-expired lock.
create or replace function available_seats_for_trip(p_trip_id uuid)
returns setof seats
language sql
stable
as $$
  select s.*
  from seats s
  join trips t on t.bus_id = s.bus_id
  where t.id = p_trip_id
    and s.status = 'active'
    and s.id not in (
      select tsl.seat_id from trip_seat_locks tsl
      join bookings b on b.id = tsl.booking_id
      where tsl.trip_id = p_trip_id
        and b.booking_status in ('pending', 'confirmed')
        and (b.booking_status = 'confirmed' or b.hold_expires_at > now())
    );
$$;

-- ========== updated_at triggers ==========
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger trg_profiles_updated before update on profiles for each row execute function set_updated_at();
create trigger trg_buses_updated before update on buses for each row execute function set_updated_at();

-- ========== ROW LEVEL SECURITY ==========
alter table profiles enable row level security;
alter table buses enable row level security;
alter table drivers enable row level security;
alter table routes enable row level security;
alter table stops enable row level security;
alter table route_stops enable row level security;
alter table schedules enable row level security;
alter table trips enable row level security;
alter table seats enable row level security;
alter table bookings enable row level security;
alter table booking_passengers enable row level security;
alter table trip_seat_locks enable row level security;
alter table payments enable row level security;
alter table tickets enable row level security;
alter table trip_locations enable row level security;
alter table passes enable row level security;
alter table notifications enable row level security;
alter table feedback enable row level security;
alter table maintenance enable row level security;
alter table lost_found enable row level security;

-- Helper: is the current user an admin?
create or replace function is_admin() returns boolean
language sql stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function is_driver() returns boolean
language sql stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'driver');
$$;

-- Public read tables (routes/stops/schedules/buses are catalog data)
create policy "public read buses" on buses for select using (true);
create policy "admin write buses" on buses for insert with check (is_admin());
create policy "admin update buses" on buses for update using (is_admin());
create policy "admin delete buses" on buses for delete using (is_admin());

create policy "public read routes" on routes for select using (true);
create policy "admin write routes" on routes for all using (is_admin()) with check (is_admin());

create policy "public read stops" on stops for select using (true);
create policy "admin write stops" on stops for all using (is_admin()) with check (is_admin());

create policy "public read route_stops" on route_stops for select using (true);
create policy "admin write route_stops" on route_stops for all using (is_admin()) with check (is_admin());

create policy "public read schedules" on schedules for select using (true);
create policy "admin write schedules" on schedules for all using (is_admin()) with check (is_admin());

create policy "public read trips" on trips for select using (true);
create policy "admin write trips" on trips for insert with check (is_admin());
create policy "admin update trips" on trips for update using (is_admin() or (is_driver() and driver_id in (select id from drivers where profile_id = auth.uid())));
create policy "admin delete trips" on trips for delete using (is_admin());

create policy "public read seats" on seats for select using (true);
create policy "admin write seats" on seats for all using (is_admin()) with check (is_admin());

-- Profiles: users manage their own row, admins manage all.
create policy "read own profile" on profiles for select using (auth.uid() = id or is_admin());
create policy "update own profile" on profiles for update using (auth.uid() = id or is_admin());
create policy "insert own profile" on profiles for insert with check (auth.uid() = id);

-- Drivers: driver reads own row; admin manages all.
create policy "driver reads own row" on drivers for select using (profile_id = auth.uid() or is_admin());
create policy "admin writes drivers" on drivers for all using (is_admin()) with check (is_admin());

-- Bookings: passenger owns their bookings; admin sees all; driver sees bookings for their trips.
create policy "own bookings select" on bookings for select using (
  user_id = auth.uid() or is_admin() or
  exists (select 1 from trips t join drivers d on d.id = t.driver_id where t.id = trip_id and d.profile_id = auth.uid())
);
create policy "own bookings insert" on bookings for insert with check (user_id = auth.uid());
create policy "own bookings update" on bookings for update using (user_id = auth.uid() or is_admin());

create policy "own booking passengers" on booking_passengers for select using (
  exists (select 1 from bookings b where b.id = booking_id and (b.user_id = auth.uid() or is_admin()))
);
create policy "own booking passengers write" on booking_passengers for insert with check (
  exists (select 1 from bookings b where b.id = booking_id and b.user_id = auth.uid())
);

create policy "trip seat locks readable" on trip_seat_locks for select using (true);
-- inserts/deletes go through the reserve_seats() SECURITY DEFINER function only.

create policy "own payments" on payments for select using (
  exists (select 1 from bookings b where b.id = booking_id and (b.user_id = auth.uid() or is_admin()))
);
create policy "admin manage payments" on payments for all using (is_admin()) with check (is_admin());

create policy "own tickets" on tickets for select using (
  exists (select 1 from bookings b where b.id = booking_id and (b.user_id = auth.uid() or is_admin()))
);

-- Trip locations: readable by everyone (needed for live tracking), writable
-- only by the driver assigned to that trip.
create policy "trip locations readable" on trip_locations for select using (true);
create policy "driver writes own trip location" on trip_locations for insert with check (
  exists (
    select 1 from trips t join drivers d on d.id = t.driver_id
    where t.id = trip_id and d.profile_id = auth.uid() and t.status = 'running'
  )
);

create policy "own passes" on passes for select using (user_id = auth.uid() or is_admin());
create policy "own passes insert" on passes for insert with check (user_id = auth.uid());
create policy "admin manage passes" on passes for update using (is_admin());

create policy "own notifications" on notifications for select using (user_id = auth.uid());
create policy "own notifications update" on notifications for update using (user_id = auth.uid());
create policy "system inserts notifications" on notifications for insert with check (is_admin());

create policy "own feedback" on feedback for select using (user_id = auth.uid() or is_admin());
create policy "own feedback insert" on feedback for insert with check (user_id = auth.uid());

create policy "maintenance read" on maintenance for select using (is_admin() or is_driver());
create policy "maintenance insert" on maintenance for insert with check (is_admin() or is_driver());
create policy "maintenance update" on maintenance for update using (is_admin());

create policy "lost found own" on lost_found for select using (user_id = auth.uid() or is_admin());
create policy "lost found insert" on lost_found for insert with check (user_id = auth.uid() or is_admin());
