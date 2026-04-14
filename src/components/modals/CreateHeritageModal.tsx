"use client";

import React, { useState } from "react";
import {
  X,
  Shield,
  User,
  MapPin,
  Star,
  BookOpen,
  ChevronRight,
  Sparkles,
  Trash2,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { initializeHeritage, clearAllData } from "@/app/actions/family_setup";

interface CreateHeritageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateHeritageModal({ isOpen, onClose, onSuccess }: CreateHeritageModalProps) {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Family State
  const [familyName, setFamilyName] = useState("");
  const [familyMotto, setFamilyMotto] = useState("");
  const [familyOrigin, setFamilyOrigin] = useState("");
  const [familyDescription, setFamilyDescription] = useState("");

  // Ancestor State
  const [ancestorFirstName, setAncestorFirstName] = useState("");
  const [ancestorLastName, setAncestorLastName] = useState("");
  const [ancestorHonorific, setAncestorHonorific] = useState("");
  const [ancestorAlias, setAncestorAlias] = useState("");
  const [ancestorTitle, setAncestorTitle] = useState("");

  if (!isOpen) return null;

  const handleClear = async () => {
    setIsClearing(true);
    try {
      await clearAllData();
      showToast("Đã xóa toàn bộ dữ liệu thành công.", "success");
      setShowClearConfirm(false);
      window.location.reload();
    } catch (error) {
      showToast("Lỗi khi xóa dữ liệu.", "error");
    } finally {
      setIsClearing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      const familyData = {
        name: familyName,
        motto: familyMotto,
        origin: familyOrigin,
        description: familyDescription,
      };
      const ancestorData = {
        firstName: ancestorFirstName,
        lastName: ancestorLastName,
        honorific: ancestorHonorific,
        alias: ancestorAlias,
        title: ancestorTitle,
        gender: "MALE",
      };

      await initializeHeritage(familyData, ancestorData);
      showToast("Đã khởi tạo di sản dòng tộc thành công!", "success");
      onSuccess();
      onClose();
    } catch (error) {
      showToast("Lỗi khi khởi tạo di sản.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0A0505]/95 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#1A0F0F] border border-secondary/20 rounded-[32px] shadow-2xl overflow-hidden animate-fade-slide-up">
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 bg-gradient-to-r from-primary/20 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-secondary tracking-wide">
                {step === 1 ? "Khởi Tạo Di Sản Dòng Tộc" : "Thiết Lập Thủy Tổ (Đời 1)"}
              </h3>
              <p className="text-[11px] text-[#E2D1B0]/50 uppercase tracking-[0.2em] font-bold">
                Bước {step} trên 2
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors text-secondary/40">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {step === 1 ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-secondary/40 uppercase tracking-widest pl-1">Tên Dòng Họ *</label>
                  <input
                    type="text" required value={familyName} onChange={e => setFamilyName(e.target.value)}
                    placeholder="VD: Ngô Quý,  Tộc..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder:text-secondary/30 text-sm focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-secondary/40 uppercase tracking-widest pl-1">Slogan / Gia Huấn</label>
                  <input
                    type="text" value={familyMotto} onChange={e => setFamilyMotto(e.target.value)}
                    placeholder="VD: Uống nước nhớ nguồn"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder:text-secondary/30 text-sm focus:outline-none focus:border-secondary/50 transition-all font-serif italic"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-secondary/40 uppercase tracking-widest pl-1">Nguồn Gốc (Quê Quán)</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/30" />
                  <input
                    type="text" value={familyOrigin} onChange={e => setFamilyOrigin(e.target.value)}
                    placeholder="VD: Thủy Nguyên, Hải Phòng"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white placeholder:text-secondary/30 text-sm focus:outline-none focus:border-secondary/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-secondary/40 uppercase tracking-widest pl-1">Lời Giới Thiệu / Tiểu Sử</label>
                <textarea
                  value={familyDescription} onChange={e => setFamilyDescription(e.target.value)}
                  placeholder="Viết đôi dòng về truyền thống và lịch sử dòng họ..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder:text-secondary/30 text-sm focus:outline-none focus:border-secondary/50 transition-all resize-none italic leading-relaxed"
                />
              </div>

              {/* Danger Zone */}
              <div className="pt-4 mt-6 border-t border-white/5">
                {!showClearConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-2 text-[10px] font-bold text-rose-500/60 hover:text-rose-500 uppercase tracking-widest transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Xóa trắng toàn bộ dữ liệu hiện có
                  </button>
                ) : (
                  <div className="bg-rose-500/5 border border-rose-500/20 p-4 rounded-2xl space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-rose-500 uppercase">Xác nhận xóa trắng?</p>
                        <p className="text-[11px] text-rose-500/70 mt-1">Hành động này sẽ xóa tất cả Thành viên, Sự kiện và Dòng họ. Không thể phục hồi.</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button" onClick={handleClear} disabled={isClearing}
                        className="px-4 py-2 bg-rose-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-widest hover:bg-rose-700 transition-all disabled:opacity-50"
                      >
                        {isClearing ? "Đang xóa..." : "Tôi hiểu, hãy xóa hết"}
                      </button>
                      <button
                        type="button" onClick={() => setShowClearConfirm(false)}
                        className="px-4 py-2 bg-white/5 text-secondary text-[10px] font-bold rounded-lg uppercase tracking-widest hover:bg-white/10"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-secondary/5 border border-secondary/10 p-5 rounded-2xl">
                <p className="text-xs text-secondary/60 leading-relaxed italic">
                  Thủy Tổ là người khai sáng dòng họ. Thông tin này sẽ là gốc rễ của cây gia phả.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-secondary/40 uppercase tracking-widest">Họ *</label>
                  <input
                    type="text" required value={ancestorLastName} onChange={e => setAncestorLastName(e.target.value)}
                    placeholder="VD: Ngô"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder:text-secondary/30 text-sm focus:outline-none focus:border-secondary/50 transition-all font-serif font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-secondary/40 uppercase tracking-widest">Tên Đệm & Tên *</label>
                  <input
                    type="text" required value={ancestorFirstName} onChange={e => setAncestorFirstName(e.target.value)}
                    placeholder="VD: Quý Công"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder:text-secondary/30 text-sm focus:outline-none focus:border-secondary/50 transition-all font-serif font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-secondary/40 uppercase tracking-widest">Tên Tự (Alias)</label>
                  <input
                    type="text" value={ancestorAlias} onChange={e => setAncestorAlias(e.target.value)}
                    placeholder="VD: Khang Dũng"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-secondary/30 text-sm focus:outline-none focus:border-secondary/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-secondary/40 uppercase tracking-widest">Tên Hiệu (Honorific)</label>
                  <input
                    type="text" value={ancestorHonorific} onChange={e => setAncestorHonorific(e.target.value)}
                    placeholder="VD: Từ Ái"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-secondary/30 text-sm focus:outline-none focus:border-secondary/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-secondary/40 uppercase tracking-widest">Tên Húy (Title)</label>
                  <input
                    type="text" value={ancestorTitle} onChange={e => setAncestorTitle(e.target.value)}
                    placeholder="VD: Trình"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-secondary/30 text-sm focus:outline-none focus:border-secondary/50 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            {step === 2 && (
              <button
                type="button" onClick={() => setStep(1)}
                className="px-8 py-4 rounded-2xl border border-white/10 text-secondary/60 hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-widest"
              >
                Quay lại
              </button>
            )}
            <button
              type="submit" disabled={isSubmitting}
              className="flex-1 bg-secondary text-primary font-bold py-4 rounded-2xl hover:bg-white hover:shadow-2xl hover:shadow-secondary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest text-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  Đang khởi tạo...
                </>
              ) : (
                <>
                  {step === 1 ? "Tiếp tục thiết lập Thủy Tổ" : "Hoàn tất khởi tạo di sản"}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
