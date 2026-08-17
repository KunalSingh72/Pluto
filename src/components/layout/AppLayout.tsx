"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems, bottomNavItem } from "@/config/navigation";
import { Menu, Sparkles } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { useEffect, useState } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b] text-zinc-100">
      <aside
        className={`${
          sidebarCollapsed ? "w-20" : "w-64"
        } transition-all duration-300 flex flex-col border-r border-zinc-800/80 bg-[#101012] p-4 justify-between select-none z-50`}
      >
        <div>
          {/* Brand Header */}
          <div
            className={`flex items-center mb-8 px-1 ${sidebarCollapsed ? "justify-center mt-1" : "justify-between"}`}
          >
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-900/30">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap overflow-hidden">
                  Pluto
                </span>
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800/50 transition-colors"
            >
              <Menu className="h-5 w-5 shrink-0" />
            </button>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all overflow-hidden whitespace-nowrap ${
                    isActive
                      ? "bg-purple-950/60 text-purple-200 border border-purple-800/40 shadow-inner"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40"
                  }`}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isActive ? "text-purple-400" : "text-zinc-400"}`}
                  />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-zinc-800/60">
          <Link
            href={bottomNavItem.href}
            className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all overflow-hidden whitespace-nowrap ${
              pathname.startsWith(bottomNavItem.href)
                ? "bg-purple-950/60 text-purple-200 border border-purple-800/40"
                : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40"
            }`}
            title={sidebarCollapsed ? bottomNavItem.name : undefined}
          >
            <bottomNavItem.icon className="h-4 w-4 shrink-0 text-zinc-400" />
            {!sidebarCollapsed && <span>{bottomNavItem.name}</span>}
          </Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-dot-grid relative">
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>

      {/* Right Sidebar Portal Target */}
      <div
        id="right-sidebar-root"
        className="h-full z-40 shrink-0 flex flex-col bg-[#09090b]"
      />
    </div>
  );
}
