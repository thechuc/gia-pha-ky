"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Info, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "info";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  type = "info",
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-[#1A1110] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden backdrop-blur-xl"
            >
              {/* Header Icon */}
              <div className={`h-24 flex items-center justify-center ${type === 'danger' ? 'bg-rose-500/10' : 'bg-primary/10'}`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${type === 'danger' ? 'bg-rose-500/20 text-rose-500' : 'bg-primary/20 text-primary'}`}>
                  {type === 'danger' ? <AlertTriangle className="w-8 h-8" /> : <Info className="w-8 h-8" />}
                </div>
              </div>

              {/* Content */}
              <div className="p-8 text-center space-y-3">
                <h3 className="text-2xl font-serif font-bold text-white tracking-tight">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
              </div>

              {/* Footer */}
              <div className="p-6 px-8 bg-white/[0.02] border-t border-white/5 flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 py-3.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`flex-1 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2
                    ${type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-primary hover:bg-primary/90 text-secondary'}
                  `}
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {confirmText}
                </button>
              </div>

              {/* Close button inside modal (optional) */}
              {!isLoading && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
