import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Heart, Send, CalendarDays, History } from "lucide-react";
import type { MemorialMember } from "@/app/actions/memorial";
import { addMemorialComment } from "@/app/actions/memorial";
import { lightIncenseAction } from "@/app/actions/events";
import { format } from "date-fns";
import { IncenseEffect } from "@/components/dashboard/IncenseEffect";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";

interface MemorialDetailModalProps {
  member: MemorialMember | null;
  onClose: () => void;
  onRefresh: () => void;
}

export function MemorialDetailModal({ member, onClose, onRefresh }: MemorialDetailModalProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [isLighting, setIsLighting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of comments when opened or new comment added
  useEffect(() => {
    if (member?.comments) {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [member?.comments]);

  if (!member) return null;

  const hasActiveIncense = member.lastIncenseLitAt && 
    (new Date().getTime() - new Date(member.lastIncenseLitAt).getTime() < 12 * 60 * 60 * 1000);

  const handleLightIncense = async () => {
    if (isLighting) return;
    setIsLighting(true);
    try {
      await lightIncenseAction(member.id);
      showToast("Đã dâng hương thành công.", "success");
      onRefresh();
    } catch (err) {
      console.error(err);
      showToast("Có lỗi xảy ra khi dâng hương.", "error");
    } finally {
      setIsLighting(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    setIsSubmitting(true);
    try {
      const authorName = session?.user?.name || "Thành viên gia tộc";
      await addMemorialComment(member.id, authorName, commentText);
      setCommentText("");
      showToast("Đã gửi lời tưởng nhớ.", "success");
      onRefresh();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Lỗi khi gửi lời tưởng nhớ.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0E0808]/90 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-[#140C0C] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh]"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/40 text-white/60 hover:text-white hover:bg-black/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Column: Portrait & Incense */}
          <div className="w-full md:w-1/2 relative bg-gradient-to-b from-[#2A1818] to-[#140C0C] flex flex-col items-center justify-center min-h-[400px] border-r border-white/5">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay" />
            
            <div className="relative z-10 flex flex-col items-center p-4 h-full justify-between overflow-hidden">
              {/* Portrait Frame (Thu nhỏ để tránh tràn) */}
              <div className="relative w-36 h-48 rounded-xl border-[6px] border-[#2A1818] shadow-2xl bg-[#0E0808] overflow-hidden">
                 {member.avatar ? (
                   <img src={member.avatar} alt={member.fullName} className="w-full h-full object-cover filter contrast-125 saturate-50" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center bg-[#1E1111]">
                     <span className="font-serif text-6xl text-[#E2D1B0]/20 font-bold">{member.fullName.charAt(0)}</span>
                   </div>
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              </div>
              
              {/* Name Block */}
              <div className="mt-8 text-center space-y-2">
                <h2 className="font-serif text-3xl font-bold text-[#F9F5EB] drop-shadow-lg">
                  {member.fullName}
                </h2>
                <div className="text-sm font-bold text-[#E2D1B0]/60 tracking-[0.2em] uppercase">
                  Đầu tôn đời {member.generation}
                </div>
                <div className="text-[#E2D1B0]/40 text-sm">
                  {member.birthYear || "?"} — {member.deathYear || "?"}
                </div>
              </div>

              {/* Incense Action (Gọn gàng hơn) */}
              <div className="mt-2 relative w-full h-[320px] flex flex-col items-center">
                  <div className="absolute inset-0 overflow-visible">
                    <IncenseEffect 
                      litSticks={member.metadata?.incenseSticks || []} 
                      isPlacing={isLighting}
                      interactiveMode={true}
                      onPlant={handleLightIncense}
                    />
                  </div>
                  
                  {/* Subtle Instruction */}
                  <div className="absolute bottom-4 pointer-events-none">
                    <p className="text-[10px] text-orange-400/40 uppercase tracking-[0.2em] font-medium animate-pulse">
                      Di chuyển & click vào bát hương để dâng nén tâm hương
                    </p>
                  </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bio & Comments */}
          <div className="w-full md:w-1/2 flex flex-col bg-[#1A0F0F]">
            {/* Bio Section */}
            {member.biography && (
              <div className="p-6 border-b border-white/5 bg-[#201313]/50 shrink-0">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#E2D1B0]/70 uppercase tracking-widest mb-3">
                  <History className="w-4 h-4" /> Tiểu sử
                </h3>
                <p className="text-sm text-[#F9F5EB]/70 leading-relaxed italic line-clamp-4 hover:line-clamp-none transition-all duration-500">
                  "{member.biography}"
                </p>
              </div>
            )}

            {/* Comments List */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#E2D1B0]/70 uppercase tracking-widest sticky top-0 bg-[#1A0F0F] py-2 z-10 border-b border-white/5">
                <Heart className="w-4 h-4 text-rose-500/70" /> Lời Tưởng Nhớ ({member.comments.length})
              </h3>
              
              {member.comments.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                   <Flame className="w-8 h-8 text-[#E2D1B0]/20 mx-auto mb-3" />
                   <p className="text-sm text-[#E2D1B0]/60">Chưa có lời tưởng nhớ nào.</p>
                   <p className="text-xs text-[#E2D1B0]/40 mt-1">Hãy là người đầu tiên dâng lời tri ân.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Since they are sorted desc, let's reverse them so newest is at bottom, or keep desc depending on preference. Usually chat style is newest at bottom. Let's map backwards. */}
                  {[...member.comments].reverse().map((comment) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={comment.id} 
                      className="bg-[#2A1818]/30 rounded-xl p-4 border border-white/5"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-[#F9F5EB] text-sm">{comment.authorId}</span>
                        <span className="text-[10px] text-[#E2D1B0]/40 uppercase tracking-wider">
                          {format(new Date(comment.createdAt), "dd/MM/yyyy")}
                        </span>
                      </div>
                      <p className="text-sm text-[#E2D1B0]/70 leading-relaxed">
                        {comment.content}
                      </p>
                    </motion.div>
                  ))}
                  <div ref={commentsEndRef} />
                </div>
              )}
            </div>

            {/* Comment Input */}
            <div className="p-4 bg-[#140C0C] border-t border-white/10 shrink-0">
              <form onSubmit={handleSubmitComment} className="relative">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Gửi lời tưởng nhớ, tri ân..."
                  className="w-full bg-[#201313] text-[#F9F5EB] placeholder-[#E2D1B0]/30 border border-white/10 rounded-xl py-3 px-4 pr-12 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 resize-none min-h-[80px]"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !commentText.trim()}
                  className="absolute right-3 bottom-4 p-2 rounded-lg bg-orange-500 text-white disabled:opacity-50 disabled:bg-white/10 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
