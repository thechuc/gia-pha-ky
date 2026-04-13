"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  History, 
  MapPin, 
  Clock, 
  Sparkles, 
  ArrowRight,
  ImageIcon,
  Video,
  FileText,
  Trash2,
  Edit2
} from "lucide-react";
import { RenderIcon } from "./IconRegistry";

interface TimelineEvent {
  id?: string;
  date: string;
  isoDate?: string;
  era: string;
  title: string;
  description: string;
  iconName: string;
  type: string;
  media?: {
    url: string;
    name: string;
    type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  }[];
}

const EVENT_TYPE_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  founding: { bg: "bg-amber-500/10", text: "text-amber-500", ring: "ring-amber-500/20" },
  education: { bg: "bg-blue-500/10", text: "text-blue-500", ring: "ring-blue-500/20" },
  achievement: { bg: "bg-emerald-500/10", text: "text-emerald-500", ring: "ring-emerald-500/20" },
  heritage: { bg: "bg-yellow-500/10", text: "text-yellow-500", ring: "ring-yellow-500/20" },
  contribution: { bg: "bg-rose-500/10", text: "text-rose-500", ring: "ring-rose-500/20" },
  war: { bg: "bg-slate-500/10", text: "text-slate-500", ring: "ring-slate-500/20" },
  birth: { bg: "bg-pink-500/10", text: "text-pink-500", ring: "ring-pink-500/20" },
  custom: { bg: "bg-primary/10", text: "text-primary", ring: "ring-primary/20" },
};

export function FamilyTimeline({ events, onEventClick, onDeleteClick, onEditClick }: { 
  events: TimelineEvent[]; 
  onEventClick?: (event: TimelineEvent) => void;
  onDeleteClick?: (id: string) => void;
  onEditClick?: (event: TimelineEvent) => void;
}) {
  if (!events || events.length === 0) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-secondary/20 border border-dashed border-white/10">
          <History className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <p className="text-secondary/40 font-serif italic text-lg">Hành trình lịch sử đang chờ được ghi chép</p>
          <p className="text-secondary/20 text-sm">Hãy thêm những cột mốc đầu tiên cho dòng họ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-12 pb-12">
      {/* Vertical Line */}
      <div className="absolute left-[31px] md:left-[147px] top-4 bottom-0 w-[2px] bg-gradient-to-b from-secondary/30 via-secondary/10 to-transparent"></div>

      {events.map((event, index) => {
        const style = EVENT_TYPE_STYLES[event.type] || EVENT_TYPE_STYLES.custom;
        
        return (
          <motion.div
            key={event.id || index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: index * 0.05 }}
            className="relative flex flex-col md:flex-row items-start gap-6 md:gap-12 group"
          >
            {/* Date Column (Desktop) */}
            <div className="hidden md:flex flex-col items-end w-24 pt-2 shrink-0">
              <span className="text-sm font-black text-secondary/80 tracking-widest">{event.date}</span>
              <span className="text-[10px] font-bold text-secondary/30 uppercase tracking-[0.2em]">{event.era}</span>
            </div>

            {/* Icon Node */}
            <div className="relative z-10 pt-1">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-secondary/20 bg-[#140C0C] ${
                  index === 0
                    ? "ring-2 ring-secondary/30 group-hover:ring-secondary/60"
                    : "ring-4 ring-white/5"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${style.bg} ${style.text} border border-current/10 shadow-inner`}>
                  <RenderIcon name={event.iconName} className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Content Card */}
            <div className="flex-1 min-w-0 pt-0 md:pt-1">
              <div 
                onClick={() => onEventClick?.(event)}
                className="bg-[#1A0F0F]/60 backdrop-blur-md rounded-[24px] border border-white/5 p-5 shadow-2xl group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:border-secondary/30 group-hover:-translate-y-1 relative overflow-hidden cursor-pointer"
              >
                {/* Floating Action Buttons */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  {onEditClick && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditClick(event);
                      }}
                      className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary hover:text-primary transition-all flex items-center justify-center shadow-lg"
                      title="Chỉnh sửa sự kiện"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {onDeleteClick && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClick(event.id!);
                      }}
                      className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-lg"
                      title="Xóa sự kiện"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Mobile Date Header */}
                <div className="md:hidden flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-lg bg-secondary/10 text-secondary text-[10px] font-bold">{event.date}</span>
                  <span className="text-[10px] text-secondary/30 font-bold uppercase tracking-wider">{event.era}</span>
                </div>

                <div className="flex justify-between items-start gap-4 mb-2">
                  <h3 className="text-xl font-serif font-bold text-secondary group-hover:text-white transition-colors leading-tight drop-shadow-md pr-8">
                    {event.title}
                  </h3>
                </div>

                <p className="text-[#E2D1B0]/70 text-sm leading-relaxed mb-2 italic font-medium line-clamp-3">
                  {event.description}
                </p>

                <div className="flex items-center justify-end mt-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    className="flex items-center gap-1.5 text-[11px] font-black text-secondary tracking-widest uppercase group/more hover:text-white transition-colors cursor-pointer"
                  >
                    Chi tiết bản ghi
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/more:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
