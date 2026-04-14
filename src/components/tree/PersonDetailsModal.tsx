"use client";

import React, { useEffect } from "react";
import { TreeMember } from "./Flow/useFamilyTreeLayout";
import { SpouseInfo } from "@/types/member";
import { X, Calendar, MapPin, User, Heart } from "lucide-react";

interface PersonDetailsModalProps {
  member: TreeMember | null;
  onClose: () => void;
  onAddSpouse?: (member: TreeMember) => void;
  onAddChild?: (member: TreeMember) => void;
}

function getYearStr(d?: string | null): string {
  if (!d) return "Chưa rõ";
  const date = new Date(d);
  return isNaN(date.getFullYear()) ? "Chưa rõ" : date.toLocaleDateString("vi-VN");
}

export function PersonDetailsModal({ member, onClose, onAddSpouse, onAddChild }: PersonDetailsModalProps) {
  // Bấm chốt Esc để tắt modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!member) return null;

  const isMale = member.gender === "MALE";
  const headerColor = isMale ? "bg-slate-800" : "bg-rose-800";
  const badgeColor = isMale ? "bg-slate-100 text-slate-800" : "bg-rose-100 text-rose-800";

  const branchName = member.branch;

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-[#F8FAFC] h-full shadow-2xl flex flex-col transform transition-transform border-l border-slate-300"
        onClick={(e) => e.stopPropagation()} // Chặn buble tắt modal
      >
        {/* Header Ribbon */}
        <div className={`relative px-6 py-8 ${headerColor}`}>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition"
          >
            <X className="w-4 h-4" />
          </button>
          
          {!member.isAlive && (
            <span className="absolute top-6 left-6 px-3 py-1 bg-black/60 text-white text-[10px] uppercase font-bold tracking-widest rounded-md border border-white/20">
              Đã tạ thế
            </span>
          )}

          <div className="mt-6 text-white">
            <h2 className="text-2xl font-serif font-bold">{member.fullName}</h2>
            {(member.alias || member.honorific) && (
              <p className="mt-1 text-white/80 italic font-serif">
                {member.honorific ? `Hiệu: ${member.honorific}` : ""} 
                {member.alias ? ` - Tự: ${member.alias}` : ""}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
               <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeColor}`}>
                 Đời thứ {member.generation}{branchName ? ` - ${branchName}` : ""}
               </span>
               {member.birthOrder ? (
                 <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeColor}`}>
                    Người con thứ {member.birthOrder}
                 </span>
               ) : null}
               {member.title && (
                 <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border border-white/30 text-white flex items-center gap-1">
                   {member.title}
                 </span>
               )}
            </div>
          </div>
        </div>

        {/* Cấu trúc Content scrollable */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Thông tin Cốt lõi */}
          <div className="bg-white p-4 justify-between rounded-xl shadow-sm border border-slate-200 space-y-3">
            <div className="flex items-center gap-3 text-slate-700">
              <User className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Giới tính</p>
                <p className="text-sm font-medium">{isMale ? "Nam giới" : "Nữ giới"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              <div className="flex items-start gap-3 text-slate-700">
                <Calendar className="w-4 h-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sinh ngày</p>
                  <p className="text-sm font-medium">{getYearStr(member.dateOfBirth)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-slate-700">
                <Calendar className="w-4 h-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mất ngày</p>
                  <p className="text-sm font-medium">{!member.isAlive ? getYearStr(member.dateOfDeath) : "--"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Nghề nghiệp / Nơi cư trú */}
          {(member.occupation || member.birthPlace || member.residencePlace) && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
              {member.occupation && (
                <div className="flex items-start gap-3 text-slate-700">
                  <div className="w-4 h-4 mt-1 border-2 border-slate-300 rounded-sm" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nghề nghiệp & Đóng góp</p>
                    <p className="text-sm font-medium">{member.occupation}</p>
                  </div>
                </div>
              )}
              
              {(member.birthPlace || member.residencePlace) && (
                <div className={`flex items-start gap-3 text-slate-700 ${member.occupation ? 'pt-3 border-t border-slate-100' : ''}`}>
                  <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                  <div className="space-y-3 w-full">
                    {member.birthPlace && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nơi sinh (Nguyên Quán)</p>
                        <p className="text-sm font-medium">{member.birthPlace}</p>
                      </div>
                    )}
                    {member.residencePlace && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nơi ở hiện tại</p>
                        <p className="text-sm font-medium">{member.residencePlace}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Thông tin Gia quyến (Vợ/Chồng & Con cái) */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-serif">
                 <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" /> Trạng thái Hôn nhân
               </h3>
               {onAddSpouse && (
                 <button 
                  onClick={() => onAddSpouse(member)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors border border-rose-200"
                 >
                   <Heart className="w-3 h-3" /> Thêm Vợ
                 </button>
               )}
             </div>
             {member.spouses && member.spouses.length > 0 ? (
               <div className="space-y-3 flex-col">
                 {member.spouses.map((wife: SpouseInfo, idx: number) => (
                   <div key={wife.id || idx} className="flex flex-col p-3 rounded-lg border border-slate-100 bg-slate-50 relative">
                     <span className="absolute top-0 left-0 bottom-0 w-1 bg-rose-400 rounded-l-lg" />
                     <div className="flex justify-between items-center ml-2">
                       <span className="font-serif font-bold text-rose-900">{wife.fullName}</span>
                       <span className="text-[10px] px-2 py-0.5 rounded text-rose-800 bg-rose-200/50 uppercase font-black tracking-widest">{wife.rank}</span>
                     </div>
                     <div className="ml-2 mt-1 flex justify-between items-end">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                         Sinh hạ: <span className="text-slate-800 text-xs font-serif">{wife.childCount || 0} người con</span>
                       </span>
                       {!wife.isAlive && <span className="text-[11px] text-slate-500 italic">Đã tạ thế</span>}
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-sm text-slate-500 border border-dashed border-slate-300 p-4 rounded-lg text-center bg-slate-50">
                 Trống / Thiếu dữ liệu mảng gia quyến.
               </p>
             )}

             <div className="mt-5 border-t border-slate-100 pt-4">
               <div className="flex items-center justify-between mb-3">
                 <div>
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Số lượng con cái hệ nội</p>
                   <span className="text-2xl font-black font-serif text-slate-800">{member.childIds?.length || 0}</span> <span className="text-sm text-slate-500 font-medium">người</span>
                 </div>
                 {onAddChild && (
                   <button 
                    onClick={() => onAddChild(member)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                   >
                     <User className="w-3 h-3" /> Thêm Con
                   </button>
                 )}
               </div>
             </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
