-- ==============================================================================
-- Migration 0003: Concurrency Locking, Anti-Dirty-Read, and Stoppage Management
-- ==============================================================================

-- 1. ENHANCED ATOMIC SEAT RESERVATION (Concurrency, Serialization & Anti-Dirty-Read)
-- Uses pg_advisory_xact_lock to serialize concurrent booking attempts on the same trip.
-- Validates seat ownership, prevents double-booking, cleans up expired holds,
-- and ensures 100% ACID isolation.
create or replace function reserve_seats(
  p_trip_id uuid,
  p_user_id uuid,
  p_seat_ids uuid[],
  p_boarding_stop_id uuid default null,
  p_dropping_stop_id uuid default null,
  p_hold_minutes int default 10
) returns uuid
language plpgsql
security definer
as $$
declare
  v_booking_id uuid;
  v_booking_code text;
  v_seat_id uuid;
  v_bus_id uuid;
  v_seat_bus_id uuid;
  v_seat_num text;
  v_seat_status text;
  v_is_locked boolean;
begin
  -- 1. Acquire transaction-level advisory lock scoped to this specific trip.
  -- This completely prevents race conditions and dirty reads when multiple
  -- passengers simultaneously attempt to reserve seats on the same bus trip.
  perform pg_advisory_xact_lock(hashtext('trip_seat_lock_' || p_trip_id::text));

  -- 2. Verify trip exists and retrieve the bus assigned to it
  select bus_id into v_bus_id
  from trips
  where id = p_trip_id and status in ('scheduled', 'running');

  if not found then
    raise exception 'Trip not found or is no longer open for booking.';
  end if;

  if array_length(p_seat_ids, 1) is null or array_length(p_seat_ids, 1) = 0 then
    raise exception 'No seats selected. Please select at least one seat.';
  end if;

  -- 3. Release any expired holds for this trip before evaluating availability
  delete from trip_seat_locks tsl
  using bookings b
  where tsl.booking_id = b.id
    and tsl.trip_id = p_trip_id
    and (b.booking_status = 'expired' or (b.booking_status = 'pending' and b.hold_expires_at < now()));

  update bookings
  set booking_status = 'expired'
  where trip_id = p_trip_id
    and booking_status = 'pending'
    and hold_expires_at < now();

  -- 4. Validate each requested seat:
  --    a. Seat must belong to the trip's bus
  --    b. Seat must be active (not broken/disabled)
  --    c. Seat must NOT be currently locked by another active or pending hold
  foreach v_seat_id in array p_seat_ids loop
    select bus_id, seat_number, status
    into v_seat_bus_id, v_seat_num, v_seat_status
    from seats
    where id = v_seat_id;

    if not found then
      raise exception 'Invalid seat selected.';
    end if;

    if v_seat_bus_id != v_bus_id then
      raise exception 'Seat % does not belong to the bus assigned to this trip.', v_seat_num;
    end if;

    if v_seat_status != 'active' then
      raise exception 'Seat % is currently out of service or maintenance.', v_seat_num;
    end if;

    select exists (
      select 1 from trip_seat_locks tsl
      join bookings b on b.id = tsl.booking_id
      where tsl.trip_id = p_trip_id
        and tsl.seat_id = v_seat_id
        and b.booking_status in ('pending', 'confirmed')
        and (b.booking_status = 'confirmed' or b.hold_expires_at > now())
    ) into v_is_locked;

    if v_is_locked then
      raise exception 'Seat % was just reserved by another commuter. Please choose a different seat.', v_seat_num;
    end if;
  end loop;

  -- 5. Create the pending booking with an atomic hold expiration time
  v_booking_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));

  insert into bookings (
    booking_code,
    user_id,
    trip_id,
    boarding_stop_id,
    dropping_stop_id,
    total_amount,
    booking_status,
    payment_status,
    hold_expires_at
  )
  values (
    v_booking_code,
    p_user_id,
    p_trip_id,
    p_boarding_stop_id,
    p_dropping_stop_id,
    0,
    'pending',
    'pending',
    now() + (p_hold_minutes || ' minutes')::interval
  )
  returning id into v_booking_id;

  -- 6. Insert locks for each seat
  foreach v_seat_id in array p_seat_ids loop
    insert into trip_seat_locks (trip_id, seat_id, booking_id)
    values (p_trip_id, v_seat_id, v_booking_id);
  end loop;

  return v_booking_id;
exception
  when unique_violation then
    raise exception 'One or more of your selected seats were just reserved by another commuter. Please refresh and select available seats.';
end;
$$;


-- 2. HARDENED PAYMENT CONFIRMATION (Prevents Expired Hold Dirty Commits)
-- Strictly validates hold expiration and checks seat locks inside a row-locked transaction.
create or replace function confirm_booking_payment(p_booking_id uuid, p_transaction_id text)
returns uuid
language plpgsql
security definer
as $$
declare
  v_booking record;
  v_ticket_id uuid;
begin
  -- 1. Row-level lock on the booking record
  select * into v_booking
  from bookings
  where id = p_booking_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Booking not found or unauthorized.';
  end if;

  -- Idempotency check: if already confirmed, return the existing ticket
  if v_booking.booking_status = 'confirmed' then
    select id into v_ticket_id from tickets where booking_id = p_booking_id;
    return v_ticket_id;
  end if;

  -- Prevent confirming cancelled or expired bookings
  if v_booking.booking_status != 'pending' then
    raise exception 'Cannot confirm booking: status is %.', v_booking.booking_status;
  end if;

  -- Check hold expiration time
  if v_booking.hold_expires_at is not null and v_booking.hold_expires_at < now() then
    -- Release seat locks immediately
    delete from trip_seat_locks where booking_id = p_booking_id;
    update bookings set booking_status = 'expired' where id = p_booking_id;
    raise exception 'Your seat reservation has expired (10-minute hold limit exceeded). Please select your seats again.';
  end if;

  -- Verify seat locks are still held
  if not exists (select 1 from trip_seat_locks where booking_id = p_booking_id) then
    update bookings set booking_status = 'expired' where id = p_booking_id;
    raise exception 'Seat locks were expired or released. Please re-select your seats.';
  end if;

  -- 2. Mark booking as confirmed
  update bookings
  set booking_status = 'confirmed', payment_status = 'paid'
  where id = p_booking_id;

  -- 3. Record payment
  insert into payments (booking_id, gateway, transaction_id, amount, status, paid_at)
  values (p_booking_id, 'razorpay', p_transaction_id, v_booking.total_amount, 'paid', now())
  on conflict (booking_id) do update
    set status = 'paid', transaction_id = p_transaction_id, paid_at = now();

  -- 4. Issue ticket
  insert into tickets (booking_id, issued_at, valid_until, status)
  values (p_booking_id, now(), now() + interval '2 days', 'valid')
  on conflict (booking_id) do update set status = 'valid'
  returning id into v_ticket_id;

  -- 5. Send notification
  insert into notifications (user_id, title, message, type)
  values (
    v_booking.user_id,
    'Booking confirmed',
    'Your ticket for booking #' || v_booking.booking_code || ' is confirmed.',
    'booking_confirmed'
  );

  return v_ticket_id;
end;
$$;


-- 3. SECURE CANCELLATION & REFUND WITH POLICY CALCULATION
drop function if exists cancel_booking(uuid);

create or replace function cancel_booking(p_booking_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_booking record;
  v_trip record;
  v_schedule record;
  v_departure_time timestamptz;
  v_hours_until numeric;
  v_refund_percent int := 0;
  v_refund_amount numeric := 0;
begin
  -- 1. Row-level lock on the booking
  select * into v_booking
  from bookings
  where id = p_booking_id and (user_id = auth.uid() or is_admin())
  for update;

  if not found then
    raise exception 'Booking not found or not cancellable.';
  end if;

  if v_booking.booking_status not in ('pending', 'confirmed') then
    raise exception 'Booking is already %.', v_booking.booking_status;
  end if;

  -- 2. Calculate refund percentage from cancellation policies if confirmed
  if v_booking.booking_status = 'confirmed' and v_booking.payment_status = 'paid' then
    select * into v_trip from trips where id = v_booking.trip_id;
    select * into v_schedule from schedules where id = v_trip.schedule_id;

    if v_schedule is not null and v_trip.trip_date is not null then
      v_departure_time := (v_trip.trip_date || ' ' || v_schedule.departure_time)::timestamptz;
      v_hours_until := extract(epoch from (v_departure_time - now())) / 3600.0;
    else
      v_hours_until := 24; -- fallback default
    end if;

    select refund_percentage into v_refund_percent
    from cancellation_policies
    where hours_before_departure <= v_hours_until
    order by hours_before_departure desc
    limit 1;

    if v_refund_percent is null then
      v_refund_percent := 0;
    end if;

    v_refund_amount := round((v_booking.total_amount * v_refund_percent / 100.0), 2);
  end if;

  -- 3. Release seat locks so other passengers can immediately book these seats
  delete from trip_seat_locks where booking_id = p_booking_id;

  -- 4. Update status
  update bookings
  set booking_status = 'cancelled'
  where id = p_booking_id;

  update tickets
  set status = 'cancelled'
  where booking_id = p_booking_id;

  if v_booking.payment_status = 'paid' then
    update payments
    set status = 'refunded'
    where booking_id = p_booking_id;
  end if;

  -- 5. Send notification
  insert into notifications (user_id, title, message, type)
  values (
    v_booking.user_id,
    'Booking Cancelled',
    'Booking #' || v_booking.booking_code || ' was cancelled. Refund amount: ₹' || v_refund_amount,
    'refund_processed'
  );

  return jsonb_build_object(
    'booking_id', p_booking_id,
    'status', 'cancelled',
    'refund_percent', v_refund_percent,
    'refund_amount', v_refund_amount
  );
end;
$$;


-- 4. ROUTE STOPS (STOPPAGES) REORDER RPC
-- Allows admin to atomicaly reorder sequence of stops in a route
create or replace function reorder_route_stops(p_route_id uuid, p_stop_ids uuid[])
returns void
language plpgsql
security definer
as $$
declare
  v_i int;
  v_stop_id uuid;
begin
  if not is_admin() then
    raise exception 'Unauthorized: Admin privileges required.';
  end if;

  for v_i in 1..array_length(p_stop_ids, 1) loop
    v_stop_id := p_stop_ids[v_i];
    update route_stops
    set sequence = 1000 + v_i
    where route_id = p_route_id and stop_id = v_stop_id;
  end loop;

  for v_i in 1..array_length(p_stop_ids, 1) loop
    v_stop_id := p_stop_ids[v_i];
    update route_stops
    set sequence = v_i
    where route_id = p_route_id and stop_id = v_stop_id;
  end loop;
end;
$$;
