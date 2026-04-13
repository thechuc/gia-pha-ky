import React, { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import { 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  RefreshCcw,
  RotateCw,
  Move,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Configure worker - using unpkg CDN for simplicity in Next.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface LegacyPdfViewerProps {
  url: string;
  name?: string;
  onLoad?: () => void;
  currentIndex?: number;
  totalCount?: number;
  onNext?: () => void;
  onPrev?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export default function LegacyPdfViewer({ 
  url, 
  name, 
  onLoad,
  currentIndex,
  totalCount,
  onNext,
  onPrev,
  isFullscreen,
  onToggleFullscreen
}: LegacyPdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [renderScale, setRenderScale] = useState(1.5);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [isDragging, setIsDragging] = useState(false);
  
  // Custom Drag-to-Scroll state
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Reset view when URL changes
  useEffect(() => {
    setPageNumber(1);
    setIsLoading(true);
    setRenderScale(1.5);
    setRotation(0);
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
      containerRef.current.scrollTop = 0;
    }
  }, [url]);

  // Resize observer to make PDF responsive
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width - 120); // Balanced padding
      }
    });

    const container = document.getElementById('pdf-viewer-container');
    if (container) observer.observe(container);

    return () => observer.disconnect();
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
    onLoad?.();
  }

  const handleZoomIn = () => {
    setIsRendering(true);
    setRenderScale(prev => Math.min(prev + 0.5, 5.0));
  };

  const handleZoomOut = () => {
    setIsRendering(true);
    setRenderScale(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleReset = () => {
    setIsRendering(true);
    setRenderScale(1.5);
    setRotation(0);
  };

  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  // Grab-to-scroll Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
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
    const walkX = x - dragStart.current.x;
    const walkY = y - dragStart.current.y;
    
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

        {/* Page Navigation - Inner PDF */}
        <button 
          onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
          disabled={pageNumber <= 1}
          className="p-1.5 text-secondary/40 hover:text-secondary disabled:opacity-10 transition-colors"
          title="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[10px] font-black text-secondary/60 min-w-[60px] text-center uppercase tracking-widest">
          {pageNumber} / {numPages || '--'}
        </span>
        <button 
          onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages || prev))}
          disabled={pageNumber >= (numPages || 1)}
          className="p-1.5 text-secondary/40 hover:text-secondary disabled:opacity-10 transition-colors"
          title="Trang sau"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        
        <div className="w-px h-3 bg-white/10 mx-1" />
        
        <button onClick={handleZoomIn} className="p-1.5 text-secondary/40 hover:text-secondary transition-colors" title="Phóng to"><ZoomIn className="w-4 h-4" /></button>
        <button onClick={handleZoomOut} className="p-1.5 text-secondary/40 hover:text-secondary transition-colors" title="Thu nhỏ"><ZoomOut className="w-4 h-4" /></button>
        <div className="text-[10px] font-black text-secondary/60 w-10 text-center flex flex-col">
          <span>{Math.round((renderScale / 1.5) * 100)}%</span>
        </div>
        
        <div className="w-px h-3 bg-white/10 mx-1" />
        
        <button onClick={handleRotate} className="p-1.5 text-secondary/40 hover:text-secondary transition-colors" title="Xoay trang"><RotateCw className="w-4 h-4" /></button>
        <button 
          onClick={handleReset} 
          className="p-1.5 text-secondary/40 hover:text-secondary transition-colors" 
          title="Reset"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>

        <div className="w-px h-3 bg-white/10 mx-1" />

        <button onClick={onToggleFullscreen} className="p-1.5 text-secondary/40 hover:text-secondary transition-colors" title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}>
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Viewer Area */}
      <div 
        ref={containerRef}
        id="pdf-viewer-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleStopDragging}
        onMouseLeave={handleStopDragging}
        className={`flex-1 w-full overflow-auto custom-scrollbar flex items-start justify-center p-16 bg-[#080808] relative select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center space-y-4 z-40 bg-[#080808]"
            >
              <Loader2 className="w-8 h-8 text-secondary animate-spin opacity-20" />
              <p className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.3em]">Đang giải mã tập kỷ...</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          className="relative shadow-[0_45px_100px_-25px_rgba(0,0,0,0.95)] border border-white/5 bg-white shrink-0 transition-all duration-300"
          style={{ width: containerWidth * (renderScale / 1.5) }}
        >
          {/* Underlay for smooth rendering (prevents flicker) */}
          {isRendering && (
            <div className="absolute inset-0 z-0 opacity-30 blur-[2px] pointer-events-none bg-black/5" />
          )}

          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={null}
            className="flex flex-col items-center"
          >
            <Page 
              pageNumber={pageNumber} 
              scale={renderScale}
              rotate={rotation}
              width={containerWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onRenderSuccess={() => setIsRendering(false)}
              loading={null}
              className="transition-opacity duration-300 pointer-events-none"
            />
          </Document>
        </div>

        {/* Pan Hint Overlay */}
        {renderScale > 1.6 && !isDragging && (
          <div className="absolute top-1/2 left-8 -translate-y-1/2 flex flex-col items-center gap-2 opacity-30 pointer-events-none z-50">
            <div className="w-10 h-10 rounded-full border border-secondary/30 flex items-center justify-center animate-bounce">
              <Move className="w-4 h-4 text-secondary" />
            </div>
            <span className="text-[7px] font-black text-secondary uppercase tracking-widest vertical-rl">Giữ để di chuyển</span>
          </div>
        )}
      </div>

      {/* Page Navigation Hint - Bottom */}
      {numPages && numPages > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/5 text-[9px] font-black text-secondary/20 uppercase tracking-[0.2em] pointer-events-none opacity-50">
          Tài liệu di sản gồm {numPages} trang
        </div>
      )}
    </div>
  );
}
