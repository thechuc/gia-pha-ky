"use client";

import React from "react";
import { 
  FileText, 
  FileCode, 
  Download, 
  ExternalLink, 
  Trash2, 
  User, 
  Calendar,
  Edit3,
  Eye,
  FileSpreadsheet,
  FileCheck
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { motion } from "framer-motion";

interface DocumentFile {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

interface DocumentCardProps {
  id: string;
  name: string;
  type: string;
  description?: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
  files?: string | DocumentFile[];
  member?: {
    id: string;
    fullName: string;
    avatar?: string | null;
  } | null;
  onView: (id: string) => void;
  onEdit: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export function DocumentCard({
  id,
  name,
  type,
  description,
  url,
  mimeType,
  size,
  createdAt,
  files,
  member,
  onView,
  onEdit,
  onDelete,
}: DocumentCardProps) {
  // Parse files
  const fileList = React.useMemo(() => {
    let list: DocumentFile[] = [];
    try {
      list = typeof files === 'string' 
        ? JSON.parse(files) 
        : (files as DocumentFile[]) || [];
      
      if (list.length === 0 && url) {
        list = [{ url, name, mimeType, size }];
      }
    } catch (e) {
      if (url) list = [{ url, name, mimeType, size }];
    }
    return list;
  }, [files, url, name, mimeType, size]);

  const activeFile = fileList[0] || { url, mimeType, size };
  const totalSize = fileList.reduce((acc, f) => acc + (f.size || 0), 0) || size;
  
  const isImage = activeFile.mimeType?.startsWith("image/");
  const isPdf = activeFile.mimeType === "application/pdf";
  const isWord = activeFile.mimeType?.includes("word") || activeFile.mimeType?.includes("officedocument.wordprocessingml");
  const isExcel = activeFile.mimeType?.includes("excel") || activeFile.mimeType?.includes("spreadsheetml");

  // Calculate human-readable size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const scaleVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    hover: { y: -8, transition: { duration: 0.4, ease: [0.33, 1, 0.68, 1] as const } }
  };

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      whileHover="hover"
      variants={scaleVariants}
      onClick={() => onView(id)}
      className="group bg-[#1A0F0F]/80 backdrop-blur-md rounded-3xl border border-white/5 hover:border-secondary/30 shadow-2xl hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)] transition-all duration-500 overflow-hidden cursor-pointer flex flex-col h-full relative"
    >
      {/* Decorative Corner Element */}
      <div className="absolute top-0 right-0 w-10 h-10 bg-secondary/5 -translate-y-5 translate-x-5 rotate-45 group-hover:bg-secondary/10 transition-colors pointer-events-none" />

      {/* --- Preview / Thumb --- */}
      <div className="relative h-32 bg-[#0D0707] overflow-hidden flex items-center justify-center p-4 border-b border-white/5">
        <div className="scroll-vignette opacity-10" />
        
        {isImage ? (
          <div className="relative w-full h-full overflow-hidden rounded-lg border border-white/10 shadow-lg group-hover:shadow-2xl transition-all duration-500">
            {/* Museum Badge */}
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-white/40 text-[7px] font-bold uppercase tracking-widest z-10">
              ARCHIVAL
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={activeFile.url} 
              alt={name} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
            />
          </div>
        ) : (
          <div className="relative w-12 h-12 rounded-xl bg-white/5 shadow-inner flex items-center justify-center border border-white/10 text-secondary group-hover:rotate-6 transition-transform duration-500">
            {isPdf && <FileText className="w-7 h-7 text-red-500/80" />}
            {isWord && <FileText className="w-7 h-7 text-blue-400/80" />}
            {isExcel && <FileSpreadsheet className="w-7 h-7 text-emerald-400/80" />}
            {!isPdf && !isWord && !isExcel && <FileCode className="w-7 h-7 text-secondary" />}
          </div>
        )}
        
        {/* Type Badge - Ancient Style */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start z-10 transition-transform group-hover:-translate-y-1">
          <div className="px-2 py-0.5 rounded-full bg-primary/20 backdrop-blur-md text-secondary text-[8px] font-black uppercase tracking-[0.1em] shadow-lg border border-secondary/30">
            {type}
          </div>
        </div>

        {/* --- LUXURIOUS HOVER OVERLAY --- */}
        <div className="absolute inset-0 bg-primary/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-4 z-20 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="w-10 h-10 rounded-full border border-secondary/50 flex items-center justify-center mb-3 relative">
              <div className="absolute inset-0 rounded-full border border-secondary animate-ping opacity-20" />
              <Eye className="w-5 h-5 text-secondary" />
            </div>
            <p className="text-[8px] font-black text-secondary uppercase tracking-[0.2em] mb-4 drop-shadow-lg">Chi tiết hồ sơ</p>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(id, e); }}
                className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all border border-white/5"
                title="Sửa"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(id, e); }}
                className="w-8 h-8 rounded-lg bg-red-950/40 text-red-400 flex items-center justify-center hover:bg-red-900/60 hover:scale-110 transition-all border border-red-500/20"
                title="Xóa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* --- CONTENT (ARCHIVAL CARD) --- */}
      <div className="p-4 flex-1 flex flex-col bg-transparent relative">
        <div className="mb-3">
          <h4 className="text-base font-serif font-black text-secondary leading-tight group-hover:text-white transition-colors mb-2 line-clamp-2 min-h-[3rem]">
            {name}
          </h4>
          <p className="text-[11px] text-[#E2D1B0]/50 line-clamp-2 leading-relaxed italic font-medium">
            "{description || "Bản sao lưu trữ di sản gia đình, ghi nhớ công ơn tổ tiên."}"
          </p>
        </div>

        <div className="mt-auto pt-4 flex flex-col gap-3">
          {/* Member mapping */}
          {member && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 p-0.5 group-hover:scale-110 transition-transform">
                <div className="w-full h-full rounded-full bg-[#0D0707] flex items-center justify-center overflow-hidden">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-secondary/40" />
                  )}
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-secondary truncate">{member.fullName}</p>
                <p className="text-[8px] font-bold text-[#E2D1B0]/20 uppercase tracking-widest -mt-0.5">Người lưu giữ</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary/5 text-secondary text-[9px] font-black uppercase tracking-wider border border-secondary/10">
              <Calendar className="w-3 h-3" />
              {format(new Date(createdAt), "dd/MM/yyyy", { locale: vi })}
            </div>
            <div className="text-[8px] font-black text-secondary/20 tracking-widest uppercase">
              ARCHIVE
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
