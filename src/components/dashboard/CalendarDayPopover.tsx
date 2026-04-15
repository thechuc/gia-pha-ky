"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Moon, Flame, Sparkles, UserCircle2, X } from "lucide-react";
import type { CalendarAnniversary } from "@/app/actions/events";
import type { VietHoliday } from "@/utils/calendar/vietnameseHolidays";

interface CalendarDayPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRect: DOMRect | null;
  containerRect: DOMRect | null;
  date: Date;
  lunarDay: number;
  lunarMonth: number;
  lunarYear: number;
  anniversaries: CalendarAnniversary[];
  holidays: VietHoliday[];
}

const WEEKDAY_NAMES = [
  "Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư",
  "Thứ Năm", "Thứ Sáu", "Thứ Bảy"
];

export function CalendarDayPopover({
  isOpen,
  onClose,
  anchorRect,
  containerRect,
  date,
  lunarDay,
  lunarMonth,
  lunarYear,
  anniversaries,
  holidays,
}: CalendarDayPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; showAbove: boolean }>({
    top: 0, left: 0, showAbove: false
  });

  useEffect(() => {
    if (!anchorRect || !containerRect || !isOpen) return;

    const popoverHeight = 280;
    const relativeTop = anchorRect.top - containerRect.top;
    const relativeLeft = anchorRect.left - containerRect.left;
    const spaceBelow = containerRect.height - (relativeTop + anchorRect.height);
    const showAbove = spaceBelow < popoverHeight && relativeTop > popoverHeight;

    let left = relativeLeft + anchorRect.width / 2 - 140;
    left = Math.max(8, Math.min(left, containerRect.width - 288));

    setPosition({
      top: showAbove
        ? relativeTop - 8
        : relativeTop + anchorRect.height + 8,
      left,
      showAbove,
    });
  }, [anchorRect, containerRect, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  const dayOfWeek = WEEKDAY_NAMES[date.getDay()];
  const solarStr = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  const lunarStr = `${lunarDay}/${lunarMonth}`;
  const hasContent = anniversaries.length > 0 || holidays.length > 0;

  return (
    <AnimatePresence>
      {isOpen && anchorRect && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.92, y: position.showAbove ? 8 : -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: position.showAbove ? 8 : -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="absolute z-50 w-[280px]"
          style={{
            top: position.showAbove ? undefined : position.top,
            bottom: position.showAbove ? `calc(100% - ${position.top}px)` : undefined,
            left: position.left,
          }}
        >
          <div className="bg-[#1A0F0F]/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-[#140C0C]/60 border-b border-white/5 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5 text-secondary/70" />
                  <span className="text-sm font-bold text-secondary">
                    {dayOfWeek}, {solarStr}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Moon className="w-3 h-3 text-amber-400/70" />
                  <span className="text-[11px] text-amber-400/80 font-medium">
                    Âm lịch: {lunarStr} năm {lunarYear}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 max-h-[220px] overflow-y-auto custom-scrollbar space-y-2">
              {/* Anniversaries */}
              {anniversaries.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 px-1">
                    <Flame className="w-3 h-3 text-rose-400" />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-rose-400/80">
                      Ngày Giỗ
                    </span>
                  </div>
                  {anniversaries.map((a) => (
                    <div
                      key={a.memberId}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-rose-500/5 border border-rose-500/10 hover:border-rose-500/20 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        {a.avatar ? (
                          <img src={a.avatar} alt={a.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle2 className="w-5 h-5 text-white/25" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-rose-200 truncate">{a.fullName}</p>
                        <p className="text-[10px] text-rose-300/50 font-medium">
                          Đời {a.generation} · {a.formattedLunar}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Holidays */}
              {holidays.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 px-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-amber-400/80">
                      Ngày Lễ
                    </span>
                  </div>
                  {holidays.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-amber-500/5 border border-amber-500/10"
                    >
                      <span className="text-base">{h.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-amber-200 truncate">{h.name}</p>
                        {h.isOfficial && (
                          <p className="text-[9px] text-amber-400/40 font-bold uppercase tracking-wider">
                            Ngày nghỉ lễ
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!hasContent && (
                <div className="py-4 text-center">
                  <p className="text-xs text-[#E2D1B0]/30 italic">
                    Không có sự kiện nào
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
