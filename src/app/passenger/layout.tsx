import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentProfile } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { type NavItem } from "@/components/layout/Sidebar";

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/passenger/dashboard" },
  { label: "Search buses", href: "/passenger/search" },
  { label: "My tickets", href: "/passenger/tickets" },
  { label: "Live tracking", href: "/passenger/tracking" },
  { label: "Nearby stops", href: "/passenger/stops" },
  { label: "Passes", href: "/passenger/passes" },
  { label: "Notifications", href: "/passenger/notifications" },
  { label: "Feedback", href: "/passenger/feedback" },
  { label: "Profile", href: "/passenger/profile" },
];

export default async function PassengerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile(user.id);

  return (
    <DashboardShell
      items={NAV}
      title="Passenger"
      userName={profile?.full_name ?? "Passenger"}
      roleLabel="Passenger account"
    >
      {children}
    </DashboardShell>
  );
}
