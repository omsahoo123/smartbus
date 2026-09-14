-- ============================================================
-- SmartBus COMPLETE TESTING SEED
-- ============================================================
-- HOW TO USE:
--
-- STEP 1 ── Run SECTION A first (non-user data — no auth needed):
--   Copy everything under SECTION A and run in Supabase SQL Editor.
--
-- STEP 2 ── Create 3 demo users via /signup on your app:
--   Passenger : phone=9876543210, email=passenger@smartbus.demo, pass=demo1234
--   Driver    : phone=9876543211, email=driver@smartbus.demo,    pass=demo1234
--   Admin     : phone=9999000001, email=admin@smartbus.demo,     pass=demo1234
--
-- STEP 3 ── Run SECTION B to promote roles and seed user-linked data.
--
-- ============================================================
-- SECTION A  (Run first — no user accounts needed)
-- ============================================================

-- Buses
insert into buses (bus_number, registration_number, bus_type, capacity, status) values
  ('SB-101', 'OD02AB1234', 'ac_seater',     40, 'active'),
  ('SB-102', 'OD02AB1235', 'non_ac_seater', 45, 'active'),
  ('SB-103', 'OD02AB1236', 'ac_sleeper',    30, 'active')
on conflict (bus_number) do nothing;

-- Stops
insert into stops (name, latitude, longitude, address) values
  ('Bhubaneswar Bus Stand', 20.2700, 85.8400, 'Baramunda, Bhubaneswar'),
  ('Khordha Stop',          20.1800, 85.6150, 'Khordha Town'),
  ('Cuttack Bus Stand',     20.4625, 85.8828, 'Badambadi, Cuttack'),
  ('Puri Bus Stand',        19.8135, 85.8312, 'Grand Road, Puri'),
  ('Balasore Stand',        21.4942, 86.9317, 'Balasore Town')
on conflict do nothing;

-- Routes
insert into routes (route_name, source, destination, distance, estimated_duration, status) values
  ('Bhubaneswar - Puri Express',    'Bhubaneswar', 'Puri',    60, '01:30:00', 'active'),
  ('Bhubaneswar - Cuttack Shuttle', 'Bhubaneswar', 'Cuttack', 30, '00:45:00', 'active')
on conflict do nothing;

-- Route stops: Bhubaneswar to Puri
insert into route_stops (route_id, stop_id, sequence, arrival_time, departure_time)
select r.id, s.id, v.seq, v.arr::time, v.dep::time
from routes r
cross join (values
  (1, 'Bhubaneswar Bus Stand', '08:00', '08:00'),
  (2, 'Khordha Stop',          '08:30', '08:35'),
  (3, 'Puri Bus Stand',        '09:30', '09:30')
) as v(seq, stop_name, arr, dep)
join stops s on s.name = v.stop_name
where r.route_name = 'Bhubaneswar - Puri Express'
on conflict do nothing;

-- Route stops: Bhubaneswar to Cuttack
insert into route_stops (route_id, stop_id, sequence, arrival_time, departure_time)
select r.id, s.id, v.seq, v.arr::time, v.dep::time
from routes r
cross join (values
  (1, 'Bhubaneswar Bus Stand', '10:00', '10:00'),
  (2, 'Cuttack Bus Stand',     '10:45', '10:45')
) as v(seq, stop_name, arr, dep)
join stops s on s.name = v.stop_name
where r.route_name = 'Bhubaneswar - Cuttack Shuttle'
on conflict do nothing;

-- Schedules
insert into schedules (route_id, bus_id, departure_time, arrival_time, days_of_week, status)
select r.id, b.id, '08:00', '09:30', '{0,1,2,3,4,5,6}', 'active'
from routes r, buses b
where r.route_name = 'Bhubaneswar - Puri Express' and b.bus_number = 'SB-101';

insert into schedules (route_id, bus_id, departure_time, arrival_time, days_of_week, status)
select r.id, b.id, '10:00', '10:45', '{0,1,2,3,4,5,6}', 'active'
from routes r, buses b
where r.route_name = 'Bhubaneswar - Cuttack Shuttle' and b.bus_number = 'SB-102';

-- Trips for next 5 days
insert into trips (bus_id, route_id, schedule_id, trip_date, status)
select b.id, r.id, sch.id, d::date, 'scheduled'
from schedules sch
join routes r  on r.id  = sch.route_id
join buses  b  on b.id  = sch.bus_id
cross join generate_series(current_date, current_date + interval '4 day', interval '1 day') as d
on conflict (schedule_id, trip_date) do nothing;

-- Mark today's SB-101 trip as RUNNING (enables live tracking)
update trips set status = 'running', start_time = now()
where trip_date = current_date
  and bus_id = (select id from buses where bus_number = 'SB-101')
limit 1;

-- Seat map for SB-101: 2+2 layout, 10 rows = 40 seats
do $$
declare
  v_bus_id uuid;
  r int; c int; seat text;
begin
  select id into v_bus_id from buses where bus_number = 'SB-101';
  if (select count(*) from seats where bus_id = v_bus_id) > 0 then return; end if;
  for r in 1..10 loop
    for c in 1..4 loop
      seat := r::text || chr(64 + c);
      insert into seats (bus_id, seat_number, row_number, column_number, seat_type)
      values (v_bus_id, seat, r, c, case when c in (2,3) then 'aisle' else 'window' end);
    end loop;
  end loop;
end $$;

-- Seat map for SB-102: 3+2 layout, 9 rows = 45 seats
do $$
declare
  v_bus_id uuid;
  r int; c int; seat text;
begin
  select id into v_bus_id from buses where bus_number = 'SB-102';
  if (select count(*) from seats where bus_id = v_bus_id) > 0 then return; end if;
  for r in 1..9 loop
    for c in 1..5 loop
      seat := r::text || chr(64 + c);
      insert into seats (bus_id, seat_number, row_number, column_number, seat_type)
      values (v_bus_id, seat, r, c, case when c in (2,3,4) then 'aisle' else 'window' end);
    end loop;
  end loop;
end $$;

-- GPS pings for the running trip (simulates bus moving toward Puri)
insert into trip_locations (trip_id, bus_id, latitude, longitude, speed, recorded_at)
select t.id, t.bus_id,
  20.2700 + (gs.n * 0.006),
  85.8400 - (gs.n * 0.004),
  38 + gs.n,
  now() - ((5 - gs.n) * interval '3 minutes')
from trips t
cross join (values (0),(1),(2),(3),(4)) as gs(n)
where t.status = 'running'
  and t.bus_id = (select id from buses where bus_number = 'SB-101')
limit 5;


-- ============================================================
-- SECTION B  (Run AFTER signing up the 3 demo users via /signup)
-- ============================================================

-- Promote admin
update profiles set role = 'admin'  where email = 'admin@smartbus.demo';

-- Promote driver
update profiles set role = 'driver' where email = 'driver@smartbus.demo';

-- Create driver record and assign to SB-101
insert into drivers (profile_id, license_number, assigned_bus_id, status)
select p.id, 'DL-OD-2024-001', b.id, 'active'
from profiles p, buses b
where p.email = 'driver@smartbus.demo' and b.bus_number = 'SB-101'
on conflict (profile_id) do nothing;

-- Assign driver to the running trip
update trips set driver_id = (
  select d.id from drivers d join profiles p on p.id = d.profile_id
  where p.email = 'driver@smartbus.demo'
)
where status = 'running'
  and bus_id = (select id from buses where bus_number = 'SB-101');

-- Welcome notification for passenger
insert into notifications (user_id, title, message, type)
select id, 'Welcome to SmartBus!', 'Your account is ready. Search buses, book seats, and track live!', 'system'
from profiles where email = 'passenger@smartbus.demo';

-- Weekly pass for passenger
insert into passes (user_id, pass_type, valid_from, valid_until, amount, status)
select id, 'weekly', current_date, current_date + 7, 250, 'active'
from profiles where email = 'passenger@smartbus.demo';

-- Sample confirmed booking + ticket for passenger on the running trip
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
  select id into v_user_id  from profiles where email = 'passenger@smartbus.demo';
  select id into v_trip_id  from trips where status = 'running'
    and bus_id = (select id from buses where bus_number = 'SB-101') limit 1;
  select id into v_seat_id  from seats
    where bus_id = (select id from buses where bus_number = 'SB-101') and seat_number = '3A';
  select id into v_stop1_id from stops where name = 'Bhubaneswar Bus Stand';
  select id into v_stop2_id from stops where name = 'Puri Bus Stand';

  if v_user_id is null or v_trip_id is null then
    raise notice 'Passenger user not found — skipping booking seed.';
    return;
  end if;

  v_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));

  insert into bookings (booking_code, user_id, trip_id, boarding_stop_id, dropping_stop_id,
                        total_amount, payment_status, booking_status)
  values (v_code, v_user_id, v_trip_id, v_stop1_id, v_stop2_id, 180, 'paid', 'confirmed')
  returning id into v_booking_id;

  insert into trip_seat_locks (trip_id, seat_id, booking_id)
  values (v_trip_id, v_seat_id, v_booking_id) on conflict do nothing;

  insert into tickets (booking_id, issued_at, valid_until, status)
  values (v_booking_id, now(), now() + interval '24 hours', 'valid');

  raise notice 'Booking % created for passenger.', v_code;
end $$;
