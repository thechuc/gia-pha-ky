"use client";

import React, { useEffect, useState } from "react";
import { getUpcomingAnniversaries, AnniversaryItem, lightIncenseAction } from "@/app/actions/events";
import { Clock, CalendarDays, Flame, UserCircle2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { IncenseEffect } from "./IncenseEffect";

export function UpcomingDeathAnniversaries() {
  const [data, setData] = useState<AnniversaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [litMembers, setLitMembers] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const items = await getUpcomingAnniversaries(4, true);
      setData(items);
      setLoading(false);
      
      // Initialize lit members from DB data
      const now = new Date();
      const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      
      const alreadyLit = items
        .filter(item => item.lastIncenseLitAt && new Date(item.lastIncenseLitAt) > twelveHoursAgo)
        .map(item => item.memberId);
      
      setLitMembers(new Set(alreadyLit));
    }
    load();
  }, []);

  const handleLightIncense = async (memberId: string) => {
    if (litMembers.has(memberId)) return;
    
    // Optimistic UI
    setLitMembers(prev => new Set([...Array.from(prev), memberId]));
    
    // Server action
    const result = await lightIncenseAction(memberId);
    if (!result.success) {
      // Rollback on error if needed
      setLitMembers(prev => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
    }
  };

  if (loading) return (
    <div className="bg-[#140C0C]/80 backdrop-blur-3xl rounded-[32px] border border-white/5 overflow-hidden">
      <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
        <div className="skeleton-dark h-6 w-40 rounded-lg" />
        <div className="skeleton-dark h-6 w-24 rounded-full" />
      </div>
      <div className="p-5 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl p-4 border border-white/5">
            <div className="flex items-start gap-4">
              <div className="skeleton-dark w-12 h-12 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton-dark h-4 w-3/4 rounded" />
                <div className="skeleton-dark h-3 w-1/2 rounded" />
                <div className="skeleton-dark h-3 w-2/3 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!data?.length) return null;

  return (
    <div className="bg-[#140C0C]/80 backdrop-blur-3xl rounded-[32px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden relative border border-white/5 group/anniv">
      {/* Texture Layer - subtle gold dust */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(212,175,55,0.06)_0%,_transparent_50%)] pointer-events-none"></div>
      
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/5 relative z-10 flex items-center justify-between bg-[#1A0F0F]/40">
        <h3 className="font-serif font-bold text-secondary text-xl flex items-center gap-3 drop-shadow-lg tracking-wide uppercase">
          <span className="group-hover/anniv:animate-glow-rose transition-all">
            <Flame className="w-6 h-6 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
          </span>
          Ngày Giỗ Cận Kề
        </h3>
        <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 shadow-inner">
          <span className="text-[10px] text-secondary/40 font-black uppercase tracking-[0.2em] whitespace-nowrap">
            Di huấn tổ tiên
          </span>
        </div>
      </div>

      {/* List */}
      <div className="p-5 space-y-4 relative z-10">
        <AnimatePresence>
          {data.map((item, idx) => {
            const isLit = litMembers.has(item.memberId);
            
            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, type: 'spring', stiffness: 200 }}
                key={item.memberId}
                className="group block relative overflow-hidden bg-black/40 hover:bg-black/60 border border-white/5 hover:border-amber-500/40 rounded-2xl p-4 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
              >
                {/* Incense animation background if lit */}
                {isLit && <IncenseEffect />}

                <div className="relative z-10 flex items-start gap-4">
                  <div className="relative">
                    <div className={`w-14 h-14 shrink-0 rounded-2xl bg-white/5 border-2 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:scale-105 ${
                      isLit ? 'border-amber-500 shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'border-white/10'
                    }`}>
                      {item.avatar ? (
                        <img src={item.avatar} alt={item.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle2 className="w-8 h-8 text-white/30" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-serif font-bold text-amber-50 text-base group-hover:text-amber-400 transition-colors line-clamp-1">
                        {item.fullName}
                      </h4>
                      <span className="shrink-0 text-[10px] uppercase font-black tracking-[0.1em] text-secondary bg-secondary/10 px-2 py-0.5 rounded-lg border border-secondary/20 shadow-sm">
                        Đời {item.generation}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs text-[#E2D1B0]/70 flex items-center gap-2 font-medium">
                        <CalendarDays className="w-3.5 h-3.5 text-secondary/60" />
                        {item.formattedLunar}
                      </p>
                      <p className="text-[11px] text-[#E2D1B0]/40 flex items-center gap-2 italic">
                        <Clock className="w-3 h-3 text-white/20" />
                        Dương lịch: <span className="text-secondary/60 font-medium">{item.formattedSolar}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="relative z-10 mt-5 pt-4 border-t border-white/5 flex justify-between items-center">
                  <div className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-widest border transition-colors ${
                    item.isToday
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : item.isTomorrow
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-white/5 text-secondary/30 border-white/10'
                  }`}>
                    {item.isToday ? 'Chính Kỵ' : item.isTomorrow ? 'Tiên Thường' : `Còn ${item.daysLeft} ngày`}
                  </div>

                  <button
                    onClick={() => handleLightIncense(item.memberId)}
                    disabled={isLit}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold transition-all duration-300 ${
                      isLit 
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 cursor-default'
                        : 'bg-secondary text-primary hover:bg-white hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] active:scale-95'
                    }`}
                  >
                    {isLit ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        Đã thắp nhang
                      </>
                    ) : (
                      <>
                        <Flame className="w-3.5 h-3.5" />
                        Thắp nhang tưởng nhớ
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      {/* Footer Quote */}
      <div className="px-8 py-4 bg-[#140C0C]/40 border-t border-white/5 text-center">
        <p className="text-[9px] text-[#E2D1B0]/20 font-black uppercase tracking-[0.2em] italic">
          Nguyện cầu anh linh tiên tổ chứng giám lòng thành ✦
        </p>
      </div>
    </div>
  );
}
