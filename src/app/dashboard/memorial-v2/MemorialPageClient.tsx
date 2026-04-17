"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Wind } from "lucide-react";
import type { MemorialMember } from "@/app/actions/memorial";
import { MemorialCard } from "@/components/memorial/MemorialCard";
import { useRouter } from "next/navigation";

interface MemorialPageClientProps {
  initialMembers: MemorialMember[];
}

export default function MemorialPageClient({ initialMembers }: MemorialPageClientProps) {
  const router = useRouter();

  // Group members by generation
  const groupedMembers = useMemo(() => {
    const groups: { [key: number]: MemorialMember[] } = {};
    initialMembers.forEach((m) => {
      if (!groups[m.generation]) groups[m.generation] = [];
      groups[m.generation].push(m);
    });
    return groups;
  }, [initialMembers]);

  // Sort generations
  const generations = Object.keys(groupedMembers).map(Number).sort((a, b) => a - b);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleNavigateToAltar = (memberId: string) => {
    router.push('/dashboard/memorial-v2?id=' + encodeURIComponent(memberId));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0E0808] pb-20 relative">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#1A0F0F] to-transparent opacity-80" />
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-amber-900/10 blur-[120px]" />
         <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] rounded-full bg-rose-900/5 blur-[100px]" />
      </div>

      {/* Header Hero Section */}
      <div className="relative pt-16 pb-12 mb-8 border-b border-white/5 z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E1111] to-[#140C0C] border border-[#2A1818] flex items-center justify-center shadow-2xl relative"
          >
            <div className="absolute inset-0 bg-orange-500/10 blur-xl rounded-full animate-pulse" />
            <Flame className="w-8 h-8 text-orange-500/80 drop-shadow-[0_0_10px_rgba(249,115,22,0.6)] animate-pulse" />
          </motion.div>
          
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-serif font-black text-[#F9F5EB] tracking-tight drop-shadow-2xl">
              Tường Tưởng Niệm
            </h1>
            <p className="text-[#E2D1B0]/50 text-sm md:text-base leading-relaxed tracking-wide font-medium">
              &quot;Cây có gốc mới nở cành xanh ngọn, nước có nguồn mới biển rộng sông sâu.&quot;<br/>
              Nơi tôn vinh và gửi gắm những lời tri ân thiêng liêng đến ông bà tổ tiên và các thành viên đã khuất trong dòng họ.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 space-y-16">
        {initialMembers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center">
            <Wind className="w-12 h-12 text-[#E2D1B0]/10" />
            <p className="text-[#E2D1B0]/40 font-medium italic">Không có dữ liệu thành viên đã khuất.</p>
          </div>
        ) : (
          generations.map((gen) => (
            <motion.section 
               key={gen}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               className="space-y-8"
            >
              {/* Generation divider */}
              <div className="flex items-center gap-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-500/20" />
                <h2 className="text-lg md:text-xl font-serif font-bold text-amber-500/80 tracking-[0.3em] uppercase">
                  Đời Thứ {gen}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-500/20" />
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {groupedMembers[gen].map((member, index) => (
                  <MemorialCard 
                    key={member.id} 
                    member={member} 
                    index={index} 
                    onNavigateToAltar={handleNavigateToAltar}
                    onRefresh={handleRefresh}
                  />
                ))}
              </div>
            </motion.section>
          ))
        )}
      </div>
    </div>
  );
}
