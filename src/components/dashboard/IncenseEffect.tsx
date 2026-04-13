"use client";

import React from "react";
import { motion } from "framer-motion";

export function IncenseEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* Container for smoke particles */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
        {/* The Incense stick tip (glowing) */}
        <motion.div 
          animate={{ 
            opacity: [0.4, 0.8, 0.4],
            scale: [1, 1.2, 1],
            boxShadow: [
              "0 0 5px rgba(255,100,0,0.4)",
              "0 0 15px rgba(255,100,0,0.8)",
              "0 0 5px rgba(255,100,0,0.4)"
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="w-1.5 h-1.5 bg-orange-500 rounded-full z-10"
        />
        
        {/* Smoke particles */}
        {[...Array(6)].map((_, i) => (
          <SmokeParticle key={i} delay={i * 0.8} />
        ))}
      </div>
    </div>
  );
}

function SmokeParticle({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 0, x: 0 }}
      animate={{ 
        opacity: [0, 0.3, 0.1, 0],
        scale: [0.5, 2, 4, 6],
        y: -150,
        x: [0, 20, -20, 10, -5],
      }}
      transition={{ 
        duration: 8, 
        repeat: Infinity, 
        delay, 
        ease: "linear"
      }}
      className="absolute w-12 h-12 bg-gradient-to-t from-orange-400/10 via-white/5 to-transparent rounded-full blur-[20px]"
      style={{ bottom: 0 }}
    />
  );
}
