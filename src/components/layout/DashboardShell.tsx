"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import {
  Menu,
  X,
  ChevronLeft,
  LogOut,
  LayoutDashboard,
  Search,
  Ticket,
  Navigation,
  MapPin,
  CreditCard,
  Bell,
  MessageSquare,
  User,
  Bus,
  Route,
  Calendar,
  BarChart3,
  Users,
  Shield,
  Activity,
  History,
  Radio,
  FileText
} from "lucide-react";
import { NavItem } from "./Sidebar";

interface DashboardShellProps {
  items: NavItem[];
  title: string;
  userName: string;
  roleLabel: string;
  children: React.ReactNode;
  showBackButton?: boolean;
  backHref?: string;
}

// Icon mapper for consistent modern UI
function getNavIcon(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("dashboard") || normalized.includes("overview")) return <LayoutDashboard className="h-4 w-4" />;
  if (normalized.includes("search")) return <Search className="h-4 w-4" />;
  if (normalized.includes("ticket") || normalized.includes("booking")) return <Ticket className="h-4 w-4" />;
  if (normalized.includes("tracking") || normalized.includes("live")) return <Radio className="h-4 w-4 animate-pulse text-emerald-600" />;
  if (normalized.includes("stop")) return <MapPin className="h-4 w-4" />;
  if (normalized.includes("pass")) return <CreditCard className="h-4 w-4" />;
  if (normalized.includes("notification")) return <Bell className="h-4 w-4" />;
  if (normalized.includes("feedback")) return <MessageSquare className="h-4 w-4" />;
  if (normalized.includes("profile")) return <User className="h-4 w-4" />;
  if (normalized.includes("bus")) return <Bus className="h-4 w-4" />;
  if (normalized.includes("driver")) return <User className="h-4 w-4" />;
  if (normalized.includes("route")) return <Route className="h-4 w-4" />;
  if (normalized.includes("trip")) return <Navigation className="h-4 w-4" />;
  if (normalized.includes("history")) return <History className="h-4 w-4" />;
  if (normalized.includes("schedule")) return <Calendar className="h-4 w-4" />;
  if (normalized.includes("report")) return <BarChart3 className="h-4 w-4" />;
  if (normalized.includes("user")) return <Users className="h-4 w-4" />;
  return <Activity className="h-4 w-4" />;
}

export function DashboardShell({
  items,
  title,
  userName,
  roleLabel,
  children,
  showBackButton,
  backHref,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent background scroll when mobile drawer is active
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  async function handleSignOut() {
    // Clear role cookie
    document.cookie = "sb-role=; path=/; max-age=0";
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleBack() {
    if (backHref) {
      router.push(backHref);
    } else if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  const renderNavLinks = () => (
    <div className="space-y-1">
      {items.map((item) => (
        <div key={item.label} className="mb-2">
          {item.href ? (
            <Link
              href={item.href}
              prefetch={true}
              className={clsx(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                pathname === item.href
                  ? "bg-primary text-white shadow-sm shadow-primary/20"
                  : "text-ink/80 hover:bg-bg hover:text-ink"
              )}
            >
              <span className={clsx(
                "transition-colors",
                pathname === item.href ? "text-white" : "text-muted group-hover:text-primary"
              )}>
                {getNavIcon(item.label)}
              </span>
              <span>{item.label}</span>
            </Link>
          ) : (
            <div>
              <p className="px-3 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                {item.label}
              </p>
              <div className="space-y-1">
                {item.children?.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    prefetch={true}
                    className={clsx(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150",
                      pathname === child.href
                        ? "bg-primary text-white font-medium shadow-sm shadow-primary/20"
                        : "text-ink/80 hover:bg-bg hover:text-ink"
                    )}
                  >
                    <span className={clsx(
                      "transition-colors",
                      pathname === child.href ? "text-white" : "text-muted group-hover:text-primary"
                    )}>
                      {getNavIcon(child.label)}
                    </span>
                    <span>{child.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface md:flex">
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white font-display font-bold text-lg shadow-sm group-hover:bg-primary-dark transition">
              <Bus className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display text-lg font-bold text-ink tracking-tight">SmartBus</span>
              <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {title}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto p-4">
          {renderNavLinks()}
        </nav>

        {/* User Card at bottom of sidebar */}
        <div className="border-t border-line p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{userName}</p>
                <p className="truncate text-xs text-muted">{roleLabel}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="rounded-lg p-2 text-muted hover:bg-danger/10 hover:text-danger transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      <div
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-surface shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white font-display font-bold text-lg">
              <Bus className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display text-lg font-bold text-ink">SmartBus</span>
              <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {title}
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-2 text-ink hover:bg-bg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          {renderNavLinks()}
        </nav>

        <div className="border-t border-line p-4 bg-surface">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{userName}</p>
                <p className="truncate text-xs text-muted">{roleLabel}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-line py-2 text-xs font-medium text-danger hover:bg-danger/5 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-surface/90 backdrop-blur-md px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation drawer"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-ink hover:bg-bg md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Back Button '<' (strictly without the word "return") */}
            {showBackButton ? (
              <button
                onClick={handleBack}
                aria-label="Go back"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink hover:border-primary hover:text-primary transition"
              >
                <span className="font-bold text-lg leading-none">&lt;</span>
              </button>
            ) : null}

            <div className="hidden sm:block">
              <span className="text-sm font-medium text-ink">{userName}</span>
              <span className="mx-2 text-xs text-muted">•</span>
              <span className="text-xs text-muted">{roleLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-bg transition"
            >
              <span>Main Site</span>
            </Link>

            <button
              onClick={handleSignOut}
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:border-danger hover:text-danger transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
