"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";

interface IncenseEffectProps {
  litSticks?: string[]; // Danh sách các mốc thời gian ISO string
  isPlacing?: boolean;  // Trạng thái đang cắm 
  interactiveMode?: boolean; // Nếu true, nhang đi theo chuột
  onPlant?: () => void; // Callback khi cắm thành công
}

export function IncenseEffect({ 
  litSticks = [], 
  isPlacing = false, 
  interactiveMode = false,
  onPlant 
}: IncenseEffectProps) {
  const [mounted, setMounted] = useState(false);
  const [optimisticSticks, setOptimisticSticks] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Reset optimistic sticks when litSticks changes from server
  useEffect(() => {
    setOptimisticSticks([]);
  }, [litSticks]);

  // Motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { damping: 30, stiffness: 300 });
  const springY = useSpring(mouseY, { damping: 30, stiffness: 300 });

  useEffect(() => {
    setMounted(true);
    
    if (interactiveMode) {
      const handleMouseMove = (e: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
      };
      
      const handleTouchMove = (e: TouchEvent) => {
        if (!containerRef.current || !e.touches[0]) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set(e.touches[0].clientX - rect.left);
        mouseY.set(e.touches[0].clientY - rect.top);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("touchmove", handleTouchMove);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("touchmove", handleTouchMove);
      };
    }
  }, [interactiveMode, mouseX, mouseY]);

  const handlePlantClick = () => {
    if (interactiveMode && onPlant && !isPlacing) {
      // Optimistic: Thêm nhang ảo ngay lập tức
      setOptimisticSticks([new Date().toISOString()]);
      onPlant();
    }
  };

  const activeSticks = useMemo(() => {
    if (!mounted) return litSticks;
    const now = new Date().getTime();
    const allSticks = [...litSticks, ...optimisticSticks];
    return allSticks.filter(s => now - new Date(s).getTime() < 10 * 60 * 1000);
  }, [litSticks, optimisticSticks, mounted]);

  if (!mounted) return null;

  return (
    <div 
      ref={containerRef}
      onMouseDown={handlePlantClick}
      className={`absolute inset-0 pointer-events-none select-none z-0 flex items-end justify-center overflow-visible ${interactiveMode ? 'pointer-events-auto cursor-none' : ''}`}
    >
      <div className="relative flex flex-col items-center w-full h-full justify-end max-h-[320px]">
        
        {/* Bát Hương (Z-index 30) */}
        <div className="relative w-48 h-32 z-30 mb-0 flex flex-col items-center justify-end">
          <img 
            src="/images/bat_nhang.png" 
            alt="Bát Hương" 
            className="w-full h-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
          />
          
          {/* Vùng cảm biến vô hình (Z-index 50) */}
          <div 
            onClick={(e) => { e.stopPropagation(); handlePlantClick(); }}
            className="absolute top-[10%] left-[10%] right-[10%] h-16 cursor-pointer z-50 pointer-events-auto"
          />

          {/* Hiệu ứng tro mờ */}
          <motion.div 
            animate={interactiveMode ? {
              boxShadow: ["0 0 0px #ff6a00", "0 0 15px #ff6a00", "0 0 0px #ff6a00"],
              opacity: [0.4, 0.7, 0.4]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-[28%] left-[32%] right-[32%] h-4 bg-black/60 rounded-full blur-sm pointer-events-none z-10" 
          />
        </div>

        {/* Nhang đã cắm (Đưa lên Z-index 40 để hiện lên phía trên vành bát) */}
        <div className="absolute top-[72%] w-full flex justify-center z-40">
          <AnimatePresence>
            {activeSticks.map((startTime, idx) => (
              <IncenseStick 
                key={startTime} 
                startTime={startTime} 
                index={idx} 
                total={activeSticks.length}
                isNewest={idx === activeSticks.length - 1} // Mọi nén nhang mới nhất (kể cả ảo) đều có hiệu ứng plunging
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Nén nhang theo tay (Interactive Hand) */}
        {interactiveMode && !isPlacing && (
          <motion.div 
            style={{ 
              x: springX, 
              y: springY, 
              position: 'absolute', 
              top: 0, 
              left: 0,
              marginLeft: -2,
              marginTop: -100 
            }}
            className="z-[100] flex flex-col items-center pointer-events-none"
          >
             <div className="relative flex flex-col items-center">
                {/* Visual Label */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -top-10 whitespace-nowrap bg-orange-600/90 px-3 py-0.5 rounded-full text-[7px] font-bold text-white uppercase tracking-tighter shadow-lg"
                >
                   Dâng hương
                </motion.div>
                
                {/* Nén nhang: THẬT HƠN VỚI ĐỐM CHÁY NHIỀU LỚP */}
                <div className="flex flex-col items-center">
                   <div className="w-[3px] h-32 bg-gradient-to-t from-[#8B4513] via-[#CD853F] to-[#6D340D] rounded-t-full shadow-lg relative">
                      {/* LỚP CHÁY PHỨC HỢP (REAL EMBER) */}
                      <div className="absolute -top-1.5 left-1/2 -ml-1.5 w-3 h-3 flex items-center justify-center">
                        {/* 1. Lớp quầng đỏ cam */}
                        <motion.div 
                          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.9, 0.6] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute inset-0 bg-[#FF4D00] rounded-full blur-[4px]"
                        />
                        {/* 2. Lớp tro xám mỏng */}
                        <div className="absolute inset-0.5 border border-white/20 rounded-full z-10" />
                        {/* 3. Lõi vàng rực rỡ */}
                        <motion.div 
                          animate={{ scale: [0.8, 1.1, 0.8] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          className="w-1.5 h-1.5 bg-[#FFF500] rounded-full z-20 shadow-[0_0_8px_#FFF500]"
                        />
                      </div>

                      {/* Khói tỏa */}
                      <div className="absolute -top-8 w-full flex justify-center">
                        {[...Array(3)].map((_, i) => (
                          <SmokeParticle key={i} delay={i * 2} />
                        ))}
                      </div>
                   </div>
                   <div className="w-[1.2px] h-20 bg-[#B00020] -mt-[1px]" />
                </div>

                {/* Bàn tay */}
                <svg width="110" height="110" viewBox="0 0 24 24" fill="none" className="text-[#F9F5EB]/40 drop-shadow-2xl absolute -bottom-8 translate-x-12">
                   <path d="M19 13.5c0-1.2-1-2.2-2.2-2.2h-.3c-.8 0-1.5-.7-1.5-1.5V5.2c0-1.5-1.2-2.7-2.7-2.7h-.3c-1.5 0-2.7 1.2-2.7 2.7v7.3m0 0V8.2c0-1.2-1-2.2-2.2-2.2h-.3c-1.2 0-2.2 1-2.2 2.2v6.3m0 0V9.7c0-1.2-1-2.2-2.2-2.2h-.3C4 7.5 3 8.5 3 9.7v5.3c0 3.9 3.1 7 7 7h4c3.9 0 7-3.1 7-7v-1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1"/>
                </svg>
             </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function IncenseStick({ startTime, index, total, isNewest }: { startTime: string; index: number; total: number; isNewest: boolean }) {
  const [now, setNow] = useState(new Date(startTime).getTime());
  
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsed = now - new Date(startTime).getTime();
  const burnDuration = 5 * 60 * 1000;
  const progress = Math.min(Math.max(elapsed / burnDuration, 0), 1);
  
  const maxHeight = 160;
  const currentHeight = maxHeight * (1 - progress * 0.75); 
  const isFinished = progress >= 1;

  // Tạo độ nghiêng ngẫu nhiên dựa trên startTime để mỗi cây mỗi khác
  const randomRotation = useMemo(() => {
    const seed = new Date(startTime).getTime();
    return (seed % 10) - 5; // Độ nghiêng từ -5 đến 5 độ
  }, [startTime]);

  const offset = (index - (total - 1) / 2) * 12;
  const rotation = ((index - (total - 1) / 2) * 2) + randomRotation;

  return (
    <motion.div
      initial={isNewest ? { opacity: 0, scale: 1.1, y: -150 } : { opacity: 1, scale: 1, y: 0 }}
      animate={{ opacity: 1, scale: 1, y: 0, rotate: rotation }}
      exit={{ opacity: 0 }}
      transition={{ 
        duration: isNewest ? 0.4 : 0.8, 
        ease: isNewest ? "backOut" : "easeOut" 
      }}
      style={{ left: `calc(50% + ${offset}px)` }}
      className="absolute bottom-0 flex flex-col items-center origin-bottom z-10"
    >
      <div 
        className="relative flex flex-col items-center"
        style={{ height: `${currentHeight}px` }}
      >
        {/* Thân nhang (TRÊN) */}
        {!isFinished && (
           <div className="w-[3px] h-full bg-gradient-to-t from-[#8B4513] via-[#CD853F] to-[#A0522D] rounded-t-full relative">
              {/* LỚP CHÁY PHỨC HỢP RIÊNG CHO TỪNG CÂY */}
              <div className="absolute -top-1.5 left-1/2 -ml-1.5 w-3 h-3 flex items-center justify-center">
                <motion.div 
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.9, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-[#FF4D00] rounded-full blur-[4px]"
                />
                <motion.div 
                  animate={{ scale: [0.8, 1, 0.8] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                  className="w-1.5 h-1.5 bg-[#FFF500] rounded-full z-20 shadow-[0_0_8px_#FFF500]"
                />
              </div>

              {/* Làn khói tỏa */}
              <div className="absolute -top-10 w-full flex justify-center">
                {[...Array(5)].map((_, i) => (
                  <SmokeParticle key={i} delay={i * 2} />
                ))}
              </div>
           </div>
        )}

        {/* Chân nhang (DƯỚI) - MÀU ĐỎ HỒNG - KHÔNG GẬP */}
        <div 
          className="w-[1.2px] bg-[#B00020] rounded-full shadow-[0_0_5px_rgba(176,0,32,0.4)] z-0 -mt-[1px]"
          style={{ height: isFinished ? '10px' : '30px' }} 
        />
      </div>
    </motion.div>
  );
}

function SmokeParticle({ delay }: { delay: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { randomX, randomDuration } = useMemo(() => {
    if (typeof window === "undefined") return { randomX: 0, randomDuration: 12 };
    return { randomX: Math.random() * 60 - 30, randomDuration: 12 + Math.random() * 4 };
  }, []); 
  if (!mounted) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.1, y: 0, x: 0 }}
      animate={{ opacity: [0, 0.15, 0.1, 0], scale: [1, 4, 12], y: -280, x: [0, randomX, -randomX] }}
      transition={{ duration: randomDuration, repeat: Infinity, delay, ease: "easeOut" }}
      className="absolute w-12 h-12 bg-gradient-to-t from-white/5 via-white/5 to-transparent rounded-full blur-[25px]"
      style={{ bottom: 0 }}
    />
  );
}

