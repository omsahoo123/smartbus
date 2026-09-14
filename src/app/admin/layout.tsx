import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentProfile } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { type NavItem } from "@/components/layout/Sidebar";

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard" },
  {
    label: "Operations",
    children: [
      { label: "Live buses", href: "/admin/dashboard#live" },
      { label: "Trips", href: "/admin/trips" },
      { label: "Routes", href: "/admin/routes" },
      { label: "Stops", href: "/admin/stops" },
      { label: "Schedules", href: "/admin/schedules" },
    ],
  },
  {
    label: "Fleet",
    children: [
      { label: "Buses", href: "/admin/buses" },
      { label: "Drivers", href: "/admin/drivers" },
    ],
  },
  { label: "Bookings", href: "/admin/bookings" },
  { label: "Users", href: "/admin/users" },
  { label: "Passes", href: "/admin/passes" },
  { label: "Reports", href: "/admin/reports" },
  { label: "Feedback", href: "/admin/feedback" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile(user.id);
  if (profile?.role !== "admin") redirect("/login");

  return (
    <DashboardShell
      items={NAV}
      title="Admin"
      userName={profile?.full_name ?? "Admin"}
      roleLabel="Administrator"
    >
      {children}
    </DashboardShell>
  );
}
