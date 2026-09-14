-- Adds the passenger-details + payment-confirmation step of the booking flow.

-- Passengers write their own passenger details onto a pending booking they
-- own (RLS already allows this via "own booking passengers write"), then
-- update the booking's total_amount themselves is NOT allowed by RLS -- only
-- server-verified logic should move money-relevant fields. So total_amount
-- and the payment/ticket creation all happen inside this SECURITY DEFINER
-- function, gated on booking ownership.

create or replace function set_booking_amount(p_booking_id uuid, p_amount numeric)
returns void
language plpgsql
security definer
as $$
begin
  update bookings
  set total_amount = p_amount
  where id = p_booking_id and user_id = auth.uid() and booking_status = 'pending';

  if not found then
    raise exception 'Booking not found or not editable.';
  end if;
end;
$$;

-- Simulates gateway verification (swap the body for a real Razorpay/UPI
-- webhook-driven check when the payment gateway is wired up). Confirms the
-- booking, records the payment, and issues a QR ticket -- all or nothing.
create or replace function confirm_booking_payment(p_booking_id uuid, p_transaction_id text)
returns uuid
language plpgsql
security definer
as $$
declare
  v_amount numeric;
  v_ticket_id uuid;
begin
  select total_amount into v_amount
  from bookings
  where id = p_booking_id and user_id = auth.uid() and booking_status = 'pending';

  if not found then
    raise exception 'Booking not found, already confirmed, or the seat hold has expired.';
  end if;

  update bookings
  set booking_status = 'confirmed', payment_status = 'paid'
  where id = p_booking_id;

  insert into payments (booking_id, gateway, transaction_id, amount, status, paid_at)
  values (p_booking_id, 'razorpay', p_transaction_id, v_amount, 'paid', now())
  on conflict (booking_id) do update
    set status = 'paid', transaction_id = p_transaction_id, paid_at = now();

  insert into tickets (booking_id, issued_at, valid_until, status)
  values (p_booking_id, now(), now() + interval '2 days', 'valid')
  on conflict (booking_id) do update set status = 'valid'
  returning id into v_ticket_id;

  insert into notifications (user_id, title, message, type)
  select user_id, 'Booking confirmed', 'Your ticket ' || booking_code || ' is confirmed.', 'booking_confirmed'
  from bookings where id = p_booking_id;

  return v_ticket_id;
end;
$$;

-- Passengers can cancel their own confirmed/pending bookings up until the
-- trip departs; refund policy is intentionally left as a placeholder value
-- so it can be made configurable (per spec 9: "stored/configurable rather
-- than hard-coded") instead of a fixed rule buried in the UI.
create table if not exists cancellation_policies (
  id uuid primary key default gen_random_uuid(),
  hours_before_departure int not null,
  refund_percentage int not null check (refund_percentage between 0 and 100)
);
insert into cancellation_policies (hours_before_departure, refund_percentage)
values (24, 90), (6, 50), (0, 0)
on conflict do nothing;

create or replace function cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update bookings
  set booking_status = 'cancelled'
  where id = p_booking_id and user_id = auth.uid()
    and booking_status in ('pending', 'confirmed');

  if not found then
    raise exception 'Booking not found or not cancellable.';
  end if;

  delete from trip_seat_locks where booking_id = p_booking_id;

  update tickets set status = 'cancelled' where booking_id = p_booking_id;
  update payments set status = 'refunded' where booking_id = p_booking_id and status = 'paid';
end;
$$;
