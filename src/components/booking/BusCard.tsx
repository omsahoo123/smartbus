import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";

export interface BusCardProps {
  tripId: string;
  busNumber: string;
  busType: string;
  routeName: string;
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  fare: number;
  seatsLeft: number;
  status: string;
}

export function BusCard(props: BusCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="route-line">
        <p className="text-xs text-muted">{props.busNumber} &middot; {props.busType.replace(/_/g, " ")}</p>
        <div className="relative pb-3">
          <span className="route-dot" />
          <p className="text-sm font-medium text-ink">{props.source}</p>
          <p className="text-xs text-muted">{props.departureTime}</p>
        </div>
        <div className="relative">
          <span className="route-dot" />
          <p className="text-sm font-medium text-ink">{props.destination}</p>
          <p className="text-xs text-muted">{props.arrivalTime}</p>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
        <StatusBadge status={props.status} />
        <p className="font-display text-2xl text-ink">₹{props.fare}</p>
        <p className="text-xs text-muted">{props.seatsLeft} seats left</p>
        <Link
          href={`/passenger/buses/${props.tripId}`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Select seats
        </Link>
      </div>
    </div>
  );
}
