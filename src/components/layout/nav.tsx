"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, History } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/coach", label: "Coach", icon: MessageSquare },
  { href: "/history", label: "Historial", icon: History },
];

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 flex-col bg-[#0b1f14] p-4 gap-1">
      <Link href="/" className="flex items-center gap-2.5 px-3 py-5 mb-6">
        <div className="h-9 w-9 rounded-xl btn-gradient flex items-center justify-center">
          <span className="font-heading font-extrabold text-sm text-[#003825]">
            K
          </span>
        </div>
        <span className="font-heading font-bold text-lg tracking-tight text-[#d0e8d6]">
          Kaiton
        </span>
      </Link>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                isActive
                  ? "bg-[#102418] text-[#5af0b3]"
                  : "text-[#d0e8d6]/60 hover:bg-[#1a2e22] hover:text-[#d0e8d6]"
              )}
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass rounded-t-3xl shadow-[0_-4px_20px_rgba(69,223,164,0.05)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-20 px-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all",
                isActive
                  ? "bg-[#102418] text-[#5af0b3] rounded-2xl px-5 py-2"
                  : "text-[#d0e8d6]/60 hover:text-[#5af0b3] px-3 py-2"
              )}
            >
              <item.icon
                className="h-5 w-5"
                strokeWidth={1.5}
              />
              <span className="text-[10px] font-medium uppercase tracking-wider">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
