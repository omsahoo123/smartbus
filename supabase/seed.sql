-- Demo/seed data. Run AFTER 0001_init.sql.
-- Note: profiles for admin/driver demo users must be created via Supabase Auth
-- first (sign up normally, then update their role below), because profiles.id
-- references auth.users.id. Buses/routes/stops/schedules can be seeded freely.

insert into buses (bus_number, registration_number, bus_type, capacity, status) values
  ('SB-101', 'OD02AB1234', 'ac_seater', 40, 'active'),
  ('SB-102', 'OD02AB1235', 'non_ac_seater', 45, 'active'),
  ('SB-103', 'OD02AB1236', 'ac_sleeper', 30, 'active');

insert into stops (name, latitude, longitude, address) values
  ('Bhubaneswar Bus Stand', 20.2700, 85.8400, 'Baramunda, Bhubaneswar'),
  ('Khordha Stop', 20.1800, 85.6150, 'Khordha Town'),
  ('Cuttack Bus Stand', 20.4625, 85.8828, 'Badambadi, Cuttack'),
  ('Puri Bus Stand', 19.8135, 85.8312, 'Grand Road, Puri'),
  ('Balasore Stand', 21.4942, 86.9317, 'Balasore Town');

insert into routes (route_name, source, destination, distance, estimated_duration, status)
values
  ('Bhubaneswar - Puri Express', 'Bhubaneswar', 'Puri', 60, '01:30:00', 'active'),
  ('Bhubaneswar - Cuttack Shuttle', 'Bhubaneswar', 'Cuttack', 30, '00:45:00', 'active');

-- Link stops to the Bhubaneswar-Puri route in order
insert into route_stops (route_id, stop_id, sequence, arrival_time, departure_time)
select r.id, s.id, v.sequence, v.arrival_time::time, v.departure_time::time
from routes r
join (values
  (1, 'Bhubaneswar Bus Stand', '08:00', '08:00'),
  (2, 'Khordha Stop', '08:30', '08:35'),
  (3, 'Puri Bus Stand', '09:30', '09:30')
) as v(sequence, stop_name, arrival_time, departure_time) on true
join stops s on s.name = v.stop_name
where r.route_name = 'Bhubaneswar - Puri Express';

-- A schedule + a handful of trips for the next 3 days
insert into schedules (route_id, bus_id, departure_time, arrival_time, days_of_week, status)
select r.id, b.id, '08:00', '09:30', '{0,1,2,3,4,5,6}', 'active'
from routes r, buses b
where r.route_name = 'Bhubaneswar - Puri Express' and b.bus_number = 'SB-101';

insert into trips (bus_id, route_id, schedule_id, trip_date, status)
select b.id, r.id, sch.id, d::date, 'scheduled'
from schedules sch
join routes r on r.id = sch.route_id
join buses b on b.id = sch.bus_id
cross join generate_series(current_date, current_date + interval '2 day', interval '1 day') as d
where r.route_name = 'Bhubaneswar - Puri Express';

-- Seat map for each bus: 2+2 layout, 10 rows = 40 seats for SB-101
do $$
declare
  v_bus_id uuid;
  r int; c int; seat text;
begin
  select id into v_bus_id from buses where bus_number = 'SB-101';
  for r in 1..10 loop
    for c in 1..4 loop
      seat := r::text || chr(64 + c); -- e.g. 1A, 1B, 1C, 1D
      insert into seats (bus_id, seat_number, row_number, column_number, seat_type)
      values (v_bus_id, seat, r, c, case when c in (2,3) then 'aisle' else 'window' end);
    end loop;
  end loop;
end $$;

-- To create demo admin/driver accounts:
-- 1. Sign up normally through /signup for each demo user.
-- 2. Then run, e.g.:
--    update profiles set role = 'admin' where email = 'admin@smartbus.demo';
--    update profiles set role = 'driver' where email = 'driver@smartbus.demo';
--    insert into drivers (profile_id, license_number, assigned_bus_id)
--      select id, 'DL-0001', (select id from buses where bus_number = 'SB-101')
--      from profiles where email = 'driver@smartbus.demo';
