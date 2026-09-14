-- ============================================================
-- SmartBus COMPLETE TESTING SEED (Updated for Phone Auth & Full Admin/Driver Features)
-- ============================================================
--
-- HOW TO USE:
--
-- METHOD 1 (Recommended — via UI):
--   1. Run SECTION A first in Supabase SQL Editor.
--   2. Go to http://localhost:3000/signup (or use quick autofill on /login):
--      - Passenger: Phone = 9876543210, Email = passenger@smartbus.demo, Pass = demo1234
--      - Driver:    Phone = 9876543211, Email = driver@smartbus.demo,    Pass = demo1234
--      - Admin:     Phone = 9999000001, Email = admin@smartbus.demo,     Pass = demo1234
--   3. Run SECTION B in Supabase SQL Editor to promote roles, link driver,
--      assign today's running trip, and seed confirmed ticket + live tracking.
--
-- METHOD 2 (Direct SQL Provisioning):
--   Run SECTION A, then run SECTION B. If the auth users do not exist yet,
--   SECTION B will attempt to create them directly in auth.users with pass 'demo1234'.
--
-- ============================================================
-- SECTION A: FLEET, STOPS, ROUTES, SCHEDULES, TRIPS & SEATS
-- (Run first — completely independent of user accounts)
-- ============================================================

-- 1. Buses (Diverse fleet: AC Seater, Non-AC, Sleeper, Electric)
insert into buses (bus_number, registration_number, bus_type, capacity, status) values
  ('SB-101', 'OD02AB1001', 'ac_seater',     40, 'active'),
  ('SB-102', 'OD02AB1002', 'non_ac_seater', 45, 'active'),
  ('SB-103', 'OD02AB1003', 'ac_sleeper',    30, 'active'),
  ('SB-104', 'OD02AB1004', 'electric',      36, 'active'),
  ('SB-105', 'OD02AB1005', 'volvo_multi',   48, 'maintenance')
on conflict (bus_number) do update set
  registration_number = excluded.registration_number,
  bus_type = excluded.bus_type,
  capacity = excluded.capacity,
  status = excluded.status;

-- 2. Bus Stops across Odisha
insert into stops (name, latitude, longitude, address) values
  ('Bhubaneswar Bus Stand', 20.2700, 85.8400, 'Baramunda ISBT, Bhubaneswar'),
  ('Khordha Junction Stop', 20.1800, 85.6150, 'NH-16 Bypass, Khordha'),
  ('Cuttack Badambadi Stand', 20.4625, 85.8828, 'Badambadi Bus Terminal, Cuttack'),
  ('Puri Jagannath Stand',   19.8135, 85.8312, 'Grand Road Bus Terminal, Puri'),
  ('Balasore Central Stand', 21.4942, 86.9317, 'Station Road, Balasore'),
  ('Berhampur New Bus Stand', 19.3149, 84.7941, 'Main Highway Junction, Berhampur')
on conflict do nothing;

-- 3. Routes
insert into routes (route_name, source, destination, distance, estimated_duration, status) values
  ('Bhubaneswar - Puri Express',        'Bhubaneswar', 'Puri',      60,  '01:30:00', 'active'),
  ('Bhubaneswar - Cuttack Shuttle',     'Bhubaneswar', 'Cuttack',   30,  '00:45:00', 'active'),
  ('Bhubaneswar - Berhampur Intercity', 'Bhubaneswar', 'Berhampur', 175, '03:30:00', 'active')
on conflict do nothing;

-- 4. Route Stops: Route 1 (Bhubaneswar -> Khordha -> Puri)
insert into route_stops (route_id, stop_id, sequence, arrival_time, departure_time)
select r.id, s.id, v.seq, v.arr::time, v.dep::time
from routes r
cross join (values
  (1, 'Bhubaneswar Bus Stand', '08:00', '08:00'),
  (2, 'Khordha Junction Stop', '08:30', '08:35'),
  (3, 'Puri Jagannath Stand',   '09:30', '09:30')
) as v(seq, stop_name, arr, dep)
join stops s on s.name = v.stop_name
where r.route_name = 'Bhubaneswar - Puri Express'
on conflict (route_id, sequence) do update set
  stop_id = excluded.stop_id,
  arrival_time = excluded.arrival_time,
  departure_time = excluded.departure_time;

-- Route Stops: Route 2 (Bhubaneswar -> Cuttack)
insert into route_stops (route_id, stop_id, sequence, arrival_time, departure_time)
select r.id, s.id, v.seq, v.arr::time, v.dep::time
from routes r
cross join (values
  (1, 'Bhubaneswar Bus Stand',    '10:00', '10:00'),
  (2, 'Cuttack Badambadi Stand', '10:45', '10:45')
) as v(seq, stop_name, arr, dep)
join stops s on s.name = v.stop_name
where r.route_name = 'Bhubaneswar - Cuttack Shuttle'
on conflict (route_id, sequence) do update set
  stop_id = excluded.stop_id,
  arrival_time = excluded.arrival_time,
  departure_time = excluded.departure_time;

-- 5. Schedules (Daily services for buses)
-- Delete older duplicate test schedules for clean recreation
delete from schedules where bus_id in (select id from buses where bus_number in ('SB-101', 'SB-102', 'SB-104'));

insert into schedules (route_id, bus_id, departure_time, arrival_time, days_of_week, status)
select r.id, b.id, '08:00', '09:30', '{0,1,2,3,4,5,6}', 'active'
from routes r, buses b
where r.route_name = 'Bhubaneswar - Puri Express' and b.bus_number = 'SB-101';

insert into schedules (route_id, bus_id, departure_time, arrival_time, days_of_week, status)
select r.id, b.id, '10:00', '10:45', '{0,1,2,3,4,5,6}', 'active'
from routes r, buses b
where r.route_name = 'Bhubaneswar - Cuttack Shuttle' and b.bus_number = 'SB-102';

insert into schedules (route_id, bus_id, departure_time, arrival_time, days_of_week, status)
select r.id, b.id, '14:00', '15:30', '{0,1,2,3,4,5,6}', 'active'
from routes r, buses b
where r.route_name = 'Bhubaneswar - Puri Express' and b.bus_number = 'SB-104';

-- 6. Generate Trips for today + next 4 days
insert into trips (bus_id, route_id, schedule_id, trip_date, status)
select b.id, r.id, sch.id, d::date, 'scheduled'
from schedules sch
join routes r  on r.id  = sch.route_id
join buses  b  on b.id  = sch.bus_id
cross join generate_series(current_date, current_date + interval '4 day', interval '1 day') as d
on conflict (schedule_id, trip_date) do nothing;

-- 7. Mark Today's SB-101 trip as RUNNING (Enables live tracking & driver HUD)
update trips set
  status = 'running',
  start_time = now() - interval '20 minutes'
where trip_date = current_date
  and bus_id = (select id from buses where bus_number = 'SB-101');

-- 8. Physical Seat Layouts for Buses
-- Seat map for SB-101: 2+2 layout, 10 rows = 40 seats
do $$
declare
  v_bus_id uuid;
  r int; c int; seat text;
begin
  select id into v_bus_id from buses where bus_number = 'SB-101';
  if v_bus_id is not null and (select count(*) from seats where bus_id = v_bus_id) = 0 then
    for r in 1..10 loop
      for c in 1..4 loop
        seat := r::text || chr(64 + c);
        insert into seats (bus_id, seat_number, row_number, column_number, seat_type)
        values (v_bus_id, seat, r, c, case when c in (2,3) then 'aisle' else 'window' end);
      end loop;
    end loop;
  end if;
end $$;

-- Seat map for SB-102: 3+2 layout, 9 rows = 45 seats
do $$
declare
  v_bus_id uuid;
  r int; c int; seat text;
begin
  select id into v_bus_id from buses where bus_number = 'SB-102';
  if v_bus_id is not null and (select count(*) from seats where bus_id = v_bus_id) = 0 then
    for r in 1..9 loop
      for c in 1..5 loop
        seat := r::text || chr(64 + c);
        insert into seats (bus_id, seat_number, row_number, column_number, seat_type)
        values (v_bus_id, seat, r, c, case when c in (2,3,4) then 'aisle' else 'window' end);
      end loop;
    end loop;
  end if;
end $$;

-- Seat map for SB-104: 2+2 layout, 9 rows = 36 seats
do $$
declare
  v_bus_id uuid;
  r int; c int; seat text;
begin
  select id into v_bus_id from buses where bus_number = 'SB-104';
  if v_bus_id is not null and (select count(*) from seats where bus_id = v_bus_id) = 0 then
    for r in 1..9 loop
      for c in 1..4 loop
        seat := r::text || chr(64 + c);
        insert into seats (bus_id, seat_number, row_number, column_number, seat_type)
        values (v_bus_id, seat, r, c, case when c in (2,3) then 'aisle' else 'window' end);
      end loop;
    end loop;
  end if;
end $$;

-- 9. GPS Coordinates along Route 1 (Simulates active bus SB-101 moving towards Puri)
delete from trip_locations where bus_id = (select id from buses where bus_number = 'SB-101');

insert into trip_locations (trip_id, bus_id, latitude, longitude, speed, recorded_at)
select t.id, t.bus_id, v.lat, v.lng, v.spd, now() - (v.mins_ago || ' minutes')::interval
from trips t
cross join (values
  (20.2700, 85.8400, 32, 18), -- Baramunda
  (20.2450, 85.8200, 48, 14), -- Lingaraj station bypass
  (20.2100, 85.7800, 55, 10), -- Near Uttara Junction
  (20.1800, 85.7500, 52, 6),  -- Pipili Tollgate
  (20.1400, 85.7300, 58, 2),  -- En route to Puri
  (20.1200, 85.7200, 50, 0)   -- Latest live location
) as v(lat, lng, spd, mins_ago)
where t.status = 'running'
  and t.bus_id = (select id from buses where bus_number = 'SB-101')
limit 6;

-- 10. Sample Fleet Maintenance Ticket (Shows in Admin Maintenance view)
insert into maintenance (bus_id, issue, status, notes)
select id, 'Brake pad inspection and AC coolant top-up required', 'in_progress', 'Scheduled with central garage.'
from buses where bus_number = 'SB-105'
limit 1
on conflict do nothing;


-- ============================================================
-- SECTION B: USERS, ROLES, DRIVER ASSIGNMENT & PASSENGER DATA
-- (Run this AFTER signing up the demo accounts via /signup or login autofill)
-- ============================================================

-- A. Auto-provision auth accounts if not already created
do $$
begin
  -- Try to create passenger if missing
  if not exists (select 1 from auth.users where email = 'passenger@smartbus.demo') then
    begin
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
      ) values (
        '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
        'passenger@smartbus.demo', crypt('demo1234', gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}', '{"full_name":"Priya Sharma"}', now(), now()
      );
    exception when others then
      raise notice 'Could not auto-insert auth user passenger: % (Please sign up via /signup)', sqlerrm;
    end;
  end if;

  -- Try to create driver if missing
  if not exists (select 1 from auth.users where email = 'driver@smartbus.demo') then
    begin
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
      ) values (
        '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
        'driver@smartbus.demo', crypt('demo1234', gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}', '{"full_name":"Rajesh Kumar (Driver)"}', now(), now()
      );
    exception when others then
      raise notice 'Could not auto-insert auth user driver: % (Please sign up via /signup)', sqlerrm;
    end;
  end if;

  -- Try to create admin if missing
  if not exists (select 1 from auth.users where email = 'admin@smartbus.demo') then
    begin
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
      ) values (
        '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
        'admin@smartbus.demo', crypt('demo1234', gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}', '{"full_name":"Operations Admin"}', now(), now()
      );
    exception when others then
      raise notice 'Could not auto-insert auth user admin: % (Please sign up via /signup)', sqlerrm;
    end;
  end if;
end $$;

-- B. Sync profiles table with proper Phone Numbers, Roles and Names
-- 1. Passenger Profile
insert into profiles (id, full_name, phone, email, role)
select id, 'Priya Sharma', '9876543210', 'passenger@smartbus.demo', 'people'::user_role
from auth.users where email = 'passenger@smartbus.demo'
on conflict (id) do update set
  full_name = 'Priya Sharma',
  phone = '9876543210',
  email = 'passenger@smartbus.demo',
  role = 'people'::user_role;

-- 2. Driver Profile
insert into profiles (id, full_name, phone, email, role)
select id, 'Rajesh Kumar (Driver)', '9876543211', 'driver@smartbus.demo', 'driver'::user_role
from auth.users where email = 'driver@smartbus.demo'
on conflict (id) do update set
  full_name = 'Rajesh Kumar (Driver)',
  phone = '9876543211',
  email = 'driver@smartbus.demo',
  role = 'driver'::user_role;

-- 3. Admin Profile
insert into profiles (id, full_name, phone, email, role)
select id, 'Operations Admin', '9999000001', 'admin@smartbus.demo', 'admin'::user_role
from auth.users where email = 'admin@smartbus.demo'
on conflict (id) do update set
  full_name = 'Operations Admin',
  phone = '9999000001',
  email = 'admin@smartbus.demo',
  role = 'admin'::user_role;

-- C. Fleet Driver Assignment
-- Register Rajesh Kumar in drivers table and assign to SB-101
insert into drivers (profile_id, license_number, assigned_bus_id, status)
select p.id, 'OD-02-2024-DRV101', b.id, 'active'
from profiles p, buses b
where p.email = 'driver@smartbus.demo' and b.bus_number = 'SB-101'
on conflict (profile_id) do update set
  license_number = 'OD-02-2024-DRV101',
  assigned_bus_id = (select id from buses where bus_number = 'SB-101'),
  status = 'active';

-- Assign Rajesh Kumar to Today's RUNNING Trip on SB-101
update trips set driver_id = (
  select d.id from drivers d
  join profiles p on p.id = d.profile_id
  where p.email = 'driver@smartbus.demo'
)
where status = 'running'
  and bus_id = (select id from buses where bus_number = 'SB-101');

-- D. Passenger Active Bus Pass
insert into passes (user_id, pass_type, valid_from, valid_until, amount, status)
select id, 'weekly'::pass_type, current_date - 1, current_date + 6, 299, 'active'::pass_status
from profiles where email = 'passenger@smartbus.demo'
on conflict do nothing;

-- E. Confirmed Booking, Passenger Record, Seat Lock, Payment & Ticket for Live Trip
do $$
declare
  v_user_id    uuid;
  v_trip_id    uuid;
  v_seat_id    uuid;
  v_stop1_id   uuid;
  v_stop2_id   uuid;
  v_booking_id uuid;
  v_code       text;
begin
  select id into v_user_id from profiles where email = 'passenger@smartbus.demo';
  select id into v_trip_id from trips where status = 'running'
    and bus_id = (select id from buses where bus_number = 'SB-101') limit 1;
  select id into v_seat_id from seats
    where bus_id = (select id from buses where bus_number = 'SB-101') and seat_number = '3A';
  select id into v_stop1_id from stops where name = 'Bhubaneswar Bus Stand';
  select id into v_stop2_id from stops where name = 'Puri Jagannath Stand';

  if v_user_id is null or v_trip_id is null or v_seat_id is null then
    raise notice 'Required entities not found — skipping booking seed.';
    return;
  end if;

  -- Clean any prior seed booking for this user on this trip
  delete from bookings where user_id = v_user_id and trip_id = v_trip_id;

  v_code := 'SB-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));

  -- 1. Booking Record
  insert into bookings (
    booking_code, user_id, trip_id, boarding_stop_id, dropping_stop_id,
    total_amount, payment_status, booking_status, created_at
  )
  values (
    v_code, v_user_id, v_trip_id, v_stop1_id, v_stop2_id,
    180.00, 'paid'::payment_status, 'confirmed'::booking_status, now() - interval '1 hour'
  )
  returning id into v_booking_id;

  -- 2. Passenger Manifest Record
  insert into booking_passengers (booking_id, seat_id, name, age, gender, phone)
  values (v_booking_id, v_seat_id, 'Priya Sharma', 28, 'Female', '9876543210');

  -- 3. Seat Lock
  insert into trip_seat_locks (trip_id, seat_id, booking_id, locked_at)
  values (v_trip_id, v_seat_id, v_booking_id, now() - interval '1 hour')
  on conflict (trip_id, seat_id) do update set booking_id = v_booking_id;

  -- 4. Payment Record
  insert into payments (booking_id, gateway, transaction_id, amount, status, paid_at)
  values (v_booking_id, 'razorpay', 'pay_live_test_' || v_code, 180.00, 'paid'::payment_status, now() - interval '1 hour')
  on conflict (booking_id) do nothing;

  -- 5. Digital QR Ticket
  insert into tickets (booking_id, qr_token, issued_at, valid_until, status)
  values (v_booking_id, encode(gen_random_bytes(24), 'hex'), now() - interval '1 hour', now() + interval '24 hours', 'valid'::ticket_status)
  on conflict (booking_id) do nothing;

  raise notice 'Booking % created for passenger (Seat 3A, confirmed).', v_code;
end $$;

-- F. Notifications
insert into notifications (user_id, title, message, type)
select id, 'Welcome to SmartBus', 'Your mobile account is active. Use 9876543210 for instant login!', 'system'::notification_type
from profiles where email = 'passenger@smartbus.demo'
on conflict do nothing;

insert into notifications (user_id, title, message, type)
select id, 'Ticket Confirmed for Puri Express', 'Seat 3A booked on bus SB-101. Live tracking is now running!', 'booking_confirmed'::notification_type
from profiles where email = 'passenger@smartbus.demo'
on conflict do nothing;

insert into notifications (user_id, title, message, type)
select id, 'Duty Assigned: SB-101', 'You are assigned to Bhubaneswar - Puri Express today. Bus status: Running.', 'system'::notification_type
from profiles where email = 'driver@smartbus.demo'
on conflict do nothing;

-- ============================================================
-- VERIFICATION QUERIES (Run to verify everything looks great)
-- ============================================================
-- select bus_number, status, capacity from buses;
-- select name, latitude, longitude from stops;
-- select route_name, source, destination, distance from routes;
-- select t.id, t.trip_date, t.status, b.bus_number, r.route_name, d.license_number
--   from trips t
--   join buses b on b.id = t.bus_id
--   join routes r on r.id = t.route_id
--   left join drivers d on d.id = t.driver_id
--   where t.trip_date = current_date;
-- select email, phone, role, full_name from profiles;
