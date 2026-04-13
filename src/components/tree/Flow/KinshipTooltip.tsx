import React from 'react';

export function KinshipTooltip({ title, x, y }: { title: string, x: number, y: number }) {
  if (!title) return null;
  return (
    <div 
      className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-[130%]"
      style={{ left: x, top: y }}
    >
      <div className="bg-slate-800 text-white text-[11px] font-bold font-serif tracking-wide px-4 py-2 rounded-lg shadow-xl relative animate-in fade-in zoom-in duration-200">
        Sẽ gọi là: <span className="text-yellow-400">{title}</span>
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
      </div>
    </div>
  );
}
