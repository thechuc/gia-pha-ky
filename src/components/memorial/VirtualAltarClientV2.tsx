"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Send, History, X, MessageSquare } from "lucide-react";
import type { MemorialMember } from "@/app/actions/memorial";
import { addMemorialComment } from "@/app/actions/memorial";
import { lightIncenseAction } from "@/app/actions/events";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";
// Removed complex CNC components for minimalist frame design
import "./virtual-altar-v2.css";

interface VirtualAltarClientProps {
  member: MemorialMember;
}

// SVG Defs shared across altar components
function AltarSVGDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <filter id="rough-texture">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" result="noise" />
          <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0   0 0 0 0.4 0" in="noise" result="coloredNoise" />
          <feComposite operator="in" in="coloredNoise" in2="SourceGraphic" result="maskedNoise" />
          <feBlend in="SourceGraphic" in2="maskedNoise" mode="darken" />
        </filter>

        <pattern id="apron-pattern" x="0" y="0" width="80" height="40" patternUnits="userSpaceOnUse">
          <path d="M 0 10 L 30 10 L 30 30 L 20 30 L 20 20 L 10 20 L 10 30 L 0 30" fill="none" stroke="#140a05" strokeWidth="3"/>
          <path d="M 40 30 L 70 30 L 70 10 L 60 10 L 60 20 L 50 20 L 50 10 L 40 10" fill="none" stroke="#140a05" strokeWidth="3"/>
          <path d="M 0 10 L 30 10 L 30 30 L 20 30 L 20 20 L 10 20 L 10 30 L 0 30" fill="none" stroke="#4a2717" strokeWidth="1" transform="translate(0, -1)"/>
          <path d="M 40 30 L 70 30 L 70 10 L 60 10 L 60 20 L 50 20 L 50 10 L 40 10" fill="none" stroke="#4a2717" strokeWidth="1" transform="translate(0, -1)"/>
          <rect x="35" y="15" width="10" height="10" fill="none" stroke="#140a05" strokeWidth="2"/>
          <rect x="35" y="15" width="10" height="10" fill="none" stroke="#4a2717" strokeWidth="1" transform="translate(0, -1)"/>
        </pattern>

        <linearGradient id="va-bronze" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2c1e08" />
          <stop offset="15%" stopColor="#8a631c" />
          <stop offset="50%" stopColor="#ffd700" />
          <stop offset="85%" stopColor="#8a631c" />
          <stop offset="100%" stopColor="#2c1e08" />
        </linearGradient>
        <linearGradient id="va-bronze-dark" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1c1204" />
          <stop offset="50%" stopColor="#5c4305" />
          <stop offset="100%" stopColor="#1c1204" />
        </linearGradient>
        <radialGradient id="va-ash" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#aaa" />
          <stop offset="70%" stopColor="#666" />
          <stop offset="100%" stopColor="#333" />
        </radialGradient>
        <linearGradient id="va-wood-centered" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1f0c01" />
          <stop offset="25%" stopColor="#5c2908" />
          <stop offset="50%" stopColor="#8b4513" />
          <stop offset="75%" stopColor="#5c2908" />
          <stop offset="100%" stopColor="#1f0c01" />
        </linearGradient>

        <pattern id="va-diamond-band" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M 8 2 L 16 8 L 8 14 L 0 8 Z" fill="none" stroke="#d4af37" strokeWidth="1" opacity="0.6"/>
          <circle cx="8" cy="8" r="1.5" fill="#ffdf00" opacity="0.8"/>
        </pattern>

        <linearGradient id="va-glossy-wood" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#210800" />
          <stop offset="10%" stopColor="#4a1501" />
          <stop offset="25%" stopColor="#9e3505" />
          <stop offset="35%" stopColor="#d95a16" />
          <stop offset="42%" stopColor="#f58a3f" />
          <stop offset="48%" stopColor="#d95a16" />
          <stop offset="65%" stopColor="#732100" />
          <stop offset="85%" stopColor="#3d0e00" />
          <stop offset="100%" stopColor="#140400" />
        </linearGradient>
        <linearGradient id="va-glossy-wood-dark" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#140400" />
          <stop offset="35%" stopColor="#4a1300" />
          <stop offset="50%" stopColor="#731f00" />
          <stop offset="80%" stopColor="#2a0a00" />
          <stop offset="100%" stopColor="#0a0200" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Incense Bowl SVG Component
function IncenseBowlSVG() {
  return (
    <>
      {/* Inner bowl */}
      <svg width="100%" height="100%" viewBox="0 0 220 170" style={{ position: "absolute", bottom: 0, zIndex: 30 }}>
        <path d="M 35 45 A 75 14 0 0 1 185 45 L 175 45 A 65 11 0 0 0 45 45 Z" fill="#5c4305"/>
        <path d="M 45 45 A 65 11 0 0 1 175 45 L 175 52 A 65 11 0 0 0 45 52 Z" fill="#150a02"/>
        <path d="M 45 52 A 65 11 0 0 1 175 52 Z" fill="#3a3a3a"/>
      </svg>
      {/* Outer bowl + details */}
      <svg width="100%" height="100%" viewBox="0 0 220 170" style={{ position: "absolute", bottom: 0, pointerEvents: "none", zIndex: 32 }}>
        <path d="M 45 52 A 65 11 0 0 0 175 52 Z" fill="url(#va-ash)"/>
        <g opacity="0.85">
          <circle cx="110" cy="55" r="1.5" fill="#ccc" />
          <circle cx="95" cy="57" r="1" fill="#fff" />
          <circle cx="125" cy="56" r="2" fill="#aaa" />
          <circle cx="75" cy="54" r="1.5" fill="#eee" />
          <circle cx="145" cy="55" r="1.5" fill="#bbb" />
          <circle cx="85" cy="59" r="1" fill="#ddd" />
          <circle cx="135" cy="58" r="1.2" fill="#ccc" />
          <circle cx="105" cy="60" r="0.8" fill="#fff" />
          <circle cx="115" cy="57" r="1.2" fill="#aaa" />
          <circle cx="160" cy="54" r="1" fill="#999" />
          <circle cx="60" cy="53" r="1.5" fill="#bbb" />
          <circle cx="100" cy="58" r="2.5" fill="#ff4500" opacity="0.3"/>
          <circle cx="100" cy="58" r="1.5" fill="#ff4500" opacity="0.9"/>
          <circle cx="120" cy="57" r="2" fill="#ff4500" opacity="0.3"/>
          <circle cx="120" cy="57" r="1" fill="#ff4500" opacity="0.8"/>
          <circle cx="110" cy="60" r="1.2" fill="#ff4500" opacity="0.85"/>
        </g>
        {/* Wooden base */}
        <ellipse cx="110" cy="135" rx="82" ry="16" fill="#1f0c01"/>
        <path d="M 28 135 L 25 148 A 85 16 0 0 0 195 148 L 192 135 Z" fill="url(#va-wood-centered)"/>
        <path d="M 28 135 A 82 16 0 0 0 192 135" fill="none" stroke="#8b4513" strokeWidth="1.5"/>
        {/* Bowl body */}
        <path d="M 35 45 A 75 14 0 0 0 185 45 L 185 130 A 75 14 0 0 1 35 130 Z" fill="url(#va-bronze)"/>
        {/* Band */}
        <path d="M 35 52 A 75 14 0 0 0 185 52 L 185 68 A 75 14 0 0 1 35 68 Z" fill="url(#va-bronze-dark)"/>
        <path d="M 35 52 A 75 14 0 0 0 185 52 L 185 68 A 75 14 0 0 1 35 68 Z" fill="url(#va-diamond-band)"/>
        <path d="M 35 52 A 75 14 0 0 0 185 52" fill="none" stroke="#ffdf00" strokeWidth="1.5" filter="drop-shadow(0 1px 1px rgba(0,0,0,0.5))"/>
        <path d="M 35 68 A 75 14 0 0 0 185 68" fill="none" stroke="#d4af37" strokeWidth="2.5" filter="drop-shadow(0 2px 2px rgba(0,0,0,0.6))"/>
        {/* Base ring */}
        <path d="M 35 120 A 75 14 0 0 0 185 120 L 185 124 A 75 14 0 0 1 35 124 Z" fill="url(#va-bronze-dark)"/>
        <path d="M 35 120 A 75 14 0 0 0 185 120" fill="none" stroke="#d4af37" strokeWidth="1"/>
        {/* Rim */}
        <path d="M 35 45 A 75 14 0 0 0 185 45 L 175 45 A 65 11 0 0 1 45 45 Z" fill="url(#va-bronze)"/>
        <path d="M 35 45 A 75 14 0 0 0 185 45" fill="none" stroke="#ffdf00" strokeWidth="2.5" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.5))"/>
        <path d="M 45 45 A 65 11 0 0 0 175 45" fill="none" stroke="#d4af37" strokeWidth="1.5"/>
        {/* Yin-Yang */}
        <g transform="translate(110, 109)" filter="drop-shadow(0px 5px 6px rgba(0,0,0,0.85))">
          <circle cx="0" cy="0" r="27" fill="url(#va-bronze-dark)"/>
          <circle cx="0" cy="0" r="25" fill="none" stroke="#8a631c" strokeWidth="3" strokeDasharray="4 3"/>
          <circle cx="0" cy="0" r="23" fill="#1a1103" stroke="#ffdf00" strokeWidth="1.5"/>
          <g transform="rotate(-15)">
            <path d="M 0 -21 A 21 21 0 0 0 0 21 A 10.5 10.5 0 0 1 0 0 A 10.5 10.5 0 0 0 0 -21 Z" fill="#3B170B"/>
            <path d="M 0 -21 A 21 21 0 0 1 0 21 A 10.5 10.5 0 0 1 0 0 A 10.5 10.5 0 0 0 0 -21 Z" fill="#d4af37"/>
            <circle cx="0" cy="-10.5" r="4" fill="#2A120A" />
            <circle cx="0" cy="10.5" r="4" fill="#ffdf00" />
          </g>
          <path d="M -23 0 A 23 23 0 0 1 23 0 A 23 13 0 0 0 -23 0" fill="rgba(255, 240, 180, 0.25)"/>
          <path d="M -23 0 A 23 23 0 0 0 23 0 A 23 13 0 0 1 -23 0" fill="rgba(0, 0, 0, 0.45)"/>
        </g>
      </svg>
    </>
  );
}

// Incense Box SVG Component
function IncenseBoxSVG({ sticksGroupRef }: { sticksGroupRef: React.RefObject<SVGGElement | null> }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 420" preserveAspectRatio="none" style={{ position: "absolute", bottom: 0 }}>
      <path d="M 12 410 A 38 8 0 0 0 88 410 L 85 395 A 35 7 0 0 1 15 395 Z" fill="url(#va-glossy-wood)"/>
      <ellipse cx="50" cy="395" rx="35" ry="7" fill="url(#va-glossy-wood-dark)"/>
      <path d="M 15 395 A 35 7 0 0 0 85 395 C 85 385, 75 375, 68 365 A 18 4 0 0 1 32 365 C 25 375, 15 385, 15 395 Z" fill="url(#va-glossy-wood)"/>
      <ellipse cx="50" cy="365" rx="18" ry="4" fill="url(#va-glossy-wood-dark)"/>
      <path d="M 32 365 A 18 4 0 0 0 68 365 C 74 350, 78 330, 75 310 A 25 5 0 0 1 25 310 C 22 330, 26 350, 32 365 Z" fill="url(#va-glossy-wood)"/>
      <ellipse cx="50" cy="310" rx="25" ry="5" fill="url(#va-glossy-wood-dark)"/>
      <path d="M 25 310 A 25 5 0 0 0 75 310 C 78 308, 80 305, 78 300 A 28 6 0 0 1 22 300 C 20 305, 22 308, 25 310 Z" fill="url(#va-glossy-wood)"/>
      <ellipse cx="50" cy="300" rx="28" ry="6" fill="url(#va-glossy-wood-dark)"/>
      <path d="M 22 300 A 28 6 0 0 0 78 300 C 80 297, 80 293, 77 290 A 27 5 0 0 1 23 290 C 20 293, 20 297, 22 300 Z" fill="url(#va-glossy-wood)"/>
      <ellipse cx="50" cy="290" rx="27" ry="5" fill="url(#va-glossy-wood-dark)"/>
      <path d="M 23 290 A 27 5 0 0 0 77 290 C 75 260, 80 240, 85 220 A 35 7 0 0 1 15 220 C 20 240, 25 260, 23 290 Z" fill="url(#va-glossy-wood)"/>
      <ellipse cx="50" cy="220" rx="35" ry="7" fill="url(#va-glossy-wood-dark)"/>
      <path d="M 15 220 A 35 7 0 0 0 85 220 C 90 220, 96 210, 96 200 A 46 10 0 0 1 4 200 C 4 210, 10 220, 15 220 Z" fill="url(#va-glossy-wood)"/>
      <ellipse cx="50" cy="200" rx="46" ry="10" fill="url(#va-glossy-wood)"/>
      <ellipse cx="50" cy="200" rx="35" ry="7" fill="#1f0600"/>
      <ellipse cx="50" cy="202" rx="30" ry="5" fill="#000" opacity="0.9" filter="blur(2px)"/>
      <g ref={sticksGroupRef}></g>
      <path d="M 15 200 A 35 7 0 0 0 85 200 L 96 200 A 46 10 0 0 1 4 200 Z" fill="url(#va-glossy-wood)"/>
      <path d="M 15 200 A 35 7 0 0 0 85 200" fill="none" stroke="#f58a3f" strokeWidth="0.8" opacity="0.4"/>
    </svg>
  );
}

// Smoke particle system class
class SmokeParticle {
  x: number;
  y: number;
  size: number;
  maxSize: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.size = 2;
    this.maxSize = 25 + Math.random() * 15;
    this.vx = (Math.random() - 0.5) * 0.3;
    this.vy = -(0.5 + Math.random() * 0.5);
    this.life = 0;
    this.maxLife = 120 + Math.random() * 60;
  }

  update(globalWindX: number) {
    this.life++;
    const progress = this.life / this.maxLife;
    this.x += this.vx + (globalWindX * progress * 2.5);
    this.y += this.vy;
    if (this.size < this.maxSize) {
      this.size += 0.2;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const progress = this.life / this.maxLife;
    if (progress >= 1) return;
    const alpha = (1 - progress) * 0.04;
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
    gradient.addColorStop(0, `rgba(225, 230, 235, ${alpha})`);
    gradient.addColorStop(1, 'rgba(225, 230, 235, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

interface ActiveStick {
  wrapper: HTMLDivElement;
  burnEl: HTMLDivElement;
  plantedTime: number;
  x: number;
  y: number;
}

export default function VirtualAltarClientV2({ member }: VirtualAltarClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { showToast } = useToast();

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const plantedAreaRef = useRef<HTMLDivElement>(null);
  const sticksGroupRef = useRef<SVGGElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const cursorStickRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // State
  const [isHolding, setIsHolding] = useState(false);
  const [litCandles, setLitCandles] = useState({ left: false, right: false });
  const [statusText, setStatusText] = useState("Vui lòng chạm vào 2 ngọn nến phía sau để thắp sáng sảnh đường");
  const [statusColor, setStatusColor] = useState("#d4af37");
  const [panelOpen, setPanelOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [altarScale, setAltarScale] = useState(1);

  // Mutable refs for animation
  const activeSticksRef = useRef<ActiveStick[]>([]);
  const particlesRef = useRef<SmokeParticle[]>([]);
  const windTimeRef = useRef(Math.random() * 100);
  const isHoldingRef = useRef(false);
  const animFrameRef = useRef<number>(0);

  // Sync isHolding to ref
  useEffect(() => {
    isHoldingRef.current = isHolding;
  }, [isHolding]);

  const BURN_DURATION_MS = 5 * 60 * 1000;

  // Generate old sticks
  const createOldSticks = useCallback(() => {
    const area = plantedAreaRef.current;
    if (!area) return;
    const numOldSticks = Math.floor(Math.random() * 20) + 30;
    for (let i = 0; i < numOldSticks; i++) {
      const el = document.createElement("div");
      el.className = "old-stick";
      const height = Math.random() * 35 + 10;
      el.style.height = height + "px";
      const randomX = 5 + Math.random() * 90;
      const randomY = Math.random() * 100;
      const angle = (Math.random() - 0.5) * 20;
      el.style.left = randomX + "%";
      el.style.bottom = randomY + "%";
      el.style.transform = `rotate(${angle}deg)`;
      el.style.zIndex = String(Math.round(100 - randomY));
      const tipOpacity = Math.random() > 0.3 ? (0.4 + Math.random() * 0.5) : (0.05 + Math.random() * 0.2);
      el.style.setProperty("--tip-opacity", String(tipOpacity));
      area.appendChild(el);
    }
  }, []);

  // Generate sticks in box
  const generateBoxSticks = useCallback(() => {
    const group = sticksGroupRef.current;
    if (!group) return;
    const sticks: { baseX: number; baseY: number; topX: number; topY: number; midX: number; midY: number }[] = [];
    for (let i = 0; i < 60; i++) {
      const r = Math.sqrt(Math.random()) * 30;
      const theta = Math.random() * Math.PI * 2;
      const baseX = 50 + r * Math.cos(theta);
      const baseY = 200 + r * Math.sin(theta) * (7 / 35);
      const spread = (baseX - 50) * 0.7 + (Math.random() - 0.5) * 8;
      const topX = baseX + spread;
      const topY = 40 + Math.random() * 110;
      const dx = baseX - topX;
      const dy = baseY - topY;
      const length = Math.sqrt(dx * dx + dy * dy);
      const redLen = 15 + Math.random() * 8;
      const ratio = (length - redLen) / length;
      const midX = topX + dx * ratio;
      const midY = topY + dy * ratio;
      sticks.push({ baseX, baseY, topX, topY, midX, midY });
    }
    sticks.sort((a, b) => a.baseY - b.baseY);
    let html = "";
    sticks.forEach((s) => {
      const stickColor = ["#5a3d2b", "#4d3324", "#6b4a36", "#543827"][Math.floor(Math.random() * 4)];
      const redColor = ["#9e0000", "#cc0000", "#7a0000"][Math.floor(Math.random() * 3)];
      const width = 2 + Math.random() * 1.5;
      html += `<g stroke-linecap="round">
        <line x1="${s.topX}" y1="${s.topY}" x2="${s.midX}" y2="${s.midY}" stroke="${stickColor}" stroke-width="${width}" />
        <line x1="${s.midX}" y1="${s.midY}" x2="${s.baseX}" y2="${s.baseY}" stroke="${redColor}" stroke-width="${width}" />
      </g>`;
    });
    group.innerHTML = html;
  }, []);

  // Best planting position
  const getBestPlantPosition = useCallback(() => {
    const sticks = activeSticksRef.current;
    if (sticks.length === 0) return { x: 50, y: 50 };
    let bestCandidate = { x: 50, y: 50 };
    let bestScore = -Infinity;
    for (let i = 0; i < 50; i++) {
      const r = Math.pow(Math.random(), 0.8) * 45;
      const angle = Math.random() * Math.PI * 2;
      let cx = 50 + r * Math.cos(angle);
      let cy = 50 + r * Math.sin(angle);
      cx = Math.max(5, Math.min(95, cx));
      cy = Math.max(0, Math.min(100, cy));
      let minDistPx = Infinity;
      for (const stick of sticks) {
        const dxPx = ((cx - stick.x) / 100) * 80;
        const dyPx = ((cy - stick.y) / 100) * 10;
        const distPx = Math.sqrt(dxPx * dxPx + dyPx * dyPx);
        if (distPx < minDistPx) minDistPx = distPx;
      }
      const dCenterXPx = ((cx - 50) / 100) * 80;
      const dCenterYPx = ((cy - 50) / 100) * 10;
      const distCenterPx = Math.sqrt(dCenterXPx * dCenterXPx + dCenterYPx * dCenterYPx);
      const score = Math.min(minDistPx, 5) * 10 - distCenterPx;
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = { x: cx, y: cy };
      }
    }
    return bestCandidate;
  }, []);

  // Plant incense
  const plantIncense = useCallback(() => {
    const area = plantedAreaRef.current;
    if (!area) return;
    const wrapper = document.createElement("div");
    wrapper.className = "incense-stick";
    const ashHeight = 0.5 + Math.random() * 2;
    const ashAngle = (Math.random() - 0.5) * 40;
    const glowSpeed = 2 + Math.random() * 2;
    const glowDelay = -(Math.random() * 5);
    const emberRadius = Math.random() > 0.5 ? "50%" : "2px";
    const tipOpacity = Math.random() > 0.3 ? (0.4 + Math.random() * 0.5) : (0.05 + Math.random() * 0.2);
    wrapper.style.setProperty("--ash-height", ashHeight + "px");
    wrapper.style.setProperty("--ash-angle", ashAngle + "deg");
    wrapper.style.setProperty("--glow-speed", glowSpeed + "s");
    wrapper.style.setProperty("--glow-delay", glowDelay + "s");
    wrapper.style.setProperty("--ember-radius", emberRadius);
    const stickBurn = document.createElement("div");
    stickBurn.className = "stick-burn";
    const stickBase = document.createElement("div");
    stickBase.className = "stick-base";
    stickBase.style.setProperty("--tip-opacity", String(tipOpacity));
    wrapper.appendChild(stickBurn);
    wrapper.appendChild(stickBase);
    const pos = getBestPlantPosition();
    wrapper.style.left = pos.x + "%";
    wrapper.style.bottom = pos.y + "%";
    wrapper.style.zIndex = String(Math.round(100 - pos.y));
    area.appendChild(wrapper);
    activeSticksRef.current.push({
      wrapper,
      burnEl: stickBurn,
      plantedTime: Date.now(),
      x: pos.x,
      y: pos.y,
    });

    // Server action to persist
    lightIncenseAction(member.id).then(() => {
      router.refresh();
    }).catch(console.error);
  }, [member.id, getBestPlantPosition, router]);

  // Temple bell sound
  const playTempleBell = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime;
    const freqs = [350, 698, 1050, 1400];
    const gains = [1, 0.4, 0.2, 0.1];
    freqs.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(gains[index] * 0.8, t + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 5);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 5);
    });
    // Flash
    if (flashRef.current) {
      const flash = flashRef.current;
      flash.style.transition = "none";
      flash.style.opacity = "1";
      setTimeout(() => {
        flash.style.transition = "opacity 2s ease-out";
        flash.style.opacity = "0";
      }, 50);
    }
  }, []);

  // Initialize
  useEffect(() => {
    createOldSticks();
    generateBoxSticks();

    // Canvas resize
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const p = canvas.parentElement;
      const w = p?.clientWidth || window.innerWidth;
      const h = p?.clientHeight || window.innerHeight;
      canvas.width = w;
      canvas.height = h;

      const scaleX = w / 1370;
      const scaleY = h / 768;
      setAltarScale(Math.min(1, scaleX, scaleY));
    };
    resize();
    window.addEventListener("resize", resize);

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      windTimeRef.current += 0.005;
      const globalWindX = Math.sin(windTimeRef.current) * 0.6 + Math.sin(windTimeRef.current * 0.25) * 0.8;

      // Update burning sticks
      const sticks = activeSticksRef.current;
      for (let i = sticks.length - 1; i >= 0; i--) {
        const stickObj = sticks[i];
        const elapsed = Date.now() - stickObj.plantedTime;
        let progress = 1 - (elapsed / BURN_DURATION_MS);
        if (progress <= 0) {
          progress = 0;
          stickObj.wrapper.classList.add("burned-out");
          sticks.splice(i, 1);
        }
        stickObj.burnEl.style.height = (100 * progress) + "px";
      }

      // Filter dead particles
      particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife);

      // Emit smoke
      sticks.forEach((stickObj) => {
        const rect = stickObj.burnEl.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        const tipX = rect.left + rect.width / 2 - canvasRect.left;
        const tipY = rect.top - canvasRect.top;
        if (Math.random() > 0.88) {
          particlesRef.current.push(new SmokeParticle(tipX, tipY));
        }
      });

      // Draw particles
      particlesRef.current.forEach((p) => {
        p.update(globalWindX);
        p.draw(ctx);
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [createOldSticks, generateBoxSticks, BURN_DURATION_MS]);

  // Cursor tracking
  useEffect(() => {
    const handleMove = (x: number, y: number) => {
      if (!isHoldingRef.current || !cursorStickRef.current) return;
      cursorStickRef.current.style.left = x + "px";
      cursorStickRef.current.style.top = y + "px";
    };
    const onMouse = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    document.addEventListener("mousemove", onMouse);
    document.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      document.removeEventListener("mousemove", onMouse);
      document.removeEventListener("touchmove", onTouch);
    };
  }, []);

  // Pick up incense from box
  const handleBoxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!litCandles.left || !litCandles.right) {
      setStatusText("Vui lòng thắp sáng cả 2 ngọn nến trước khi lấy nhang");
      setStatusColor("#ffcc00");
      setTimeout(() => setStatusColor("#d4af37"), 2000);
      return;
    }

    if (!isHolding) {
      setIsHolding(true);
      setStatusText("2. Nhấp vào bát nhang để cắm nhang");
      setStatusColor("#fff");
      if (cursorStickRef.current) {
        cursorStickRef.current.style.left = e.clientX + "px";
        cursorStickRef.current.style.top = e.clientY + "px";
      }
    }
  };

  // Plant in bowl
  const handleBowlClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isHolding) {
      setIsHolding(false);
      setStatusText("Tâm tĩnh lặng. Khói trầm toả ngát.");
      setStatusColor("#d4af37");
      plantIncense();
    }
  };

  // Cancel hold on room click
  const handleRoomClick = () => {
    if (isHolding) {
      setIsHolding(false);
      setStatusText("1. Chạm vào ống nhang bên phải để lấy nhang");
      setStatusColor("#d4af37");
    } else if (!litCandles.left || !litCandles.right) {
      setStatusText("Vui lòng chạm vào 2 ngọn nến phía sau để thắp sáng sảnh đường");
      setStatusColor("#d4af37");
    }
  };

  // Light candle
  const handleCandleClick = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.stopPropagation();
    if (litCandles[side]) return;

    setLitCandles(prev => {
      const newState = { ...prev, [side]: true };
      if (newState.left && newState.right) {
        setStatusText("1. Chạm vào ống nhang bên phải để lấy nhang");
        setStatusColor("#d4af37");
      } else {
        setStatusText("Xin hãy thắp ngọn nến còn lại");
      }
      return newState;
    });
  };

  // Submit comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    try {
      const authorName = session?.user?.name || "Thành viên gia tộc";
      await addMemorialComment(member.id, authorName, commentText);
      setCommentText("");
      showToast("Đã gửi lời tưởng nhớ.", "success");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Lỗi khi gửi lời tưởng nhớ.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-screen relative overflow-hidden" style={{ touchAction: "manipulation" }}>
      <AltarSVGDefs />

      <div className="altar-room" onClick={handleRoomClick}>
        <div ref={flashRef} className="va-flash-overlay" />
        <canvas ref={canvasRef} />

        {/* UI Layer */}
        <div className="va-ui-layer">
          <div className="va-ui-text" style={{ color: statusColor, borderColor: statusColor }}>
            {statusText}
          </div>
          <button className="va-btn-bell" onClick={(e) => { e.stopPropagation(); playTempleBell(); }}>
            🔔 Thỉnh Chuông
          </button>
        </div>

        {/* Back button */}
        <button className="va-back-btn" onClick={(e) => { e.stopPropagation(); router.push("/dashboard/memorial"); }}>
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>

        {/* Panel toggle button */}
        <button className="va-panel-toggle" onClick={(e) => { e.stopPropagation(); setPanelOpen(!panelOpen); }}>
          <MessageSquare className="w-4 h-4" />
          Lời tri ân
        </button>

        {/* CNC Wall Background Tối Giản */}
        <div className="cnc-wall-container">
          {/* Lớp khung chữ Vạn bên ngoài cùng */}
          <div className="cnc-outer-swastika-frame">
            <div className="cnc-swastika-left" />
            <div className="cnc-swastika-right" />
            <div className="cnc-swastika-top" />
          </div>
          
          {/* Lớp Nẹp góc gập chữ G bên trong */}
          <div className="cnc-inner-clean-frame" />
        </div>

        <div className="altar-scene" style={{ "--altar-scale": altarScale } as React.CSSProperties}>
          {/* 3D Altar Structure */}
          <div className="altar-3d-wrapper">
          <div className="altar-top-surface" />
          <div className="altar-ear left" />
          <div className="altar-ear right" />
          <div className="altar-front-structure">
            <div className="altar-apron" />
            <div className="altar-lower-shelf" />
            <div className="altar-legs-area">
              <div className="altar-leg left" style={{ position: "relative" }}>
                <div className="altar-bracket top-right" />
                <div className="altar-bracket bottom-right" />
              </div>
              <div className="altar-stretcher" />
              <div className="altar-leg right" style={{ position: "relative" }}>
                <div className="altar-bracket top-left" />
                <div className="altar-bracket bottom-left" />
              </div>
            </div>
          </div>
        </div>

        {/* Portrait Frame */}
        <div className="altar-portrait-frame">
          <div className="altar-portrait-inner">
            {member.avatar ? (
              <img src={member.avatar} alt={member.fullName} />
            ) : (
              <div className="altar-portrait-initial">
                {member.fullName.charAt(0)}
              </div>
            )}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)" }} />
          </div>
          <div className="altar-portrait-name">{member.fullName}</div>
          <div className="altar-portrait-sub">
            Đời {member.generation} · {member.birthYear || "?"} — {member.deathYear || "?"}
          </div>
        </div>

        {/* Ngũ Sự Set */}
        <div className="altar-set-container">
          <div className="shadow-set" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/ngu_su.png" alt="Bộ Ngũ Sự" className="altar-set-img" style={{ pointerEvents: 'none' }} />
          <div 
            className="candle-wrapper left"
            onClick={(e) => handleCandleClick(e, 'left')}
            title="Chạm để thắp nến"
          >
            <div className="candle-body" />
            <div className="candle-wick" />
            <div className={`candle-light-group ${litCandles.left ? 'active' : ''}`}>
              <div className="candle-halo" />
              <div className="candle-flame-obj" />
            </div>
          </div>
          <div 
            className="candle-wrapper right"
            onClick={(e) => handleCandleClick(e, 'right')}
            title="Chạm để thắp nến"
          >
            <div className="candle-body" />
            <div className="candle-wick" />
            <div className={`candle-light-group ${litCandles.right ? 'active' : ''}`}>
              <div className="candle-halo" />
              <div className="candle-flame-obj" />
            </div>
          </div>
        </div>

        {/* Incense Bowl */}
        <div className="bowl-container" onClick={handleBowlClick}>
          <div className="shadow-bowl" />
          <IncenseBowlSVG />
          <div className="planted-sticks-area" ref={plantedAreaRef} />
        </div>

        {/* Incense Box */}
        <div className="incense-box" onClick={handleBoxClick}>
          <div className="shadow-box" />
          <IncenseBoxSVG sticksGroupRef={sticksGroupRef} />
        </div>
        </div>

        {/* Side Panel - Lời Tri Ân */}
        <div className={`va-side-panel ${panelOpen ? "open" : ""}`} onClick={(e) => e.stopPropagation()}>
          <div className="va-side-panel-header">
            <h3 className="text-lg font-serif font-bold text-[#F9F5EB] flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500/70" />
              Lời Tri Ân
            </h3>
            <button onClick={() => setPanelOpen(false)} className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Bio */}
          {member.biography && (
            <div className="px-6 py-4 border-b border-white/5 bg-[#201313]/50">
              <h4 className="flex items-center gap-2 text-xs font-bold text-[#E2D1B0]/70 uppercase tracking-widest mb-2">
                <History className="w-3.5 h-3.5" /> Tiểu sử
              </h4>
              <p className="text-sm text-[#F9F5EB]/70 leading-relaxed italic">
                &ldquo;{member.biography}&rdquo;
              </p>
            </div>
          )}

          {/* Comments */}
          <div className="va-side-panel-content space-y-4">
            {member.comments.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <Heart className="w-8 h-8 text-[#E2D1B0]/20 mx-auto mb-3" />
                <p className="text-sm text-[#E2D1B0]/60">Chưa có lời tưởng nhớ nào.</p>
                <p className="text-xs text-[#E2D1B0]/40 mt-1">Hãy là người đầu tiên dâng lời tri ân.</p>
              </div>
            ) : (
              [...member.comments].reverse().map((comment) => (
                <div key={comment.id} className="bg-[#2A1818]/30 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#F9F5EB] text-sm">{comment.authorId}</span>
                    <span className="text-[10px] text-[#E2D1B0]/40 uppercase tracking-wider">
                      {format(new Date(comment.createdAt), "dd/MM/yyyy")}
                    </span>
                  </div>
                  <p className="text-sm text-[#E2D1B0]/70 leading-relaxed">{comment.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          <div className="va-side-panel-footer">
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
      </div>

      {/* Cursor stick */}
      <div ref={cursorStickRef} className={`cursor-stick ${isHolding ? "active" : ""}`}>
        <div className="incense-stick" style={{ position: "relative", ["--ash-height" as any]: "2px", ["--ash-angle" as any]: "-10deg" }}>
          <div className="stick-burn" />
          <div className="stick-base" />
        </div>
      </div>
    </div>
  );
}
