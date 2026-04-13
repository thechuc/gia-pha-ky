import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { RenderIcon, ICON_GRID_ITEMS } from "./IconRegistry";

export function IconPicker({
  selected,
  onSelect,
  label,
}: {
  selected: string;
  onSelect: (name: string) => void;
  label: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label className="text-[10px] font-bold text-secondary/60 uppercase tracking-[0.2em] mb-1.5 block ml-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full px-4 py-2.5 rounded-2xl border border-white/10 bg-white/5 hover:border-secondary/30 transition-all text-left outline-none min-h-[46px]"
      >
        <div className="w-5 h-5 flex items-center justify-center text-secondary/60">
          <RenderIcon name={selected} className="w-4 h-4" />
        </div>
        <span className="text-xs text-secondary/70 flex-1 truncate">{selected}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-secondary/30 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 rounded-xl border border-white/10 bg-[#1A0F0F]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] max-h-[180px] overflow-y-auto animate-fade-slide-up z-[100]">
          <div className="grid grid-cols-8 gap-1.5">
            {ICON_GRID_ITEMS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => { onSelect(name); setIsOpen(false); }}
                title={name}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  selected === name
                    ? "bg-primary text-secondary ring-2 ring-secondary"
                    : "bg-primary/5 text-primary/60 hover:bg-primary/10 hover:text-primary"
                }`}
              >
                <RenderIcon name={name} className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
