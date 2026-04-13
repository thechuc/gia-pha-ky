import React, { useState, useEffect } from "react";
import { X, Type, MapPin, Star, AlignLeft } from "lucide-react";

export function EditFamilyModal({ isOpen, onClose, info, onSave }: { 
  isOpen: boolean; 
  onClose: () => void; 
  info: any; 
  onSave: (data: any) => Promise<void>; 
}) {
  const [name, setName] = useState("");
  const [motto, setMotto] = useState("");
  const [origin, setOrigin] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (info) {
      setName(info.name || "");
      setMotto(info.motto || "");
      setOrigin(info.origin || "");
      setDescription(info.description || "");
    }
  }, [info]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({ name, motto, origin, description });
      onClose();
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1A0F0F]/95 backdrop-blur-2xl rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] w-[560px] max-w-full max-h-[92vh] overflow-y-auto border border-white/10 animate-fade-slide-up custom-scrollbar">
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-[#140C0C]/50 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary shadow-lg">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-secondary text-xl tracking-wide">Cập nhật thông tin</h3>
              <p className="text-[10px] font-bold text-secondary/40 uppercase tracking-[0.2em]">Chỉnh sửa thông tin chung dòng tộc</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-secondary/30 hover:text-secondary transition-all outline-none">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-secondary/60 uppercase tracking-[0.2em] ml-1">Tên Dòng Họ *</label>
            <div className="relative group">
              <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/30 group-focus-within:text-secondary transition-colors" />
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-white/10 bg-white/5 text-secondary placeholder:text-secondary/20 text-sm focus:outline-none focus:border-secondary/50 focus:ring-4 focus:ring-secondary/5 transition-all outline-none" 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-secondary/60 uppercase tracking-[0.2em] ml-1">Gia Huân / Châm Ngôn</label>
              <div className="relative group">
                <Star className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/30 group-focus-within:text-amber-500 transition-colors" />
                <input 
                  type="text" 
                  value={motto} 
                  onChange={(e) => setMotto(e.target.value)} 
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-white/10 bg-white/5 text-secondary placeholder:text-secondary/20 text-sm focus:outline-none focus:border-secondary/50 focus:ring-4 focus:ring-secondary/5 transition-all outline-none" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-secondary/60 uppercase tracking-[0.2em] ml-1">Quê Quán / Gốc Gác</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/30 group-focus-within:text-secondary transition-colors" />
                <input 
                  type="text" 
                  value={origin} 
                  onChange={(e) => setOrigin(e.target.value)} 
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-white/10 bg-white/5 text-secondary placeholder:text-secondary/20 text-sm focus:outline-none focus:border-secondary/50 focus:ring-4 focus:ring-secondary/5 transition-all outline-none" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-secondary/60 uppercase tracking-[0.2em] ml-1">Lời Giới Thiệu / Gia Phong</label>
            <div className="relative group">
              <AlignLeft className="absolute left-4 top-5 w-4 h-4 text-secondary/30 group-focus-within:text-secondary transition-colors" />
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                rows={6} 
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-white/10 bg-white/5 text-secondary placeholder:text-secondary/20 text-sm focus:outline-none focus:border-secondary/50 focus:ring-4 focus:ring-secondary/5 transition-all outline-none resize-none italic leading-relaxed" 
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 sticky bottom-0 bg-[#1A0F0F] py-4 border-t border-white/5">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSaving} 
              className="flex-1 py-4 rounded-2xl border border-white/10 text-secondary/40 font-black text-[10px] uppercase tracking-widest hover:bg-white/5 hover:text-secondary transition-all"
            >
              Bãi bỏ
            </button>
            <button 
              type="submit" 
              disabled={isSaving} 
              className="flex-1 py-4 rounded-2xl bg-secondary text-primary font-black text-[10px] uppercase tracking-widest hover:brightness-110 hover:shadow-[0_10px_30px_rgba(212,175,55,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  Đang ghi chép...
                </>
              ) : (
                "Lưu di huấn"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
