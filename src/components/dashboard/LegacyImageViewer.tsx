"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  ZoomIn, 
  ZoomOut, 
  RefreshCcw,
  RotateCw,
  Move,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LegacyImageViewerProps {
  url: string;
  alt?: string;
  currentIndex?: number;
  totalCount?: number;
  onNext?: () => void;
  onPrev?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export default function LegacyImageViewer({ 
  url, 
  alt,
  currentIndex,
  totalCount,
  onNext,
  onPrev,
  isFullscreen,
  onToggleFullscreen
}: LegacyImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Reset view when URL changes
  useEffect(() => {
    setScale(1);
    setRotation(0);
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
      containerRef.current.scrollTop = 0;
    }
  }, [url]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  // Grab-to-scroll Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current || scale <= 1) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.pageX - containerRef.current.offsetLeft,
      y: e.pageY - containerRef.current.offsetTop,
      scrollLeft: containerRef.current.scrollLeft,
      scrollTop: containerRef.current.scrollTop
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const y = e.pageY - containerRef.current.offsetTop;
    const walkX = (x - dragStart.current.x);
    const walkY = (y - dragStart.current.y);
    
    containerRef.current.scrollLeft = dragStart.current.scrollLeft - walkX;
    containerRef.current.scrollTop = dragStart.current.scrollTop - walkY;
  };

  const handleStopDragging = () => setIsDragging(false);

  return (
    <div className="w-full h-full flex flex-col items-center bg-[#050505] relative overflow-hidden group/viewer">
      {/* Controls Overlay - Top */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full opacity-40 group-hover/viewer:opacity-100 focus-within:opacity-100 transition-all duration-300 shadow-2xl">
        {onPrev && onNext && totalCount !== undefined && totalCount > 1 && (
          <>
            <button 
              onClick={onPrev} 
              disabled={currentIndex === 0}
              className="p-1.5 text-secondary/40 hover:text-secondary disabled:opacity-5 transition-colors" 
              title="Tệp trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-black text-secondary/60 min-w-[50px] text-center uppercase tracking-widest px-1">
              {currentIndex !== undefined ? `${currentIndex + 1} / ${totalCount}` : '...'}
            </span>
            <button 
              onClick={onNext} 
              disabled={currentIndex === totalCount - 1}
              className="p-1.5 text-secondary/40 hover:text-secondary disabled:opacity-5 transition-colors" 
              title="Tệp sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="w-px h-3 bg-white/10 mx-1" />
          </>
        )}

        <button onClick={handleZoomOut} className="p-1.5 text-secondary/40 hover:text-secondary transition-colors" title="Thu nhỏ">
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="text-[10px] font-black text-secondary/60 w-10 text-center flex flex-col">
          <span>{Math.round(scale * 100)}%</span>
        </div>
        <button onClick={handleZoomIn} className="p-1.5 text-secondary/40 hover:text-secondary transition-colors" title="Phóng to">
          <ZoomIn className="w-4 h-4" />
        </button>
        
        <div className="w-px h-3 bg-white/10 mx-1" />
        
        <button onClick={handleRotate} className="p-1.5 text-secondary/40 hover:text-secondary transition-colors" title="Xoay">
          <RotateCw className="w-4 h-4" />
        </button>
        <button onClick={handleReset} className="p-1.5 text-secondary/40 hover:text-secondary transition-colors" title="Căn lại">
          <RefreshCcw className="w-4 h-4" />
        </button>

        <div className="w-px h-3 bg-white/10 mx-1" />

        <button onClick={onToggleFullscreen} className="p-1.5 text-secondary/40 hover:text-secondary transition-colors" title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}>
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Container */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleStopDragging}
        onMouseLeave={handleStopDragging}
        className={`flex-1 w-full overflow-auto custom-scrollbar flex items-start justify-center p-8 bg-[#080808] relative select-none ${scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`}
      >
        <div 
          className="relative transition-all duration-300 ease-out shrink-0 mt-auto mb-auto"
          style={{ 
            width: `${100 * scale}%`,
            maxWidth: scale > 1 ? 'none' : '90%',
            height: scale > 1 ? 'auto' : '90%'
          }}
        >
          <motion.img 
            src={url} 
            alt={alt}
            animate={{ rotate: rotation }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="w-full h-full object-contain shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] border border-white/5 rounded-sm"
          />
        </div>

        {/* Pan Hint */}
        {scale > 1.2 && !isDragging && (
          <div className="absolute top-1/2 left-8 -translate-y-1/2 flex flex-col items-center gap-2 opacity-30 pointer-events-none z-50">
            <div className="w-10 h-10 rounded-full border border-secondary/30 flex items-center justify-center animate-bounce">
              <Move className="w-4 h-4 text-secondary" />
            </div>
            <span className="text-[7px] font-black text-secondary uppercase tracking-widest vertical-rl">Giữ để di chuyển</span>
          </div>
        )}
      </div>

      {/* Badge */}
      <div className="absolute bottom-6 right-6 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/5 text-[9px] font-black text-secondary/20 uppercase tracking-[0.2em] pointer-events-none group-hover/viewer:opacity-100 opacity-0 transition-opacity">
        Bản sao Lưu trữ Hình ảnh
      </div>
    </div>
  );
}
