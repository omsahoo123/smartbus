// Hand-written types matching supabase/migrations/0001_init.sql.
// Once the project is linked, replace with generated types via:
//   npx supabase gen types typescript --linked > src/types/database.ts

export type UserRole = "people" | "driver" | "admin";
export type BusStatus = "active" | "inactive" | "maintenance";
export type TripStatus = "scheduled" | "running" | "completed" | "cancelled";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "expired";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type TicketStatus = "valid" | "used" | "cancelled";
export type PassType = "daily" | "weekly" | "monthly" | "route_specific";
export type PassStatus = "active" | "expired" | "cancelled";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Bus {
  id: string;
  bus_number: string;
  registration_number: string;
  bus_type: string;
  capacity: number;
  status: BusStatus;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  profile_id: string;
  license_number: string;
  assigned_bus_id: string | null;
  status: string;
  created_at: string;
}

export interface RouteRow {
  id: string;
  route_name: string;
  source: string;
  destination: string;
  distance: number | null;
  estimated_duration: string | null;
  status: string;
}

export interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
}

export interface Trip {
  id: string;
  bus_id: string;
  route_id: string;
  driver_id: string | null;
  schedule_id: string | null;
  trip_date: string;
  start_time: string | null;
  end_time: string | null;
  status: TripStatus;
  created_at: string;
}

export interface Seat {
  id: string;
  bus_id: string;
  seat_number: string;
  row_number: number;
  column_number: number;
  seat_type: string;
  status: string;
}

export interface Booking {
  id: string;
  booking_code: string;
  user_id: string;
  trip_id: string;
  boarding_stop_id: string | null;
  dropping_stop_id: string | null;
  total_amount: number;
  payment_status: PaymentStatus;
  booking_status: BookingStatus;
  hold_expires_at: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  booking_id: string;
  qr_token: string;
  issued_at: string | null;
  valid_until: string | null;
  status: TicketStatus;
}

export interface TripLocation {
  id: string;
  trip_id: string;
  bus_id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  recorded_at: string;
}

export interface Pass {
  id: string;
  user_id: string;
  pass_type: PassType;
  route_id: string | null;
  valid_from: string;
  valid_until: string;
  amount: number;
  qr_token: string;
  status: PassStatus;
}

