import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Paperclip, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  Minimize2,
  Calendar, 
  Tag, 
  Info,
  ChevronLeft,
  ChevronRight,
  FileText,
  Video,
  Plus,
  Loader2,
  Sparkles
} from "lucide-react";
import { RenderIcon } from "../dashboard/IconRegistry";
import React, { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { FamilyDocument, DocumentFile } from "@/types/family";

const LegacyPdfViewer = dynamic(() => import("../dashboard/LegacyPdfViewer"), { ssr: false });
const LegacyImageViewer = dynamic(() => import("../dashboard/LegacyImageViewer"), { ssr: false });

const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "text/plain": "txt"
};

export function DocumentDetailModal({ doc, onClose }: { doc: FamilyDocument | null; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [isLocal, setIsLocal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Sync fullscreen state
  useEffect(() => {
    const handleFsChange = () => setFullscreen(!!document.fullscreenElement);
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

  const docName = doc?.name || doc?.title || "Tài liệu";
  
  // Parse files
  const fileList = useMemo(() => {
    if (!doc) return [];
    let list: DocumentFile[] = [];
    try {
      list = typeof doc.files === 'string' 
        ? JSON.parse(doc.files) 
        : (doc.files as DocumentFile[]) || [];
      
      // Fallback to legacy fields if empty
      if (list.length === 0 && doc.url) {
        list = [{
          url: doc.url,
          name: doc.fileName || docName,
          mimeType: doc.mimeType || 'application/octet-stream',
          size: doc.size || 0
        }];
      }
    } catch (e) {
      if (doc.url) {
        list = [{
          url: doc.url,
          name: doc.fileName || docName,
          mimeType: doc.mimeType || 'application/octet-stream',
          size: doc.size || 0
        }];
      }
    }
    return list;
  }, [doc, docName]);

  const isDriveUrl = (url: string | null) => url?.includes('drive.google.com');
  const extractDriveId = (url: string | null): string | null => {
    if (!url) return null;
    const match = url.match(/\/d\/([^/]+)\//) || url.match(/id=([^&]+)/);
    return match ? match[1] : null;
  };

  const activeFile = fileList[currentFileIndex];

  const handleDownload = async (e: React.MouseEvent, fileToDownload = activeFile) => {
    e.preventDefault();
    if (!fileToDownload || !fileToDownload.url) return;
    
    // If it's a Drive URL, use the direct download link
    if (isDriveUrl(fileToDownload.url)) {
      const driveId = extractDriveId(fileToDownload.url);
      if (driveId) {
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
        window.open(downloadUrl, '_blank');
        return;
      }
    }

    const urlParts = fileToDownload.url.split('?')[0].split('.');
    const urlExt = urlParts.length > 1 ? urlParts.pop() : null;
    const extension = MIME_TO_EXT[fileToDownload.mimeType || ""] || urlExt || fileToDownload.mimeType?.split('/').pop() || 'dat';
    
    const cleanFileName = fileToDownload.name || "TaiLieu";
    const finalFileName = cleanFileName.toLowerCase().endsWith(`.${extension.toLowerCase()}`) 
      ? cleanFileName 
      : `${cleanFileName}.${extension}`;

    try {
      const absoluteUrl = fileToDownload.url.startsWith('http') ? fileToDownload.url : window.location.origin + fileToDownload.url;
      const response = await fetch(absoluteUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      
      const blob = await response.blob();
      const finalBlob = new Blob([blob], { type: fileToDownload.mimeType || blob.type });
      const url = window.URL.createObjectURL(finalBlob);
      
      const link = document.createElement("a");
      link.style.display = "none";
      link.href = url;
      link.setAttribute("download", finalFileName);
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 300);
    } catch (error) {
      console.error("Download failed:", error);
      const link = document.createElement("a");
      link.style.display = "none";
      link.href = fileToDownload.url;
      link.setAttribute("download", finalFileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setZoom(1);
    setRotation(0);
    
    if (typeof window !== "undefined") {
      setIsLocal(
        window.location.hostname === "localhost" || 
        window.location.hostname === "127.0.0.1"
      );
    }

    // CƠ CHẾ AN TOÀN: Bắt buộc tắt loading sau 4 giây
    const timer = setTimeout(() => {
      console.log("[Viewer] Safety trigger: Hiding loader after timeout");
      setIsLoading(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [currentFileIndex, doc?.id]); 

  if (!doc || !activeFile) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const isImage = activeFile.mimeType?.startsWith("image/");
  const isPdf = activeFile.mimeType === "application/pdf";
  const isOffice = 
    activeFile.mimeType?.includes("word") || 
    activeFile.mimeType?.includes("excel") || 
    activeFile.mimeType?.includes("spreadsheetml") || 
    activeFile.mimeType?.includes("officedocument");

  const renderViewer = () => {
    if (!activeFile.url) return (
      <div className="flex flex-col items-center justify-center text-secondary/30 h-full italic">
        <Info className="w-12 h-12 mb-4 opacity-20" />
        <p>Không có dữ liệu hiển thị</p>
      </div>
    );

    // 1. Phân loại loại tệp dựa trên MIME type hoặc phần mở rộng
    const isVideo = activeFile.mimeType?.startsWith("video/") || 
                    activeFile.url.toLowerCase().endsWith('.mp4') || 
                    activeFile.url.toLowerCase().endsWith('.mov') ||
                    activeFile.url.toLowerCase().endsWith('.webm');

    // 2. Xử lý hiển thị Video (Ưu tiên dùng thẻ video bản địa cho trải nghiệm tốt nhất)
    if (isVideo) {
      const streamUrl = isDriveUrl(activeFile.url) 
        ? `/api/documents/stream/${extractDriveId(activeFile.url)}`
        : activeFile.url;

      return (
        <video 
          key={streamUrl}
          src={streamUrl} 
          controls 
          playsInline
          preload="metadata"
          className="w-full h-full rounded-2xl bg-black shadow-2xl"
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          onError={(e) => {
             console.error("Video Playback Error:", e);
             setIsLoading(false);
          }}
        />
      );
    }

    // 3. Xử lý hiển thị tệp từ Google Drive (Cho các tệp KHÔNG phải Video)
    if (isDriveUrl(activeFile.url)) {
      const driveId = extractDriveId(activeFile.url);
      if (driveId) {
        return (
          <div className="w-full h-full bg-[#050505] rounded-2xl overflow-hidden relative">
            <iframe 
              src={`https://drive.google.com/file/d/${driveId}/preview`} 
              className="w-full h-full border-none"
              allow="autoplay"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        );
      }
    }

    // 4. Xử lý hiển thị Hình ảnh
    if (isImage) {
      return (
        <LegacyImageViewer 
          url={activeFile.url} 
          alt={activeFile.name}
          currentIndex={currentFileIndex}
          totalCount={fileList.length}
          onNext={() => setCurrentFileIndex(prev => Math.min(fileList.length - 1, prev + 1))}
          onPrev={() => setCurrentFileIndex(prev => Math.max(0, prev - 1))}
          isFullscreen={fullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
      );
    }

    if (isPdf) {
      return (
        <div className="w-full h-full bg-[#050505] rounded-2xl overflow-hidden relative">
          <LegacyPdfViewer 
            url={activeFile.url} 
            name={activeFile.name} 
            onLoad={() => setIsLoading(false)} 
            currentIndex={currentFileIndex}
            totalCount={fileList.length}
            onNext={() => setCurrentFileIndex(prev => Math.min(fileList.length - 1, prev + 1))}
            onPrev={() => setCurrentFileIndex(prev => Math.max(0, prev - 1))}
            isFullscreen={fullscreen}
            onToggleFullscreen={toggleFullscreen}
          />
        </div>
      );
    }

    if (isOffice) {
      if (isLocal) {
        return (
          <div className="flex flex-col items-center justify-center text-secondary/30 h-full p-12 text-center bg-[#151515] rounded-3xl border border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-ancient-scroll opacity-5" />
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-6 relative z-10">
              <FileText className="w-10 h-10" />
            </div>
            <h4 className="text-lg font-serif font-black text-amber-500/80 uppercase tracking-widest mb-3 relative z-10">Local Preview Restricted</h4>
            <p className="text-xs text-white/40 max-w-sm mb-8 leading-relaxed relative z-10">
              Trình xem trực tuyến (Office Online) chỉ hoạt động khi tệp được tải lên server thực tế. 
              Bạn hãy tải tài liệu về để xem.
            </p>
            <button
              onClick={(e) => handleDownload(e)}
              className="px-8 py-3 bg-amber-500 text-black rounded-xl font-bold text-sm shadow-[0_10px_30px_rgba(245,158,11,0.2)] hover:scale-105 transition-transform flex items-center gap-2 relative z-10"
            >
              <Download className="w-4 h-4" /> Tải về {activeFile.name.split('.').pop()?.toUpperCase()}
            </button>
          </div>
        );
      }

      const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
        window.location.origin + activeFile.url
      )}`;
      
      return (
        <div className="w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
          <iframe 
            key={activeFile.url}
            src={viewerUrl} 
            className="w-full flex-1 border-none"
            title="Office Preview"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-white/5 rounded-3xl border border-white/5 shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 bg-ancient-dark opacity-5" />
        <Paperclip className="w-16 h-16 mb-6 text-secondary/20 relative z-10" />
        <p className="text-sm font-black text-secondary/60 uppercase tracking-[0.2em] mb-2 relative z-10">Định dạng không hỗ trợ xem trực tiếp</p>
        <p className="text-xs text-secondary/20 italic mb-8 relative z-10">Bạn có thể tải xuống để xem trên thiết bị cá nhân</p>
        <button
          onClick={(e) => handleDownload(e)}
          className="px-8 py-4 bg-secondary text-primary rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-transform flex items-center gap-3 relative z-10 border border-secondary/20"
        >
          <Download className="w-5 h-5" /> Tải về ngay
        </button>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 ${fullscreen ? "bg-black" : "bg-black/80 backdrop-blur-md"}`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`relative bg-[#1a1a1a] rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col md:flex-row overflow-hidden border border-white/10 ${fullscreen ? "w-full h-full" : "w-[1280px] max-w-full h-[850px] max-h-full"}`}
        >
          {/* Close Button Mobile */}
          <button onClick={onClose} className="absolute top-6 right-6 z-50 md:hidden w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-secondary/40 hover:text-secondary transition-all border border-white/10 shadow-2xl"><X className="w-6 h-6" /></button>
 
          {/* --- LEFT SIDE: Metadata (Heritage Dossier) --- */}
          {!fullscreen && (
            <div className="w-full md:w-[400px] shrink-0 h-full bg-[#140C0C] relative overflow-hidden flex flex-col border-r border-white/5 shadow-2xl">
              <div className="absolute inset-0 bg-ancient-dark opacity-10 pointer-events-none" />
              <div className="scroll-vignette opacity-40" />
              
              {/* Sticky Header - Fixed Height for alignment */}
              <div className="px-6 h-20 border-b border-white/5 bg-[#140C0C]/80 backdrop-blur-xl shrink-0 flex items-center relative z-20">
                <div className="flex items-center gap-4 w-full">
                  <div className={`w-12 h-12 rounded-2xl bg-secondary/10 border border-white/10 flex items-center justify-center shadow-lg transition-all hover:scale-105 shrink-0`}>
                    <RenderIcon name={doc.iconName} className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[8px] font-black text-secondary/40 uppercase tracking-[0.2em] mb-1">
                      <Tag className="w-3 h-3" />
                      {doc.type}
                    </div>
                    <h2 className="text-lg font-serif font-black text-secondary leading-tight truncate drop-shadow-lg">{docName}</h2>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 custom-scrollbar">
                <div className="p-8 space-y-8">

 
                <div className="w-full h-px bg-gradient-to-r from-transparent via-secondary/10 to-transparent" />
 
                {/* File Navigator (Multi-file) */}
                {fileList.length > 1 && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                       Văn bản đính kèm ({fileList.length})
                    </h4>
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar p-1">
                      {fileList.map((file, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentFileIndex(idx)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 shadow-sm ${
                            currentFileIndex === idx 
                              ? "bg-secondary border-secondary text-primary shadow-[0_5px_15px_rgba(212,175,55,0.2)] scale-[1.02]" 
                              : "bg-white/[0.03] border-white/5 text-secondary/60 hover:bg-white/[0.07] hover:border-secondary/20 hover:text-secondary"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${currentFileIndex === idx ? "bg-primary/20" : "bg-white/5"}`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold truncate tracking-tight">{file.name}</p>
                            <p className="text-[9px] font-black opacity-50 uppercase tracking-widest mt-0.5">{formatSize(file.size)}</p>
                          </div>
                          {currentFileIndex === idx && <ChevronRight className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
 
                {/* Info Grid - Reduced Size */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="w-9 h-9 rounded-lg bg-secondary/5 border border-secondary/10 flex items-center justify-center text-secondary/60 shrink-0"><Calendar className="w-4 h-4" /></div>
                    <div>
                      <p className="text-[8px] font-black text-secondary/30 uppercase tracking-widest mb-0.5">Niên đại</p>
                      <p className="text-sm font-bold text-secondary">Năm {doc.year}</p>
                    </div>
                  </div>
 
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="w-9 h-9 rounded-lg bg-secondary/5 border border-secondary/10 flex items-center justify-center text-secondary/60 shrink-0"><Info className="w-4 h-4" /></div>
                    <div>
                      <p className="text-[8px] font-black text-secondary/30 uppercase tracking-widest mb-0.5">Lưu giữ</p>
                      <p className="text-sm font-bold text-secondary">
                        {doc.createdAt instanceof Date ? doc.createdAt.toLocaleDateString("vi-VN") : String(doc.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
 
                {/* Description - Reduced Padding */}
                <div className="space-y-3">
                  <h4 className="text-[9px] font-black text-secondary/30 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                    Ghi chú hồ sơ
                  </h4>
                  <div className="p-5 rounded-[24px] bg-[#1a0f0f] border border-secondary/5 shadow-inner relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/5 blur-2xl pointer-events-none group-hover:bg-secondary/10 transition-colors" />
                    <p className="text-sm text-secondary/70 leading-relaxed italic relative z-10 font-serif">
                      “{doc.description}”
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Footer - Strongly Reduced */}
              <div className="p-6 border-t border-white/5 bg-[#0d0d0d] relative z-10 space-y-3">
                <button
                  onClick={(e) => handleDownload(e)}
                  className="w-full py-4 bg-secondary text-primary rounded-xl font-black text-xs uppercase tracking-[0.1em] shadow-xl hover:shadow-[0_8px_25px_rgba(212,175,55,0.2)] transition-all flex items-center justify-center gap-2 border border-secondary/20"
                >
                  <Download className="w-4 h-4" /> Tải về bản sao cổ
                </button>
                <div className="flex flex-wrap items-center justify-center gap-3 text-[7px] font-black text-secondary/20 uppercase tracking-[0.2em] select-none text-center">
                  Gia Phả Ký Archival System
                </div>
              </div>
            </div>
          )}
 
          {/* --- RIGHT SIDE: Archive Viewer --- */}
          <div ref={viewerRef} className="flex-1 h-full bg-[#080808] relative flex flex-col overflow-hidden">
            {/* Viewer Header - Exactly matched height with Left Side */}
            <div className={`px-8 h-20 border-b border-white/5 bg-[#080808]/80 backdrop-blur-xl flex items-center justify-between z-10 shrink-0 ${fullscreen ? 'hidden' : 'flex'}`}>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                  <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500/50 animate-ping" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-secondary uppercase tracking-[0.1em] truncate max-w-[300px]">{activeFile.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {fileList.length > 1 && (
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1 shadow-2xl shadow-black">
                    <button 
                      onClick={() => setCurrentFileIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentFileIndex === 0}
                      className="p-1.5 text-secondary/30 hover:text-secondary disabled:opacity-5 transition-all outline-none"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[9px] font-black text-secondary/40 w-10 text-center select-none tracking-widest bg-black/40 py-1 rounded-lg border border-white/5">
                      {currentFileIndex + 1} <span className="opacity-30">/</span> {fileList.length}
                    </span>
                    <button 
                      onClick={() => setCurrentFileIndex(prev => Math.min(fileList.length - 1, prev + 1))}
                      disabled={currentFileIndex === fileList.length - 1}
                      className="p-1.5 text-secondary/30 hover:text-secondary disabled:opacity-5 transition-all outline-none"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <button 
                  onClick={toggleFullscreen}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-secondary/40 hover:bg-white/10 hover:text-secondary transition-all border border-white/5 shadow-xl"
                  title={fullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                >
                  {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={onClose}
                  className="hidden md:flex w-9 h-9 items-center justify-center rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all border border-secondary/20 shadow-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
 
            {/* Main Display */}
            <div className="flex-1 w-full bg-[#050505] rounded-[40px] border border-white/5 shadow-[inset_0_2px_60px_rgba(0,0,0,1)] relative overflow-hidden flex items-center justify-center group/viewer">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.03)_0%,_transparent_70%)] pointer-events-none" />
              
              <AnimatePresence mode="wait">
                {isLoading && (
                  <motion.div 
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#080808] space-y-8"
                  >
                    <div className="relative w-24 h-24">
                      <div className="absolute inset-0 border-[3px] border-secondary/10 rounded-full" />
                      <div className="absolute inset-0 border-t-[3px] border-secondary rounded-full animate-spin" />
                      <div className="absolute inset-4 border-[2px] border-secondary/20 border-b-secondary rounded-full animate-[spin_2s_linear_infinite_reverse]" />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-black text-secondary uppercase tracking-[0.5em] animate-pulse">Đang khôi phục di bản</p>
                      <p className="text-[9px] text-secondary/20 mt-2 italic font-serif tracking-widest">Gia tộc di sản • Đang giải mã tập kỹ...</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
 
              <motion.div 
                key={activeFile.url}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className={`w-full h-full transition-opacity duration-500 ${isLoading ? "opacity-0" : "opacity-100"}`}
              >
                {renderViewer()}
              </motion.div>
            </div>
 
            {/* Corner Decorative Elements */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-secondary/5 blur-[120px] pointer-events-none opacity-50" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/3 blur-[150px] pointer-events-none opacity-30" />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
