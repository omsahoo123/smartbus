"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export interface NavItem {
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
}

export function Sidebar({ items, title }: { items: NavItem[]; title: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-line bg-surface md:flex md:flex-col">
      <div className="border-b border-line px-5 py-5">
        <span className="font-display text-lg text-ink">SmartBus</span>
        <p className="text-xs text-muted">{title}</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 text-sm">
        {items.map((item) => (
          <div key={item.label} className="mb-3">
            {item.href ? (
              <Link
                href={item.href}
                prefetch={true}
                className={clsx(
                  "block rounded-md px-3 py-2 font-medium",
                  pathname === item.href
                    ? "bg-primary-light text-primary-dark"
                    : "text-ink hover:bg-bg"
                )}
              >
                {item.label}
              </Link>
            ) : (
              <>
                <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-normal text-muted">
                  {item.label}
                </p>
                {item.children?.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    prefetch={true}
                    className={clsx(
                      "block rounded-md px-3 py-2",
                      pathname === child.href
                        ? "bg-primary-light font-medium text-primary-dark"
                        : "text-ink hover:bg-bg"
                    )}
                  >
                    {child.label}
                  </Link>
                ))}
              </>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
