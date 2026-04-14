"use client";

import { motion } from "framer-motion";

interface SettingSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function SettingSection({ title, description, children }: SettingSectionProps) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group"
    >
      {/* Background decoration */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
      
      <div className="relative z-10 flex flex-col gap-6">
        <div>
          <h3 className="text-lg font-serif font-bold text-white mb-1">{title}</h3>
          <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
        </div>
        
        <div className="pt-2">
          {children}
        </div>
      </div>
    </motion.section>
  );
}
