"use client";

import React from "react";
import {
  User,
  MapPin,
  Briefcase,
  Edit3,
  Trash2,
  Network,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Member } from "@/types/member";

interface MemberListItemProps {
  member: Member;
  index: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewTree: (id: string) => void;
  branchName?: string;
}

export function MemberListItem({ member, index, onEdit, onDelete, onViewTree, branchName: propBranchName }: MemberListItemProps) {
  const isMale = member.gender === "MALE";
  const branchName = propBranchName || member.branch?.name || member.branchName;

  const birthYear = member.birthYear || (member.dateOfBirth
    ? new Date(member.dateOfBirth).getFullYear()
    : null);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      className="group flex items-center gap-4 px-5 py-2 bg-white rounded-xl border border-border hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 transition-all cursor-pointer"
      onClick={() => onEdit(member.id)}
    >
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 overflow-hidden ${
          isMale
            ? "border-primary/30 bg-primary/5"
            : "border-rose-200 bg-rose-50"
        }`}
      >
        {member.avatar ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={member.avatar} alt={member.fullName} className="w-full h-full object-cover" />
        ) : (
          <User className={`w-4 h-4 ${isMale ? "text-primary/40" : "text-rose-400"}`} />
        )}
      </div>

      {/* Name & Generation */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-black text-foreground truncate group-hover:text-primary transition-colors">
            {member.fullName}
          </h4>
          <span className="shrink-0 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-primary text-secondary border border-secondary/20 shadow-sm">
            Đời {member.generation}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {member.occupation && (
            <span className="flex items-center gap-1 text-[10px] text-foreground/70 font-medium">
              <Briefcase className="w-2.5 h-2.5 text-primary/60" />
              {member.occupation}
            </span>
          )}
          {member.birthPlace && (
            <span className="flex items-center gap-1 text-[10px] text-foreground/60 italic">
              <MapPin className="w-2.5 h-2.5 text-foreground/30" />
              {member.birthPlace}
            </span>
          )}
        </div>
      </div>

      {/* Gender Badge */}
      <span
        className={`shrink-0 px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${
          isMale
            ? "bg-sky-50 border-sky-200 text-sky-700"
            : "bg-rose-50 border-rose-200 text-rose-600"
        }`}
      >
        {isMale ? "Nam" : "Nữ"}
      </span>

      {/* Birth Year */}
      {birthYear && (
        <span className="shrink-0 text-[11px] text-foreground/60 font-bold w-12 text-right">
          {birthYear}
        </span>
      )}

      {/* Status */}
      <div className="shrink-0 flex items-center gap-1.5">
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            member.isAlive
              ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]"
              : "bg-foreground/20"
          }`}
        />
        <span className={`text-[10px] font-bold w-14 ${member.isAlive ? "text-emerald-700" : "text-foreground/40"}`}>
          {member.isAlive ? "Còn sống" : "Đã khuất"}
        </span>
      </div>

      {/* Branch */}
      {branchName && (
        <span className="shrink-0 text-[10px] text-primary/60 font-black uppercase tracking-tighter w-24 truncate">
          {branchName}
        </span>
      )}

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onViewTree(member.id); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-foreground/20 hover:text-secondary hover:bg-primary transition-all shadow-sm border border-transparent hover:border-secondary/20"
          title="Xem trên cây"
        >
          <Network className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(member.id); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-foreground/20 hover:text-secondary hover:bg-amber-700 transition-all shadow-sm border border-transparent hover:border-secondary/20"
          title="Chỉnh sửa"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(member.id); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-foreground/20 hover:text-white hover:bg-rose-700 transition-all shadow-sm border border-transparent hover:border-white/20"
          title="Xóa"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <ChevronRight className="w-4 h-4 text-foreground/10 group-hover:text-primary transition-colors shrink-0" />
    </motion.div>
  );
}
