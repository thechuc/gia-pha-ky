"use client";

import React from "react";
import {
  Search,
  LayoutGrid,
  List,
  ChevronDown,
  X,
  SlidersHorizontal,
  Plus,
} from "lucide-react";
import type { Gender } from "@prisma/client";

export interface FilterState {
  search: string;
  gender: Gender | null;
  isAlive: boolean | null;
  branchId: string | null;
  generation: number | null;
  sortBy: "name" | "generation" | "dateOfBirth" | "createdAt";
  sortOrder: "asc" | "desc";
}

interface Branch {
  id: string;
  name: string;
}

interface MemberFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  maxGeneration: number;
  branches: Branch[];
  totalResults: number;
  onAddClick?: () => void;
}

const GENDER_OPTIONS = [
  { value: null, label: "Tất cả" },
  { value: "MALE" as Gender, label: "Nam" },
  { value: "FEMALE" as Gender, label: "Nữ" },
];

const STATUS_OPTIONS = [
  { value: null, label: "Tất cả" },
  { value: true, label: "Còn sống" },
  { value: false, label: "Đã khuất" },
];

const SORT_OPTIONS = [
  { value: "generation", label: "Theo đời" },
  { value: "name", label: "Theo tên" },
  { value: "dateOfBirth", label: "Theo ngày sinh" },
  { value: "createdAt", label: "Mới nhất" },
];

export function MemberFilters({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  maxGeneration,
  branches,
  totalResults,
  onAddClick,
}: MemberFiltersProps) {
  const update = (partial: Partial<FilterState>) =>
    onFiltersChange({ ...filters, ...partial });

  const hasActiveFilters =
    filters.search ||
    filters.gender !== null ||
    filters.isAlive !== null ||
    filters.branchId !== null ||
    filters.generation !== null;

  const clearAll = () =>
    onFiltersChange({
      search: "",
      gender: null,
      isAlive: null,
      branchId: null,
      generation: null,
      sortBy: "generation",
      sortOrder: "asc",
    });

  return (
    <div className="space-y-2">
      {/* Search + Actions Row */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Tìm kiếm theo tên thành viên..."
            className="w-full pl-11 pr-10 py-1.5 rounded-xl border border-border bg-white text-sm text-slate-900 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all placeholder:text-foreground/30"
          />
          {filters.search && (
            <button
              onClick={() => update({ search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center transition-colors"
            >
              <X className="w-3 h-3 text-foreground/40" />
            </button>
          )}
        </div>

        {/* Add Member Button - Heritage Style */}
        {onAddClick && (
          <button
            onClick={onAddClick}
          className="group relative px-5 py-1.5 bg-[#8B0000] hover:bg-[#A52A2A] text-[#E2D1B0] rounded-xl border border-[#E2D1B0]/30 shadow-md flex items-center gap-2 transition-all duration-300 active:scale-95 cursor-pointer overflow-hidden shrink-0"
        >
          {/* Shimmer sweep effect */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E2D1B0]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
          
          <Plus className="w-4 h-4 text-secondary" strokeWidth={3} />
          <span className="text-[13px] font-bold uppercase tracking-wider">Thêm mới</span>
        </button>
        )}

        {/* View Mode Toggle */}
        <div className="flex rounded-xl border border-border overflow-hidden bg-white shrink-0 shadow-sm">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-1.5 transition-all ${
              viewMode === "grid"
                ? "bg-primary text-secondary"
                : "text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5"
            }`}
            title="Dạng lưới"
          >
            <LayoutGrid className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`p-1.5 transition-all ${
              viewMode === "list"
                ? "bg-primary text-secondary"
                : "text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5"
            }`}
            title="Dạng danh sách"
          >
            <List className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Filter Chips Row */}
      <div className="flex items-center gap-2 flex-wrap">
        <SlidersHorizontal className="w-3.5 h-3.5 text-foreground/30" />

        {/* Gender Chips */}
        {GENDER_OPTIONS.map((opt) => (
          <button
            key={String(opt.value)}
            onClick={() => update({ gender: opt.value })}
            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
              filters.gender === opt.value
                ? "bg-primary text-secondary border-primary"
                : "bg-white text-foreground/60 border-border hover:border-secondary/30"
            }`}
          >
            {opt.label}
          </button>
        ))}

        <div className="w-px h-5 bg-border mx-1" />

        {/* Status Chips */}
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={String(opt.value)}
            onClick={() => update({ isAlive: opt.value })}
            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
              filters.isAlive === opt.value
                ? "bg-primary text-secondary border-primary"
                : "bg-white text-foreground/60 border-border hover:border-secondary/30"
            }`}
          >
            {opt.label}
          </button>
        ))}

        <div className="w-px h-5 bg-border mx-1" />

        {/* Generation Filter */}
        <div className="relative">
          <select
            value={filters.generation ?? ""}
            onChange={(e) =>
              update({ generation: e.target.value ? Number(e.target.value) : null })
            }
            className={`appearance-none pl-3 pr-7 py-1 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
              filters.generation !== null
                ? "bg-primary text-secondary border-primary"
                : "bg-white text-foreground/60 border-border hover:border-secondary/30"
            }`}
          >
            <option value="">Tất cả các đời</option>
            {Array.from({ length: maxGeneration }, (_, i) => i + 1).map((gen) => (
              <option key={gen} value={gen}>
                Đời thứ {gen}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
        </div>

        {/* Branch Filter */}
        {branches.length > 0 && (
          <>
            <div className="w-px h-5 bg-border mx-1" />
            <div className="relative">
              <select
                value={filters.branchId ?? ""}
                onChange={(e) =>
                  update({ branchId: e.target.value || null })
                }
                className={`appearance-none pl-3 pr-7 py-1 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                  filters.branchId !== null
                    ? "bg-primary text-secondary border-primary"
                    : "bg-white text-foreground/60 border-border hover:border-secondary/30"
                }`}
              >
                <option value="">Tất cả nhánh</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
            </div>
          </>
        )}

        {/* Clear All */}
        {hasActiveFilters && (
          <>
            <div className="w-px h-5 bg-border mx-1" />
            <button
              onClick={clearAll}
              className="px-3 py-1 rounded-lg text-xs font-bold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 transition-all flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Xóa bộ lọc
            </button>
          </>
        )}

        {/* Result Count */}
        <span className="ml-auto text-[11px] text-foreground/40 font-medium">
          {totalResults} thành viên
        </span>
      </div>
    </div>
  );
}
