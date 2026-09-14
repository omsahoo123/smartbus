"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { LogOut } from "lucide-react";

export function Navbar({
  name,
  roleLabel,
  showBackButton,
  backHref,
}: {
  name: string;
  roleLabel: string;
  showBackButton?: boolean;
  backHref?: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
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

  return (
    <header className="flex items-center justify-between border-b border-line bg-surface/90 backdrop-blur-sm px-4 sm:px-6 py-3">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <button
            onClick={handleBack}
            aria-label="Go back"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink hover:border-primary hover:text-primary transition"
          >
            <span className="font-bold text-base leading-none">&lt;</span>
          </button>
        )}
        <div>
          <p className="text-sm font-semibold text-ink">{name}</p>
          <p className="text-xs text-muted">{roleLabel}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={handleSignOut} className="flex items-center gap-1.5 py-1.5 text-xs">
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign out</span>
        </Button>
      </div>
    </header>
  );
}
