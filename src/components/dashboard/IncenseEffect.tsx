"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { UserCircle2 } from "lucide-react";
import "../memorial/virtual-altar-v2.css";

interface IncenseEffectProps {
  litSticks?: string[]; // Danh sách các mốc thời gian ISO string
  lastLitAt?: Date | string | null; // Mốc thời gian cuối cùng (fallback)
  isPlacing?: boolean;  // Trạng thái đang cắm 
  interactiveMode?: boolean; // Nếu true, nhang đi theo chuột
  onPlant?: () => void; // Callback khi cắm thành công
}

export function IncenseEffect({
  litSticks = [],
  lastLitAt,
  isPlacing = false,
  interactiveMode = false,
  onPlant
}: IncenseEffectProps) {
  // SVG Defs for the bronze bowl
  const AltarSVGDefs = () => (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="va-bronze-card" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2c1e08" />
          <stop offset="15%" stopColor="#8a631c" />
          <stop offset="50%" stopColor="#ffd700" />
          <stop offset="85%" stopColor="#8a631c" />
          <stop offset="100%" stopColor="#2c1e08" />
        </linearGradient>
        <linearGradient id="va-bronze-dark-card" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1c1204" />
          <stop offset="50%" stopColor="#5c4305" />
          <stop offset="100%" stopColor="#1c1204" />
        </linearGradient>
        <radialGradient id="va-ash-card" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#aaa" />
          <stop offset="70%" stopColor="#666" />
          <stop offset="100%" stopColor="#333" />
        </radialGradient>
        <linearGradient id="va-wood-centered-card" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1f0c01" />
          <stop offset="25%" stopColor="#5c2908" />
          <stop offset="50%" stopColor="#8b4513" />
          <stop offset="75%" stopColor="#5c2908" />
          <stop offset="100%" stopColor="#1f0c01" />
        </linearGradient>
        <pattern id="va-diamond-band-card" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M 8 2 L 16 8 L 8 14 L 0 8 Z" fill="none" stroke="#d4af37" strokeWidth="1" opacity="0.6"/>
          <circle cx="8" cy="8" r="1.5" fill="#ffdf00" opacity="0.8"/>
        </pattern>
      </defs>
    </svg>
  );

  const IncenseBowlBack = () => (
    <svg width="100%" height="100%" viewBox="0 0 220 170" style={{ position: "absolute", bottom: 0, zIndex: 10 }}>
      <path d="M 35 45 A 75 14 0 0 1 185 45 L 175 45 A 65 11 0 0 0 45 45 Z" fill="#5c4305"/>
      <path d="M 45 45 A 65 11 0 0 1 175 45 L 175 52 A 65 11 0 0 0 45 52 Z" fill="#150a02"/>
      <path d="M 45 52 A 65 11 0 0 1 175 52 Z" fill="#3a3a3a"/>
    </svg>
  );

  const IncenseBowlFront = () => (
    <svg width="100%" height="100%" viewBox="0 0 220 170" style={{ position: "absolute", bottom: 0, pointerEvents: "none", zIndex: 32 }}>
      <path d="M 45 52 A 65 11 0 0 0 175 52 Z" fill="url(#va-ash-card)"/>
      <ellipse cx="110" cy="135" rx="82" ry="16" fill="#1f0c01"/>
      <path d="M 28 135 L 25 148 A 85 16 0 0 0 195 148 L 192 135 Z" fill="url(#va-wood-centered-card)"/>
      <path d="M 28 135 A 82 16 0 0 0 192 135" fill="none" stroke="#8b4513" strokeWidth="1.5"/>
      <path d="M 35 45 A 75 14 0 0 0 185 45 L 185 130 A 75 14 0 0 1 35 130 Z" fill="url(#va-bronze-card)"/>
      <path d="M 35 52 A 75 14 0 0 0 185 52 L 185 68 A 75 14 0 0 1 35 68 Z" fill="url(#va-bronze-dark-card)"/>
      <path d="M 35 52 A 75 14 0 0 0 185 52 L 185 68 A 75 14 0 0 1 35 68 Z" fill="url(#va-diamond-band-card)"/>
      <path d="M 35 52 A 75 14 0 0 0 185 52" fill="none" stroke="#ffdf00" strokeWidth="1.5" />
      <path d="M 35 68 A 75 14 0 0 0 185 68" fill="none" stroke="#d4af37" strokeWidth="2.5" />
      <path d="M 35 120 A 75 14 0 0 0 185 120 L 185 124 A 75 14 0 0 1 35 124 Z" fill="url(#va-bronze-dark-card)"/>
      <path d="M 35 120 A 75 14 0 0 0 185 120" fill="none" stroke="#d4af37" strokeWidth="1"/>
      <path d="M 35 45 A 75 14 0 0 0 185 45 L 175 45 A 65 11 0 0 1 45 45 Z" fill="url(#va-bronze-card)"/>
      <path d="M 35 45 A 75 14 0 0 0 185 45" fill="none" stroke="#ffdf00" strokeWidth="2.5" />
      <path d="M 45 45 A 65 11 0 0 0 175 45" fill="none" stroke="#d4af37" strokeWidth="1.5"/>
      <g transform="translate(110, 109)" filter="drop-shadow(0px 5px 6px rgba(0,0,0,0.85))">
        <circle cx="0" cy="0" r="27" fill="url(#va-bronze-dark-card)"/>
        <circle cx="0" cy="0" r="23" fill="#1a1103" stroke="#ffdf00" strokeWidth="1.5"/>
        <g transform="rotate(-15)">
          <path d="M 0 -21 A 21 21 0 0 0 0 21 A 10.5 10.5 0 0 1 0 0 A 10.5 10.5 0 0 0 0 -21 Z" fill="#3B170B" />
          <path d="M 0 -21 A 21 21 0 0 1 0 21 A 10.5 10.5 0 0 1 0 0 A 10.5 10.5 0 0 0 0 -21 Z" fill="#d4af37" />
          <circle cx="0" cy="-10.5" r="4" fill="#2A120A" />
          <circle cx="0" cy="10.5" r="4" fill="#ffdf00" />
        </g>
      </g>
    </svg>
  );

  const [mounted, setMounted] = useState(false);
  const [optimisticSticks, setOptimisticSticks] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOptimisticSticks([]);
  }, [litSticks]);

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
      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    }
  }, [interactiveMode, mouseX, mouseY]);

  const handlePlantClick = () => {
    if (interactiveMode && onPlant && !isPlacing) {
      setOptimisticSticks([new Date().toISOString()]);
      onPlant();
    }
  };

  const activeSticks = useMemo(() => {
    if (!mounted) return [];
    const now = new Date().getTime();

    // Tổng hợp tất cả các mốc thời gian (litSticks, optimisticSticks và lastLitAt)
    const rawSticks = [...litSticks, ...optimisticSticks];
    if (lastLitAt && !rawSticks.length) {
      const lastTime = new Date(lastLitAt).getTime();
      if (Math.abs(now - lastTime) < 10 * 60 * 1000) {
        rawSticks.push(new Date(lastLitAt).toISOString());
      }
    }

    const activeOnes = rawSticks
      .map(s => s ? new Date(s).getTime() : 0)
      .filter(t => t > 0 && Math.abs(now - t) < 10 * 60 * 1000)
      .sort((a, b) => b - a);

    if (activeOnes.length > 0) {
      const latestT = activeOnes[0];
      return [
        new Date(latestT).toISOString(),
        new Date(latestT - 1000).toISOString(),
        new Date(latestT - 2000).toISOString()
      ];
    }
    return [];
  }, [litSticks, optimisticSticks, lastLitAt, mounted]);

  const oldSticks = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      x: (Math.random() - 0.5) * 100,
      height: 10 + Math.random() * 20,
      rotate: (Math.random() - 0.5) * 20
    }));
  }, []);

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      onMouseDown={handlePlantClick}
      className={`absolute inset-0 pointer-events-none select-none z-0 flex items-end justify-center overflow-visible ${interactiveMode ? 'pointer-events-auto cursor-none' : ''}`}
    >
      <div
        className="relative w-44 h-56 flex flex-col items-center overflow-visible origin-bottom transform-gpu"
        style={{ transform: 'scale(0.44)' }}
      >
        <AltarSVGDefs />

        {/* Bát hương wrapper - Cố định kích thước theo ViewBox SVG */}
        <div 
          className="absolute bottom-0 w-[220px] h-[170px] overflow-visible"
        >
          {/* LỚP BÁT HƯƠNG PHÍA SAU (Back) */}
          <div className="absolute inset-0 z-10">
            <IncenseBowlBack />
          </div>

          {/* VÙNG CẮM NHANG (Nằm lồng trong không gian Bát hương) */}
          <div
            className="absolute left-[20%] right-[20%] h-[12px] z-20"
            style={{ top: '30%' }} // Tọa độ y=51 quy đổi cho mặt tro
          >
            {/* Chân nhang cũ */}
            {oldSticks.map((stick, i) => (
              <div
                key={i}
                className="old-stick"
                style={{
                  left: `${(stick.x + 50)}%`,
                  bottom: `${(Math.random() * 100)}%`,
                  height: `${stick.height}px`,
                  rotate: `${stick.rotate}deg`,
                  opacity: 0.6,
                  position: 'absolute',
                  zIndex: Math.round(100 - (Math.random() * 100)),
                  "--tip-opacity": 0.4
                } as React.CSSProperties}
              />
            ))}

            {/* Nhang đang cháy */}
            <AnimatePresence>
              {activeSticks.map((startTime, idx) => (
                <IncenseStick
                  key={startTime}
                  startTime={startTime}
                  index={idx}
                  total={activeSticks.length}
                  isNewest={startTime === [...litSticks, ...optimisticSticks].sort().pop()}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* THÂN BÁT NHANG PHÍA TRƯỚC (Front) */}
          <div className="absolute inset-0 z-30 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
            <IncenseBowlFront />
          </div>
        </div>

        {/* Vùng cảm biến vô hình (chỉ active khi interactiveMode) */}
        {interactiveMode && (
          <div
            onClick={(e) => { e.stopPropagation(); handlePlantClick(); }}
            className="absolute top-[20%] left-[20%] right-[20%] h-12 cursor-pointer z-50"
          />
        )}

        {interactiveMode && !isPlacing && (
          <motion.div
            style={{ x: springX, y: springY, position: 'absolute', top: 0, left: 0, marginLeft: -1, marginTop: -55 }}
            className="z-[100] flex flex-col items-center pointer-events-none"
          >
            <div className="relative flex flex-col items-center">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -top-10 whitespace-nowrap bg-orange-600/90 px-3 py-0.5 rounded-full text-[7px] font-bold text-white uppercase tracking-tighter shadow-lg">
                Dâng hương
              </motion.div>
              <div className="flex flex-col items-center">
                <div className="w-[2px] h-16 bg-gradient-to-t from-[#8B4513] via-[#CD853F] to-[#6D340D] rounded-t-full shadow-lg relative">
                  <div className="absolute -top-1.5 left-1/2 -ml-1.5 w-3 h-3 flex items-center justify-center">
                    <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.9, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0 bg-[#FF4D00] rounded-full blur-[4px]" />
                    <div className="absolute inset-0.5 border border-white/20 rounded-full z-10" />
                    <motion.div animate={{ scale: [0.8, 1.1, 0.8] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-1.5 h-1.5 bg-[#FFF500] rounded-full z-20 shadow-[0_0_8px_#FFF500]" />
                  </div>
                  <div className="absolute -top-8 w-full flex justify-center">
                    {[...Array(3)].map((_, i) => <SmokeParticle key={i} delay={i * 2} />)}
                  </div>
                </div>
                <div className="w-[0.8px] h-10 bg-[#B00020] -mt-[1px]" />
              </div>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" className="text-[#F9F5EB]/40 drop-shadow-2xl absolute -bottom-4 translate-x-6">
                <path d="M19 13.5c0-1.2-1-2.2-2.2-2.2h-.3c-.8 0-1.5-.7-1.5-1.5V5.2c0-1.5-1.2-2.7-2.7-2.7h-.3c-1.5 0-2.7 1.2-2.7 2.7v7.3m0 0V8.2c0-1.2-1-2.2-2.2-2.2h-.3c-1.2 0-2.2 1-2.2 2.2v6.3m0 0V9.7c0-1.2-1-2.2-2.2-2.2h-.3C4 7.5 3 8.5 3 9.7v5.3c0 3.9 3.1 7 7 7h4c3.9 0 7-3.1 7-7v-1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1" />
              </svg>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function IncenseStick({ startTime, index, total, isNewest }: { startTime: string, index: number, total: number, isNewest: boolean }) {
  const [now, setNow] = useState(Date.now());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { randomRotation, ashHeight, ashAngle } = useMemo(() => {
    const seed = new Date(startTime).getTime();
    return {
      randomRotation: (seed % 10) - 5,
      ashHeight: 6 + (seed % 8),
      ashAngle: (seed % 24) - 12
    };
  }, [startTime]);

  const offset = (index - (total - 1) / 2) * 16;
  const rotation = ((index - (total - 1) / 2) * 4) + randomRotation;

  const elapsed = now - new Date(startTime).getTime();
  const burnDuration = 10 * 60 * 1000;
  const progress = Math.max(0, 1 - (elapsed / burnDuration));
  
  // Các thông số ngẫu nhiên cho tàn nhang và hiệu ứng đốm than (Ember)
  const { glowSpeed, glowDelay, emberRadius } = useMemo(() => ({
    glowSpeed: 2 + Math.random() * 2,
    glowDelay: -(Math.random() * 5),
    emberRadius: Math.random() > 0.5 ? "50%" : "2px"
  }), []);

  if (!mounted) return null;

  return (
    <motion.div
      initial={isNewest ? { opacity: 0, scale: 0.5, y: -20 } : { opacity: 1, scale: 1, y: 0 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="incense-stick"
      style={{
        left: `${50 + (offset / 1.5)}%`,
        bottom: `${40 + (Math.abs(offset) / 5)}%`,
        rotate: `${rotation}deg`,
        zIndex: Math.round(100 - (40 + (Math.abs(offset) / 5))),
        "--ash-height": `${ashHeight}px`,
        "--ash-angle": `${ashAngle}deg`,
        "--glow-speed": `${glowSpeed}s`,
        "--glow-delay": `${glowDelay}s`,
        "--ember-radius": emberRadius
      } as React.CSSProperties}
    >
      <div 
        className="stick-burn" 
        style={{ 
          height: `${progress * 100}px`,
          backgroundImage: 'linear-gradient(to right, #C2A649 0%, #E2C97A 45%, #C2A649 60%, #8B7A3E 100%)'
        }}
      >
        {/* Hiệu ứng khói nhang */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-full flex justify-center z-40">
          {[...Array(3)].map((_, i) => (
            <SmokeParticle key={i} delay={i * 2} />
          ))}
        </div>
      </div>
      <div className="stick-base" />
    </motion.div>
  );
}

function SmokeParticle({ delay }: { delay: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { randomX, randomDuration, randomS, randomWind } = useMemo(() => {
    if (typeof window === "undefined") return { randomX: 0, randomDuration: 8, randomS: 1, randomWind: 0 };
    return {
      randomX: Math.random() * 40 - 20,
      randomDuration: 7 + Math.random() * 5,
      randomS: 0.8 + Math.random() * 0.5,
      randomWind: Math.random() * 30 - 15
    };
  }, []);

  if (!mounted) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3, y: 0, x: 0 }}
      animate={{
        opacity: [0, 0.6, 0.3, 0], // Tăng độ đậm lên 0.6
        scale: [1 * randomS, 7 * randomS, 14 * randomS],
        y: -350,
        x: [0, randomX + randomWind, (randomX * 3.5) + (randomWind * 3)]
      }}
      transition={{ duration: randomDuration, repeat: Infinity, delay, ease: "linear" }}
      className="absolute w-12 h-12 bg-gradient-to-t from-[rgba(255,255,255,0.4)] via-[rgba(255,255,255,0.15)] to-transparent rounded-full blur-[18px]"
      style={{ bottom: 0 }}
    />
  );
}

