"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Building2, 
  Palette, 
  User, 
  Bell, 
  ChevronRight 
} from "lucide-react";

const SETTINGS_MENU = [
  { id: "identity",     name: "Bản sắc Dòng họ", icon: Building2, href: "/dashboard/settings/identity" },
  { id: "appearance",   name: "Hiển thị & Cây",  icon: Palette,   href: "/dashboard/settings/appearance" },
  { id: "profile",      name: "Cá nhân",         icon: User,      href: "/dashboard/settings/profile" },
  { id: "notifications", name: "Thông báo",       icon: Bell,      href: "/dashboard/settings/notifications" },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-full md:w-64 shrink-0 flex flex-col gap-1">
      {SETTINGS_MENU.map((item) => {
        const isActive = pathname === item.href || (item.id === "identity" && pathname === "/dashboard/settings");
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
              isActive
                ? "bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5"
                : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                isActive
                  ? "bg-primary/20 text-primary"
                  : "bg-white/5 text-slate-500 group-hover:bg-white/8 group-hover:text-slate-300"
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold tracking-tight">
                {item.name}
              </span>
            </div>
            {isActive && <ChevronRight className="w-4 h-4 text-primary/60" />}
          </Link>
        );
      })}
    </nav>
  );
}
