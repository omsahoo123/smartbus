import clsx from "clsx";

const TONE_MAP: Record<string, string> = {
  scheduled: "bg-primary-light text-primary-dark",
  running: "bg-accent/20 text-accent-dark",
  completed: "bg-line text-muted",
  cancelled: "bg-danger/10 text-danger",
  pending: "bg-accent/20 text-accent-dark",
  confirmed: "bg-primary-light text-primary-dark",
  expired: "bg-line text-muted",
  paid: "bg-primary-light text-primary-dark",
  failed: "bg-danger/10 text-danger",
  refunded: "bg-line text-muted",
  active: "bg-primary-light text-primary-dark",
  inactive: "bg-line text-muted",
  maintenance: "bg-accent/20 text-accent-dark",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        TONE_MAP[status] ?? "bg-line text-muted"
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
