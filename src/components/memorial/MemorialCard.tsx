import React from "react";
import { motion } from "framer-motion";
import { UserCircle2, Flame, Heart } from "lucide-react";
import type { MemorialMember } from "@/app/actions/memorial";
import { IncenseEffect } from "@/components/dashboard/IncenseEffect";

interface MemorialCardProps {
  member: MemorialMember;
  index: number;
  onNavigateToAltar: (memberId: string) => void;
  onRefresh: () => void;
}

export function MemorialCard({ member, index, onNavigateToAltar, onRefresh }: MemorialCardProps) {
  // We can say a person currently has an active incense if lastIncenseLitAt is within last 12 hours
  const hasActiveIncense = member.lastIncenseLitAt && 
    (new Date().getTime() - new Date(member.lastIncenseLitAt).getTime() < 12 * 60 * 60 * 1000);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onNavigateToAltar(member.id)}
      className="group relative bg-[#1E1111]/80 backdrop-blur-md rounded-2xl border border-white/10 transition-all duration-300 hover:border-amber-500/30 hover:scale-[1.02] cursor-pointer overflow-hidden shadow-xl"
    >
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
      
      <div className="relative p-6 flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-[#140C0C] bg-[#2A1818] shadow-2xl flex items-center justify-center overflow-hidden z-10 relative">
            {member.avatar ? (
              <img src={member.avatar} alt={member.fullName} className="w-full h-full object-cover" />
            ) : (
              <UserCircle2 className="w-12 h-12 text-[#E2D1B0]/40" />
            )}
          </div>
          
          {/* Active Incense Glow */}
          {hasActiveIncense && (
            <div className="absolute -bottom-2 -right-2 z-20">
              <div className="relative w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.5)]">
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1 z-10 w-full relative">
          <h3 className="font-serif font-bold text-lg text-[#F9F5EB] group-hover:text-amber-400 transition-colors">
            {member.fullName}
          </h3>
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#E2D1B0]/50 tracking-wider">
            <span>ĐẦU TÔN ĐỜI {member.generation}</span>
          </div>
          <div className="text-xs text-[#E2D1B0]/40 font-medium">
             {member.birthYear ? member.birthYear : "?"} - {member.deathYear ? member.deathYear : "?"}
          </div>
        </div>

        <div className="w-full pt-4 border-t border-white/5 flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 text-xs text-[#E2D1B0]/40 group-hover:text-[#E2D1B0]/60 transition-colors">
            <Heart className="w-3.5 h-3.5 fill-rose-500/20 text-rose-500/50" />
            <span>{member.comments.length} Lời tưởng nhớ</span>
          </div>
          
          <button 
             className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-widest hover:bg-orange-500/20 transition-colors"
             onClick={(e) => { e.stopPropagation(); onNavigateToAltar(member.id); }}
          >
             Dâng Hương
          </button>
        </div>

        {/* Ambient Incense Effect Background */}
        {(hasActiveIncense || member.metadata?.incenseSticks?.length > 0) && (
          <div className="absolute bottom-0 left-0 right-0 h-48 opacity-30 group-hover:opacity-60 transition-opacity overflow-visible scale-80 origin-bottom">
            <IncenseEffect 
              litSticks={member.metadata?.incenseSticks || []} 
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
