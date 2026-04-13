"use client";

import {
  LayoutDashboard,
  Users,
  Network,
  Calendar,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Bell,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

// ─── Heritage Crest SVG (decorative inline icon) ─────────────────────────────
function HeritageCrest({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L3 7V13C3 17.55 7.08 21.74 12 23C16.92 21.74 21 17.55 21 13V7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const MENU_ITEMS = [
  { name: "Tổng quan",     icon: LayoutDashboard, href: "/dashboard" },
  { name: "Cây gia phả",   icon: Network,         href: "/dashboard/tree" },
  { name: "Thành viên",    icon: Users,           href: "/dashboard/members" },
  { name: "Sự kiện & Giỗ", icon: Calendar,        href: "/dashboard/events" },
  { name: "Tài liệu số",   icon: FileText,        href: "/dashboard/documents" },
];

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`bg-[#0E0808] text-[#F9F5EB] flex flex-col h-full border-r border-secondary/10 shadow-2xl shrink-0 relative transition-all duration-300 ease-in-out ${isCollapsed ? "w-20" : "w-64"}`}>
      {/* Ambient glow top-right */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
      {/* Ambient glow bottom-left */}
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full -ml-16 -mb-16 blur-2xl pointer-events-none" />

      {/* ── Logo Area ── */}
      <div className={`py-7 border-b border-white/5 relative z-10 flex items-center transition-all duration-300 ${isCollapsed ? "px-0 justify-center" : "px-6 justify-between"}`}>
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-3 group">
            {/* Brand mark */}
            <div className="relative w-10 h-10 bg-primary flex items-center justify-center rounded-xl border border-secondary/40 shadow-lg group-hover:shadow-secondary/20 transition-shadow overflow-hidden">
              {/* Shimmer sweep on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              <HeritageCrest className="w-5 h-5 text-secondary relative z-10" />
            </div>
            <div className="transition-all duration-300 overflow-hidden whitespace-nowrap">
              <span className="block text-[15px] font-serif font-bold tracking-tight text-white leading-tight">
                Gia Phả Ký
              </span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-secondary/40">
                Di sản số dòng tộc
              </span>
            </div>
          </Link>
        )}

        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`transition-all duration-300 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ${
            isCollapsed 
              ? "w-10 h-10 bg-white/5" 
              : "w-7 h-7"
          }`}
          title={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
        >
          {isCollapsed ? <Menu className="w-5 h-5 text-secondary" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-5 space-y-1 relative z-10 overflow-y-auto custom-scrollbar overflow-x-hidden">

        {MENU_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group/nav ${
                isActive
                  ? "bg-primary/80 text-secondary shadow-lg shadow-primary/30"
                  : "text-white/60 hover:bg-white/5 hover:text-white/90"
              }`}
            >
              {/* Active left bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-secondary rounded-r-full" />
              )}

              <div className="flex items-center gap-3">
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? "bg-secondary/20 text-secondary"
                    : "bg-white/5 text-white/40 group-hover/nav:bg-white/8 group-hover/nav:text-white/70"
                } ${isCollapsed && !isActive ? "mx-auto" : ""}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                </div>
                <span className={`text-sm font-semibold transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
                  {item.name}
                </span>
              </div>

              {!isCollapsed && isActive && <ChevronRight className="w-3.5 h-3.5 text-secondary/60 shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom Section ── */}
      <div className="px-3 pb-5 pt-4 border-t border-white/5 space-y-1 relative z-10">
        <button className={`flex items-center gap-3 text-white/40 hover:text-secondary transition-colors duration-200 w-full rounded-xl hover:bg-white/5 cursor-pointer group/btn ${isCollapsed ? "justify-center p-2" : "px-3 py-2.5"}`} title={isCollapsed ? "Cài đặt" : ""}>
          <div className="shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/btn:bg-white/8">
            <Settings className="w-4 h-4" />
          </div>
          <span className={`text-sm font-semibold transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>Cài đặt</span>
        </button>

        <button className={`flex items-center gap-3 text-red-500/60 hover:text-red-400 transition-colors duration-200 w-full rounded-xl hover:bg-red-500/5 cursor-pointer group/btn ${isCollapsed ? "justify-center p-2" : "px-3 py-2.5"}`} title={isCollapsed ? "Đăng xuất" : ""}>
          <div className="shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/btn:bg-red-500/10">
            <LogOut className="w-4 h-4" />
          </div>
          <span className={`text-sm font-semibold transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>Đăng xuất</span>
        </button>

        {/* User card */}
        <div className={`mt-4 pt-4 border-t border-white/5 flex items-center ${isCollapsed ? "justify-center" : "gap-3 px-2"}`}>
          <div className="w-9 h-9 rounded-full bg-primary/60 border border-secondary/40 flex items-center justify-center shrink-0">
            <span className="text-secondary font-bold text-xs">TC</span>
          </div>
          <div className={`flex-1 min-w-0 transition-all duration-300 overflow-hidden ${isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"}`}>
            <p className="text-xs font-bold text-white/80 truncate">Quản trị viên</p>
            <p className="text-[10px] text-secondary/40 truncate">admin@giaphaky.vn</p>
          </div>
          <div className={`px-2 py-0.5 rounded-full bg-secondary/10 border border-secondary/20 transition-all duration-300 overflow-hidden ${isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"}`}>
            <span className="text-[8px] font-black text-secondary uppercase tracking-widest">Pro</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Dashboard Header ─────────────────────────────────────────────────────────
export function DashboardHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  const pathname = usePathname();

  // Build breadcrumb segments from pathname
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumb = segments.map((seg, i) => {
    const labelMap: Record<string, string> = {
      dashboard: "Trang chủ",
      tree: "Cây gia phả",
      members: "Thành viên",
      events: "Sự kiện",
      documents: "Tài liệu",
    };
    return {
      label: labelMap[seg] ?? seg,
      href: "/" + segments.slice(0, i + 1).join("/"),
      isLast: i === segments.length - 1,
    };
  });

  return (
    <header className="h-[68px] bg-[#0E0808]/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-30 shrink-0">
      {/* Left: Title + Breadcrumb */}
      <div className="flex flex-col gap-0.5">
        <nav className="flex items-center gap-1.5" aria-label="Breadcrumb">
          {breadcrumb.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="w-3 h-3 text-white/15" />}
              <span className={`text-[11px] font-bold uppercase tracking-widest ${
                crumb.isLast ? "text-secondary/70" : "text-white/25 hover:text-white/50 cursor-pointer transition-colors"
              }`}>
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>
        <h2 className="text-lg font-serif font-bold text-white/90 leading-tight">{title}</h2>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {children}

        {/* Notification bell */}
        <button className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-secondary hover:bg-white/8 hover:border-secondary/20 transition-all duration-200 cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 border border-[#0E0808]" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-primary/60 border border-secondary/40 flex items-center justify-center cursor-pointer hover:border-secondary/70 transition-colors duration-200">
          <span className="text-secondary font-bold text-xs">TC</span>
        </div>
      </div>
    </header>
  );
}
