"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Calendar, 
  Clock, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Video,
  FileText,
  Plus,
  Trash2,
  Loader2,
  Trash,
  Maximize2,
  Minimize2
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { FamilyEvent } from "@/types/family";
import { RenderIcon } from "../dashboard/IconRegistry";
import { updateEvent } from "@/app/actions/family";
import dynamic from "next/dynamic";

const LegacyPdfViewer = dynamic(() => import("../dashboard/LegacyPdfViewer"), { ssr: false });
const LegacyImageViewer = dynamic(() => import("../dashboard/LegacyImageViewer"), { ssr: false });

interface EventDetailModalProps {
  event: FamilyEvent | null;
  onClose: () => void;
  onUpdate?: (updatedEvent: FamilyEvent) => void;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  founding: "Khởi tạo",
  education: "Khoa bảng",
  achievement: "Công trạng",
  heritage: "Di sản",
  contribution: "Đóng góp",
  war: "Binh nghiệp",
  birth: "Khai sinh",
  custom: "Sự kiện",
};

export function EventDetailModal({ event, onClose, onUpdate }: EventDetailModalProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [localMedia, setLocalMedia] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = React.useRef<HTMLDivElement>(null);

  // Sync fullscreen state
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    if (event) {
      setLocalMedia(event.media || []);
      setCurrentMediaIndex(0);
    }
  }, [event]);

  if (!event) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUpdating(true);
    const newUploadedMedia = [...localMedia];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) {
          newUploadedMedia.push({
            url: data.url,
            name: data.name,
            type: data.type.startsWith('image/') ? 'IMAGE' : data.type.startsWith('video/') ? 'VIDEO' : 'DOCUMENT'
          });
        }
      } catch (error) {
        console.error("Upload failed:", error);
      }
    }

    // Sync to DB
    try {
      const updated = await updateEvent(event.id!, { media: newUploadedMedia });
      if (updated) {
        const updatedEvent = { ...event, media: newUploadedMedia };
        setLocalMedia(newUploadedMedia);
        onUpdate?.(updatedEvent);
      }
    } catch (err) {
      console.error("Failed to update event media:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveMedia = async (index: number) => {
    const newMedia = localMedia.filter((_, i) => i !== index);
    setIsUpdating(true);
    
    try {
      const updated = await updateEvent(event.id!, { media: newMedia });
      if (updated) {
        const updatedEvent = { ...event, media: newMedia };
        setLocalMedia(newMedia);
        if (currentMediaIndex >= newMedia.length) {
          setCurrentMediaIndex(Math.max(0, newMedia.length - 1));
        }
        onUpdate?.(updatedEvent);
      }
    } catch (err) {
      console.error("Failed to remove media:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const activeMedia = localMedia[currentMediaIndex];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-[#1A0F0F] rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col md:flex-row overflow-hidden border border-white/10 w-[1200px] max-w-full h-[800px] max-h-full"
        >
          {/* Close Button Mobile */}
          <button onClick={onClose} className="absolute top-6 right-6 z-50 md:hidden w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-secondary/40 hover:text-secondary transition-all border border-white/10 shadow-2xl"><X className="w-6 h-6" /></button>
 
          {/* --- LEFT SIDE: Event Info (Heritage Story) --- */}
          <div className="w-full md:w-[400px] shrink-0 h-full bg-[#140C0C] relative overflow-hidden flex flex-col border-r border-white/5 shadow-2xl">
            {/* Ambient decorations */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full -ml-32 -mt-32 blur-3xl pointer-events-none" />
            
            {/* Sticky Header - Fixed Height for alignment */}
            <div className="px-6 h-20 border-b border-white/5 bg-[#140C0C]/80 backdrop-blur-xl relative z-20 shrink-0 flex items-center">
              <div className="flex items-center gap-4 w-full">
                <motion.div 
                  initial={{ rotate: -5, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shadow-lg text-secondary transition-all hover:scale-105"
                >
                  <RenderIcon name={event.iconName} className="w-6 h-6" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[8px] font-black text-secondary/40 uppercase tracking-[0.2em] mb-1">
                    <Sparkles className="w-3 h-3" />
                    {EVENT_TYPE_LABELS[event.type] || "Sự kiện"}
                  </div>
                  <h2 className="text-lg font-serif font-black text-secondary leading-tight truncate drop-shadow-lg">{event.title}</h2>
                </div>
                {isUpdating && <Loader2 className="w-4 h-4 text-secondary animate-spin opacity-50 shrink-0" />}
              </div>
            </div>

            {/* Scrollable Body - Reduced Spacing */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 custom-scrollbar">


              {/* Info Grid - Reduced Detail Size */}
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 shadow-inner">
                  <div className="w-9 h-9 rounded-lg bg-secondary/5 border border-secondary/10 flex items-center justify-center text-secondary/60 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-secondary/30 uppercase tracking-widest mb-0.5">Thời điểm</p>
                    <p className="text-sm font-bold text-secondary">{event.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 shadow-inner">
                  <div className="w-9 h-9 rounded-lg bg-secondary/5 border border-secondary/10 flex items-center justify-center text-secondary/60 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-secondary/30 uppercase tracking-widest mb-0.5">Thời kỳ</p>
                    <p className="text-sm font-bold text-secondary">{event.era}</p>
                  </div>
                </div>
              </div>

              {/* Description / Story - Reduced Padding */}
              <div className="space-y-3">
                <h4 className="text-[9px] font-black text-secondary/30 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                   Sử ký chi tiết
                </h4>
                <div className="p-5 rounded-[24px] bg-[#1a0f0f] border border-secondary/5 shadow-inner relative overflow-hidden group">
                  <p className="text-sm text-secondary/80 leading-relaxed italic relative z-10 font-medium whitespace-pre-line">
                    {event.description}
                  </p>
                </div>
              </div>

              {/* Media Thumbnails & Edit actions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <h4 className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.2em]">
                     Tư liệu ({localMedia.length})
                  </h4>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {localMedia.map((item, idx) => (
                    <div key={idx} className="relative group/thumb">
                      <button
                        onClick={() => setCurrentMediaIndex(idx)}
                        className={`w-14 h-14 rounded-xl border flex items-center justify-center overflow-hidden transition-all ${
                          currentMediaIndex === idx 
                            ? "border-secondary ring-2 ring-secondary/20 scale-105" 
                            : "border-white/5 opacity-50 hover:opacity-100"
                        }`}
                      >
                        {item.type === 'IMAGE' ? (
                          <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="bg-white/5 w-full h-full flex items-center justify-center text-secondary">
                            {item.type === 'VIDEO' ? <Video className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                          </div>
                        )}
                      </button>
                    </div>
                  ))}
                  {localMedia.length === 0 && (
                    <div className="w-full py-6 rounded-2xl border border-dashed border-white/5 flex flex-col items-center justify-center text-secondary/20">
                      <ImageIcon className="w-6 h-6 mb-2" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Chưa có tư liệu</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Footer - Further Reduced Padding */}
            <div className="py-4 border-t border-white/5 bg-[#0d0d0d] relative z-10">
              <div className="flex items-center justify-center gap-4 text-[7px] font-black text-secondary/20 uppercase tracking-[0.3em] select-none">
                Bản ghi Sử ký Gia tộc
              </div>
            </div>
          </div>

          {/* --- RIGHT SIDE: Media Viewer --- */}
          <div ref={viewerRef} className="flex-1 h-full bg-[#080808] relative flex flex-col overflow-hidden">
            {/* Viewer Header - Exactly matched height with Left Side */}
            <div className={`px-8 h-20 border-b border-white/5 bg-[#080808]/80 backdrop-blur-xl flex items-center justify-between z-10 shrink-0 ${isFullscreen ? 'hidden' : 'flex'}`}>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-secondary/60 uppercase tracking-[0.3em] mb-0.5">Tư liệu sự kiện</span>
                <span className="text-[9px] font-bold text-white/20 uppercase truncate max-w-[300px]">
                   {activeMedia ? activeMedia.name : "Không có tệp đính kèm"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {localMedia.length > 1 && (
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1">
                    <button 
                      onClick={() => setCurrentMediaIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentMediaIndex === 0}
                      className="p-1.5 text-secondary/30 hover:text-secondary disabled:opacity-5 transition-all outline-none"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[9px] font-black text-secondary/40 w-10 text-center select-none tracking-widest">
                      {currentMediaIndex + 1} <span className="opacity-20">/</span> {localMedia.length}
                    </span>
                    <button 
                      onClick={() => setCurrentMediaIndex(prev => Math.min(localMedia.length - 1, prev + 1))}
                      disabled={currentMediaIndex === localMedia.length - 1}
                      className="p-1.5 text-secondary/30 hover:text-secondary disabled:opacity-5 transition-all outline-none"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <button 
                  onClick={toggleFullscreen}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-secondary/40 hover:bg-white/10 hover:text-secondary transition-all border border-white/5 shadow-xl"
                  title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all border border-secondary/20 flex items-center justify-center shadow-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Display Area */}
            <div className="flex-1 p-4 md:p-8 flex flex-col overflow-hidden">
              <div className="flex-1 w-full bg-[#050505] rounded-[40px] border border-white/5 shadow-inner relative overflow-hidden flex items-center justify-center group/viewer">
                {!activeMedia ? (
                  <div className="flex flex-col items-center justify-center text-secondary/10 space-y-4">
                     <ImageIcon className="w-10 h-10 opacity-20" />
                     <p className="text-[10px] font-black uppercase tracking-[0.3em]">Không có hình ảnh tư liệu</p>
                  </div>
                ) : (
                  <div className="w-full h-full p-4 relative">
                    {activeMedia.type === 'IMAGE' ? (
                      <LegacyImageViewer 
                        url={activeMedia.url} 
                        alt={activeMedia.name}
                        currentIndex={currentMediaIndex}
                        totalCount={localMedia.length}
                        onNext={() => setCurrentMediaIndex(prev => Math.min(localMedia.length - 1, prev + 1))}
                        onPrev={() => setCurrentMediaIndex(prev => Math.max(0, prev - 1))}
                        isFullscreen={isFullscreen}
                        onToggleFullscreen={toggleFullscreen}
                      />
                    ) : activeMedia.type === 'VIDEO' ? (
                      <video 
                        key={activeMedia.url}
                        src={activeMedia.url} 
                        controls 
                        playsInline
                        preload="metadata"
                        className="w-full h-full rounded-2xl bg-black"
                      />
                    ) : (
                      <div className="w-full h-full">
                        {activeMedia.url.toLowerCase().endsWith('.pdf') ? (
                          <div className="w-full h-full">
                            <LegacyPdfViewer 
                              url={activeMedia.url} 
                              name={activeMedia.name} 
                              currentIndex={currentMediaIndex}
                              totalCount={localMedia.length}
                              onNext={() => setCurrentMediaIndex(prev => Math.min(localMedia.length - 1, prev + 1))}
                              onPrev={() => setCurrentMediaIndex(prev => Math.max(0, prev - 1))}
                              isFullscreen={isFullscreen}
                              onToggleFullscreen={toggleFullscreen}
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center space-y-6">
                            <FileText className="w-16 h-16 text-secondary/40" />
                            <p className="text-secondary font-bold text-sm">{activeMedia.name}</p>
                            <a href={activeMedia.url} target="_blank" rel="noreferrer" className="px-6 py-2 bg-secondary text-primary rounded-xl font-bold text-[10px] uppercase tracking-widest">Xem tài liệu</a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Delete Event in Viewer if needed (Alternative to list) */}
            <div className="absolute bottom-10 right-10 flex gap-4">
               {/* Could add a delete event button here too */}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
