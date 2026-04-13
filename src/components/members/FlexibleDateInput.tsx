"use client";

import React from "react";
import { Calendar, Moon, Sun } from "lucide-react";

interface FlexibleDateInputProps {
  label: string;
  day?: number;
  month?: number;
  year?: number;
  isLunar?: boolean;
  standardDate?: string;
  onChange: (data: {
    day?: number;
    month?: number;
    year?: number;
    isLunar: boolean;
    standardDate?: string;
  }) => void;
  INPUT_CLASS: string;
  LABEL_CLASS: string;
}

export function FlexibleDateInput({
  label,
  day,
  month,
  year,
  isLunar = false,
  standardDate,
  onChange,
  INPUT_CLASS,
  LABEL_CLASS,
}: FlexibleDateInputProps) {
  const [mode, setMode] = React.useState<"standard" | "flexible">(
    day || month || year || isLunar ? "flexible" : "standard"
  );

  const handleModeChange = (newMode: "standard" | "flexible") => {
    setMode(newMode);
    if (newMode === "standard") {
      onChange({ isLunar: false, standardDate: standardDate });
    } else {
      onChange({ day, month, year, isLunar });
    }
  };

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-[#140C0C]/40 border border-white/5">
      <div className="flex items-center justify-between mb-1">
        <label className={LABEL_CLASS}>
          <Calendar className="w-3 h-3" /> {label}
        </label>
        <div className="flex bg-[#0E0808] p-1 rounded-lg border border-white/5">
          <button
            type="button"
            onClick={() => handleModeChange("standard")}
            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
              mode === "standard"
                ? "bg-primary text-secondary"
                : "text-white/30 hover:text-white/60"
            }`}
          >
            Ngày chuẩn
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("flexible")}
            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
              mode === "flexible"
                ? "bg-primary text-secondary"
                : "text-white/30 hover:text-white/60"
            }`}
          >
            Linh hoạt / Âm lịch
          </button>
        </div>
      </div>

      {mode === "standard" ? (
        <input
          type="date"
          value={standardDate || ""}
          onChange={(e) => onChange({ isLunar: false, standardDate: e.target.value })}
          className={INPUT_CLASS}
        />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[9px] text-white/20 mb-1 uppercase font-bold tracking-wider">Ngày</p>
              <select
                value={day || ""}
                onChange={(e) =>
                  onChange({
                    day: e.target.value ? Number(e.target.value) : undefined,
                    month,
                    year,
                    isLunar,
                  })
                }
                className={`${INPUT_CLASS} py-2 text-xs`}
              >
                <option value="">—</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d} className="bg-[#1A0F0F]">
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[9px] text-white/20 mb-1 uppercase font-bold tracking-wider">Tháng</p>
              <select
                value={month || ""}
                onChange={(e) =>
                  onChange({
                    day,
                    month: e.target.value ? Number(e.target.value) : undefined,
                    year,
                    isLunar,
                  })
                }
                className={`${INPUT_CLASS} py-2 text-xs`}
              >
                <option value="">—</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m} className="bg-[#1A0F0F]">
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[9px] text-white/20 mb-1 uppercase font-bold tracking-wider">Năm</p>
              <input
                type="number"
                placeholder="Năm"
                value={year || ""}
                onChange={(e) =>
                  onChange({
                    day,
                    month,
                    year: e.target.value ? Number(e.target.value) : undefined,
                    isLunar,
                  })
                }
                className={`${INPUT_CLASS} py-2 text-xs`}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => onChange({ day, month, year, isLunar: false })}
              className={`flex-1 py-2 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                !isLunar
                  ? "bg-secondary/20 border-secondary/40 text-secondary"
                  : "bg-white/5 border-white/10 text-white/30 hover:border-white/20"
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">Dương lịch</span>
            </button>
            <button
              type="button"
              onClick={() => onChange({ day, month, year, isLunar: true })}
              className={`flex-1 py-2 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                isLunar
                  ? "bg-secondary/20 border-secondary/40 text-secondary"
                  : "bg-white/5 border-white/10 text-white/30 hover:border-white/20"
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">Âm lịch</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
