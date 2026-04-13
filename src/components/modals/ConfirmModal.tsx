"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
  isDanger?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
  onConfirm,
  onClose,
  isDanger = true,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/30 backdrop-blur-[4px] animate-in fade-in" 
        onClick={onClose} 
      />
      
      {/* Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-slide-up border border-secondary/20">
        <div className="p-6 text-center space-y-4">
          <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${isDanger ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-serif font-bold text-primary">{title}</h3>
            <p className="text-sm text-foreground/60 leading-relaxed italic">{message}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-secondary/20 text-foreground/60 font-bold text-sm hover:bg-foreground/5 transition-all"
            >
              {cancelText}
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all ${
                isDanger 
                ? "bg-red-600 text-white hover:bg-red-700" 
                : "bg-primary text-secondary"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
