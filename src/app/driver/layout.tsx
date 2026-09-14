import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentProfile } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { type NavItem } from "@/components/layout/Sidebar";

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/driver/dashboard" },
  { label: "My trips", href: "/driver/trips" },
  { label: "Live tracking", href: "/driver/tracking" },
  { label: "Trip history", href: "/driver/history" },
  { label: "Profile", href: "/driver/profile" },
];

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile(user.id);

  return (
    <DashboardShell
      items={NAV}
      title="Driver"
      userName={profile?.full_name ?? "Driver"}
      roleLabel="Driver account"
    >
      {children}
    </DashboardShell>
  );
}
