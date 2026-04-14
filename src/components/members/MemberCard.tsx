"use client";

import React, { useMemo } from "react";
import {
  User,
  MapPin,
  Briefcase,
  Edit3,
  Trash2,
  Network,
  Calendar,
  Heart,
  Crown,
  Flame,
} from "lucide-react";
import { motion } from "framer-motion";
import { Member } from "@/types/member";

// ─── Types ─────────────────────────────────────────────────────────────────────


interface MemberCardProps {
  member: Member;
  index: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onViewTree: (id: string) => void;
  branchName?: string;
  canEdit?: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  const day = dt.getDate().toString().padStart(2, "0");
  const month = (dt.getMonth() + 1).toString().padStart(2, "0");
  const year = dt.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatFlexibleDate(
  day?: number | null,
  month?: number | null,
  year?: number | null,
  isLunar?: boolean,
  standardDate?: Date | string | null
): string {
  if (day || month || year) {
    const dStr = day ? day.toString().padStart(2, "0") : "??";
    const mStr = month ? month.toString().padStart(2, "0") : "??";
    const yStr = year ? year.toString() : "";
    
    let result = `${dStr}/${mStr}`;
    if (yStr) result += `/${yStr}`;
    if (isLunar) result += " Âm lịch";
    return result;
  }
  return formatDate(standardDate);
}

function getYear(d: Date | string | null | undefined): number | null {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt.getFullYear();
}

function calcAge(
  birthDate?: Date | string | null,
  deathDate?: Date | string | null,
  birthYear?: number | null,
  deathYear?: number | null,
  isAlive?: boolean
): number | null {
  const bYear = birthYear || (birthDate ? new Date(birthDate).getFullYear() : null);
  if (!bYear || isNaN(bYear)) return null;

  let dYear: number | null = null;
  if (isAlive === false) {
    dYear = deathYear || (deathDate ? new Date(deathDate).getFullYear() : null);
  } else {
    dYear = new Date().getFullYear();
  }

  if (!dYear || isNaN(dYear)) return null;
  return dYear - bYear;
}

// Traditional Vietnamese spouse titles by order (thứ tự)
const SPOUSE_TITLES = ["Chính thất", "Ả thất", "Trắc thất", "Thiếp thứ tư", "Thiếp thứ năm"];

function getSpouseTitle(index: number, gender: string): string {
  if (gender === "FEMALE") return "Chồng";
  return SPOUSE_TITLES[index] || `Thiếp thứ ${index + 1}`;
}

// ─── MemberCard ─────────────────────────────────────────────────────────────────
export function MemberCard({ 
  member, 
  index, 
  onEdit, 
  onDelete, 
  onViewTree, 
  branchName: propBranchName,
  canEdit = false, 
}: MemberCardProps) {
  const isMale = member.gender === "MALE";
  const branchName = propBranchName || member.branch?.name || member.branchName;

  const birthDate = formatFlexibleDate(
    member.birthDay,
    member.birthMonth,
    member.birthYear,
    member.isBirthDateLunar,
    member.dateOfBirth
  );
  const deathDate = formatFlexibleDate(
    member.deathDay,
    member.deathMonth,
    member.deathYear,
    member.isDeathDateLunar,
    member.dateOfDeath
  );
  
  const birthYear = member.birthYear || getYear(member.dateOfBirth);
  const deathYear = !member.isAlive ? (member.deathYear || getYear(member.dateOfDeath)) : null;
  const age = calcAge(
    member.dateOfBirth,
    member.dateOfDeath,
    member.birthYear,
    member.deathYear,
    member.isAlive
  );

  // ── Parse Relationships ──────────────────────────────────────────────────────
  const { fathers, mothers, husbands, wives, children } = useMemo(() => {
    const sourceRels = member.sourceRels || [];
    const targetRels = member.targetRels || [];

    // Parents: member is target, source is parent
    const parents = targetRels
      .filter(r => r.type === "PARENT_CHILD" && r.sourceMember)
      .map(r => r.sourceMember!);
    const fathers = parents.filter(p => p.gender === "MALE");
    const mothers = parents.filter(p => p.gender === "FEMALE");

    // Children: member is source, target is child
    const children = sourceRels
      .filter(r => r.type === "PARENT_CHILD" && r.targetMember)
      .map(r => r.targetMember!);

    // Spouses from both directions
    const spouseFromSource = sourceRels
      .filter(r => r.type === "SPOUSE" && r.targetMember)
      .map(r => r.targetMember!);
    const spouseFromTarget = targetRels
      .filter(r => r.type === "SPOUSE" && r.sourceMember)
      .map(r => r.sourceMember!);
    const allSpouses = [...spouseFromSource, ...spouseFromTarget];

    // Split by gender
    const wives = allSpouses.filter(s => s.gender === "FEMALE");
    const husbands = allSpouses.filter(s => s.gender === "MALE");

    return { fathers, mothers, husbands, wives, children };
  }, [member.sourceRels, member.targetRels]);

  const hasRelationships = fathers.length > 0 || mothers.length > 0 || husbands.length > 0 || wives.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className="group relative bg-[#1A0F0F] border border-white/8 hover:border-secondary/30 rounded-2xl shadow-lg hover:shadow-[0_16px_40px_rgba(0,0,0,0.6)] transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
      onClick={() => onEdit?.(member.id)}
    >
      {/* ── Original Background System: Header Band Gradient ── */}
      <div className={`absolute inset-x-0 top-0 h-32 pointer-events-none ${
        isMale
          ? "bg-gradient-to-b from-primary/20 to-transparent"
          : "bg-gradient-to-b from-rose-900/25 to-transparent"
      }`} />

      {/* Ambient top glow on hover */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-secondary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* ── Header Row ── */}
      <div className="relative z-10 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-primary/20 text-secondary text-[9px] font-black uppercase tracking-widest border border-secondary/20">
            Đời {member.generation}
          </span>
          {member.generation === 1 && (
            <span className="px-2 py-0.5 rounded-md bg-black/40 text-[#E2D1B0]/60 text-[8px] font-bold flex items-center gap-1">
              <Network className="w-2.5 h-2.5" />
              Thủy tổ
            </span>
          )}
        </div>
        
        <div className={`w-2 h-2 rounded-full ${
          member.isAlive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-white/10"
        }`} />
      </div>

      {/* ── Upper Body (Split Layout) ── */}
      <div className="px-4 pb-4 flex gap-4 items-start relative z-10">
        {/* Left: Portrait Frame */}
        <div className="relative shrink-0 w-[80px] h-[110px]">
          {/* Stylized Frame Background */}
          <div className="absolute inset-0 border-[3px] border-secondary/20 rounded-xl" />
          <div className="absolute inset-0 border border-secondary/10 -m-1 rounded-2xl" />
          <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-secondary/60 rounded-tl-sm" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-secondary/60 rounded-br-sm" />
          
          <div className="absolute inset-1 rounded-lg overflow-hidden bg-[#2C1A1A]">
            {member.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.avatar} alt={member.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-20">
                <User className="w-8 h-8 text-secondary" />
              </div>
            )}
          </div>
        </div>

        {/* Right: Info */}
        <div className="flex-1 pt-0.5 min-w-0">
          <h3 className={`font-serif font-bold text-secondary leading-[1.2] mb-2 break-words line-clamp-2 ${
            member.fullName.length > 20 ? "text-[14px]" : member.fullName.length > 15 ? "text-[15px]" : "text-[17px]"
          }`} style={{ textWrap: "balance" as any }}>
            {member.fullName}
          </h3>
          
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-secondary/30" />
              <span className="text-[9px] font-black text-white/20 uppercase tracking-tighter w-8">Sinh</span>
              <span className="text-[11px] text-[#E2D1B0]/80 font-medium truncate">
                {birthDate || <span className="text-white/10 italic">Chưa rõ</span>}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Flame className="w-3 h-3 text-secondary/30" />
              <span className="text-[9px] font-black text-white/20 uppercase tracking-tighter w-8">Mất</span>
              <span className="text-[11px] text-[#E2D1B0]/80 font-medium truncate">
                {member.isAlive ? (
                  <span className="text-emerald-500/40 text-[10px] font-bold italic tracking-wide">Còn sống</span>
                ) : (
                  deathDate || <span className="text-white/10 italic">Chưa rõ</span>
                )}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded-md bg-secondary/5 border border-secondary/10">
              <span className={`text-[9px] font-bold uppercase tracking-widest ${isMale ? "text-sky-400" : "text-rose-400"}`}>
                {isMale ? "♂ Nam" : "♀ Nữ"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lower Body (Relationships) ── */}
      <div className="px-4 pb-3 space-y-1.5 relative z-10">
        {hasRelationships ? (
          <div className="space-y-1 pt-3 border-t border-white/5">
            {fathers.map(f => (
              <RelChip key={f.id} label="Cha" name={f.fullName} color="sky" isAlive={f.isAlive} icon="♂" />
            ))}
            {mothers.map(m => (
              <RelChip key={m.id} label="Mẹ" name={m.fullName} color="pink" isAlive={m.isAlive} icon="♀" />
            ))}
            {wives.map((w, i) => (
              <RelChip key={w.id} label={getSpouseTitle(i, member.gender)} name={w.fullName} color="rose" isAlive={w.isAlive} icon="♀" />
            ))}
            {husbands.map(h => (
              <RelChip key={h.id} label="Chồng" name={h.fullName} color="amber" isAlive={h.isAlive} icon="♂" />
            ))}
          </div>
        ) : (
          <div className="h-4" /> // Spacer
        )}

        {children.length > 0 && (
          <div className="flex items-center gap-1.5 pt-1">
            <Heart className="w-3 h-3 text-rose-500/30" />
            <span className="text-[10px] text-white/20 font-medium italic">
              {children.length} người con
            </span>
          </div>
        )}
      </div>

      {/* ── Floating Actions ── */}
      <div className="mt-auto px-4 py-2 border-t border-white/5 bg-black/40 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300">
        <button
          onClick={e => { e.stopPropagation(); onViewTree(member.id); }}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold text-white/30 hover:text-secondary hover:bg-secondary/10 transition-all cursor-pointer"
        >
          <Network className="w-3 h-3" /> Cây
        </button>
        <div className="flex items-center gap-1">
          {canEdit && (
            <>
              <button
                onClick={e => { e.stopPropagation(); onEdit?.(member.id); }}
                className="p-1.5 rounded-lg text-white/30 hover:text-secondary hover:bg-secondary/10 transition-all cursor-pointer"
                title="Chỉnh sửa"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete?.(member.id); }}
                className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-900/20 transition-all cursor-pointer"
                title="Xóa khỏi gia phả"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── RelChip sub-component ─────────────────────────────────────────────────────
function RelChip({ label, name, color, isAlive, icon }: {
  label: string;
  name: string;
  color: "sky" | "pink" | "rose" | "amber";
  isAlive: boolean;
  icon: string;
}) {
  const colors = {
    sky:   "bg-sky-500/10 text-sky-400 border-sky-500/20",
    pink:  "bg-pink-500/10 text-pink-400 border-pink-500/20",
    rose:  "bg-rose-500/10 text-rose-400 border-rose-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  
  return (
    <div className="flex items-center justify-between group/rel">
      <div className="flex items-center gap-2 min-w-0">
        <span className={`shrink-0 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${colors[color]}`}>
          {label}
        </span>
        <span className="text-[11px] text-[#E2D1B0]/70 truncate font-medium">
          {icon} {name}
        </span>
      </div>
      
      {!isAlive ? (
        <span className="shrink-0 px-1.5 py-0.5 rounded bg-white/5 text-[8px] font-bold text-white/30 tracking-tight uppercase group-hover/rel:bg-white/10 transition-colors">
          Tạ Thế
        </span>
      ) : (
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 mr-1 group-hover/rel:bg-emerald-500/70 transition-colors" />
      )}
    </div>
  );
}
