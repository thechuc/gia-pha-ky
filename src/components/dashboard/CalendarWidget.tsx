"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Moon,
  Flame,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { motion } from "framer-motion";
import { Lunar, Solar } from "lunar-javascript";
import { getAnniversariesForCalendar, type CalendarAnniversary } from "@/app/actions/events";
import {
  getSolarHolidaysForDay,
  getLunarHolidaysForDay,
  type VietHoliday,
} from "@/utils/calendar/vietnameseHolidays";
import { CalendarDayPopover } from "./CalendarDayPopover";

// ── Constants ────────────────────────────────────────────────────────────────

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const MONTH_NAMES = [
  "Tháng Giêng", "Tháng Hai", "Tháng Ba", "Tháng Tư",
  "Tháng Năm", "Tháng Sáu", "Tháng Bảy", "Tháng Tám",
  "Tháng Chín", "Tháng Mười", "Tháng M. Một", "Tháng Chạp"
];

// ── Types ────────────────────────────────────────────────────────────────────

interface DayCell {
  date: Date;
  day: number;
  lunarDay: number;
  lunarMonth: number;
  lunarYear: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  anniversaries: CalendarAnniversary[];
  holidays: VietHoliday[];
}

// ── Helper: Build grid ──────────────────────────────────────────────────────

function buildCalendarGrid(
  year: number,
  month: number, // 0-indexed
  anniversaries: CalendarAnniversary[]
): DayCell[] {
  const firstDay = new Date(year, month, 1);
  // Monday = 0, Sunday = 6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: DayCell[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Previous month padding
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const date = new Date(year, month - 1, d);
    const solar = Solar.fromDate(date);
    const lunar = solar.getLunar();
    const lDay = lunar.getDay();
    const lMonth = Math.abs(lunar.getMonth());

    cells.push({
      date,
      day: d,
      lunarDay: lDay,
      lunarMonth: lMonth,
      lunarYear: lunar.getYear(),
      isCurrentMonth: false,
      isToday: false,
      anniversaries: [],
      holidays: [
        ...getSolarHolidaysForDay(d, month === 0 ? 12 : month),
        ...getLunarHolidaysForDay(lDay, lMonth),
      ],
    });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const solar = Solar.fromDate(date);
    const lunar = solar.getLunar();
    const lDay = lunar.getDay();
    const lMonth = Math.abs(lunar.getMonth());

    const dayAnnivs = anniversaries.filter((a) => a.solarDay === d);
    const dayHolidays = [
      ...getSolarHolidaysForDay(d, month + 1),
      ...getLunarHolidaysForDay(lDay, lMonth),
    ];

    cells.push({
      date,
      day: d,
      lunarDay: lDay,
      lunarMonth: lMonth,
      lunarYear: lunar.getYear(),
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
      anniversaries: dayAnnivs,
      holidays: dayHolidays,
    });
  }

  // Next month padding
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    const solar = Solar.fromDate(date);
    const lunar = solar.getLunar();
    const lDay = lunar.getDay();
    const lMonth = Math.abs(lunar.getMonth());

    cells.push({
      date,
      day: d,
      lunarDay: lDay,
      lunarMonth: lMonth,
      lunarYear: lunar.getYear(),
      isCurrentMonth: false,
      isToday: false,
      anniversaries: [],
      holidays: [
        ...getSolarHolidaysForDay(d, month + 2 > 12 ? 1 : month + 2),
        ...getLunarHolidaysForDay(lDay, lMonth),
      ],
    });
  }

  return cells;
}

// ── Get Lunar month label for header ────────────────────────────────────────

function getLunarMonthRange(cells: DayCell[]): string {
  const currentCells = cells.filter((c) => c.isCurrentMonth);
  if (currentCells.length === 0) return "";
  const firstLunar = currentCells[0].lunarMonth;
  const lastLunar = currentCells[currentCells.length - 1].lunarMonth;
  if (firstLunar === lastLunar) {
    return MONTH_NAMES[firstLunar - 1] || `Tháng ${firstLunar}`;
  }
  const n1 = MONTH_NAMES[firstLunar - 1] || `Tháng ${firstLunar}`;
  const n2 = MONTH_NAMES[lastLunar - 1] || `Tháng ${lastLunar}`;
  return `${n1} – ${n2}`;
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export function CalendarWidget() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [anniversaries, setAnniversaries] = useState<CalendarAnniversary[]>([]);
  const [loading, setLoading] = useState(true);

  // Popover state
  const [selectedDay, setSelectedDay] = useState<DayCell | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch anniversaries when month changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAnniversariesForCalendar(currentYear, currentMonth + 1).then((data) => {
      if (!cancelled) {
        setAnniversaries(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [currentYear, currentMonth]);

  // Build the grid
  const cells = useMemo(
    () => buildCalendarGrid(currentYear, currentMonth, anniversaries),
    [currentYear, currentMonth, anniversaries]
  );

  const lunarLabel = useMemo(() => getLunarMonthRange(cells), [cells]);

  // Navigation
  const goToPrev = useCallback(() => {
    setSelectedDay(null);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }, [currentMonth]);

  const goToNext = useCallback(() => {
    setSelectedDay(null);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }, [currentMonth]);

  const goToToday = useCallback(() => {
    setSelectedDay(null);
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  }, []);

  const isCurrentMonthView =
    currentYear === today.getFullYear() && currentMonth === today.getMonth();

  // Day click handler
  const handleDayClick = useCallback(
    (cell: DayCell, el: HTMLElement) => {
      if (selectedDay?.date.getTime() === cell.date.getTime()) {
        setSelectedDay(null);
        setAnchorRect(null);
        return;
      }
      setAnchorRect(el.getBoundingClientRect());
      setSelectedDay(cell);
    },
    [selectedDay]
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      ref={containerRef}
      className="relative bg-[#1A0F0F]/60 backdrop-blur-xl rounded-[24px] border border-white/5 shadow-2xl overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-28 h-28 bg-secondary/4 rounded-full -mr-14 -mt-14 blur-2xl pointer-events-none" />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-white/5 bg-[#140C0C]/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary shadow-lg">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[13px] font-serif font-bold text-secondary tracking-wide leading-tight">
                Lịch Âm Dương
              </h3>
              <div className="flex items-center gap-1">
                <Moon className="w-2.5 h-2.5 text-amber-400/60" />
                <span className="text-[9px] text-amber-400/50 font-bold tracking-wider">
                  {lunarLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!isCurrentMonthView && (
              <button
                onClick={goToToday}
                className="px-2 py-1 rounded-md bg-secondary/10 border border-secondary/20 text-secondary text-[9px] font-bold uppercase tracking-wider hover:bg-secondary hover:text-primary transition-all duration-200 cursor-pointer flex items-center gap-0.5"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Nay
              </button>
            )}
            <button
              onClick={goToPrev}
              className="w-6 h-6 rounded-md bg-white/5 border border-white/5 text-secondary/60 hover:bg-secondary hover:text-primary flex items-center justify-center transition-all duration-200 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div className="px-1.5 py-1 min-w-[90px] text-center">
              <span className="text-xs font-serif font-bold text-secondary">
                Tg {currentMonth + 1}
              </span>
              <span className="text-secondary/30 mx-1">·</span>
              <span className="text-xs font-bold text-secondary/50">{currentYear}</span>
            </div>
            <button
              onClick={goToNext}
              className="w-6 h-6 rounded-md bg-white/5 border border-white/5 text-secondary/60 hover:bg-secondary hover:text-primary flex items-center justify-center transition-all duration-200 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Calendar Grid ───────────────────────────────────────────────── */}
      <div className="px-2.5 py-2">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-0.5">
          {WEEKDAYS.map((wd, i) => (
            <div
              key={wd}
              className={`text-center py-1 text-[8px] font-black uppercase tracking-[0.15em] ${
                i === 6 ? "text-rose-400/50" : "text-secondary/25"
              }`}
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px">
          {cells.map((cell, idx) => {
            const hasAnniv = cell.anniversaries.length > 0;
            const hasHoliday = cell.holidays.length > 0;
            const isSunday = cell.date.getDay() === 0;
            const isSelected = selectedDay?.date.getTime() === cell.date.getTime();
            const isLunarFirst = cell.lunarDay === 1;

            return (
              <button
                key={idx}
                onClick={(e) => handleDayClick(cell, e.currentTarget)}
                className={`
                  relative flex flex-col items-center justify-center py-1 px-0.5 rounded-lg
                  transition-all duration-200 cursor-pointer group/day min-h-[36px]
                  ${cell.isCurrentMonth
                    ? "hover:bg-white/5"
                    : "opacity-25 hover:opacity-40"
                  }
                  ${cell.isToday
                    ? "bg-secondary/10 border border-secondary/25 ring-1 ring-secondary/15 shadow-[0_0_10px_rgba(212,175,55,0.08)]"
                    : "border border-transparent"
                  }
                  ${isSelected
                    ? "!bg-white/10 !border-secondary/30"
                    : ""
                  }
                `}
              >
                {/* Solar day */}
                <span
                  className={`text-xs font-bold leading-none ${
                    cell.isToday
                      ? "text-secondary"
                      : isSunday && cell.isCurrentMonth
                      ? "text-rose-400/80"
                      : cell.isCurrentMonth
                      ? "text-[#E2D1B0]/80"
                      : "text-[#E2D1B0]/20"
                  }`}
                >
                  {cell.day}
                </span>

                {/* Lunar day */}
                <span
                  className={`text-[7px] leading-none mt-px ${
                    isLunarFirst
                      ? "text-amber-400/70 font-bold"
                      : cell.isToday
                      ? "text-secondary/50"
                      : "text-[#E2D1B0]/20"
                  }`}
                >
                  {isLunarFirst ? `${cell.lunarDay}/${cell.lunarMonth}` : cell.lunarDay}
                </span>

                {/* Dot indicators */}
                {(hasAnniv || hasHoliday) && cell.isCurrentMonth && (
                  <div className="flex items-center gap-px mt-px">
                    {hasAnniv && (
                      <span className="w-1 h-1 rounded-full bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.5)]" />
                    )}
                    {hasHoliday && (
                      <span className="w-1 h-1 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.4)]" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Legend ───────────────────────────────────────────────────────── */}
      <div className="px-4 py-2 bg-[#140C0C]/40 border-t border-white/5 flex items-center justify-center gap-4">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_3px_rgba(244,63,94,0.4)]" />
          <span className="text-[8px] text-[#E2D1B0]/30 font-bold uppercase tracking-wider">
            Ngày giỗ
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_3px_rgba(251,191,36,0.3)]" />
          <span className="text-[8px] text-[#E2D1B0]/30 font-bold uppercase tracking-wider">
            Ngày lễ
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary/40 ring-1 ring-secondary/30" />
          <span className="text-[8px] text-[#E2D1B0]/30 font-bold uppercase tracking-wider">
            Hôm nay
          </span>
        </div>
      </div>

      {/* ── Popover ─────────────────────────────────────────────────────── */}
      {selectedDay && (
        <CalendarDayPopover
          isOpen={!!selectedDay}
          onClose={() => { setSelectedDay(null); setAnchorRect(null); }}
          anchorRect={anchorRect}
          containerRect={containerRef.current?.getBoundingClientRect() ?? null}
          date={selectedDay.date}
          lunarDay={selectedDay.lunarDay}
          lunarMonth={selectedDay.lunarMonth}
          lunarYear={selectedDay.lunarYear}
          anniversaries={selectedDay.anniversaries}
          holidays={selectedDay.holidays}
        />
      )}
    </motion.div>
  );
}
