"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, X, User } from "lucide-react";
import { Member } from "@/types/member";

interface DeleteMemberDialogProps {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export function DeleteMemberDialog({ isOpen, member, onClose, onConfirm }: DeleteMemberDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  // Reset state when modal opens or member changes
  React.useEffect(() => {
    if (isOpen) {
      setConfirmText("");
      setShowFinalConfirm(false);
    }
  }, [isOpen, member?.id]);

  if (!isOpen || !member) return null;

  const canDelete = confirmText === member.fullName;

  const handleDelete = async () => {
    if (!canDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirm(member.id);
      setConfirmText("");
      setShowFinalConfirm(false);
      onClose();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-[3px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[440px] max-w-[92vw] border border-red-100/50 overflow-hidden animate-fade-slide-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-red-100 bg-red-50/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif font-bold text-red-800 text-lg">Xóa Thành Viên</h3>
            <p className="text-[11px] text-red-600/70">Hành động này không thể hoàn tác</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-red-100 flex items-center justify-center">
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Member Preview */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-foreground/[0.02] border border-border">
            <div className="w-14 h-14 rounded-xl border border-border overflow-hidden bg-primary/5 flex items-center justify-center shrink-0">
              {member.avatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={member.avatar} alt={member.fullName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-primary/30" />
              )}
            </div>
            <div>
              <p className="font-serif font-bold text-foreground">{member.fullName}</p>
              <p className="text-[11px] text-foreground/40">Đời thứ {member.generation}</p>
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed space-y-1">
            <p className="font-bold">⚠️ Cảnh báo:</p>
            <ul className="list-disc ml-4 space-y-0.5 text-amber-700">
              <li>Tất cả <strong>quan hệ</strong> liên quan sẽ bị xóa</li>
              <li>Tất cả <strong>sự kiện</strong> của thành viên sẽ bị xóa</li>
              <li>Tất cả <strong>bình luận</strong> sẽ bị xóa</li>
              <li>Thành viên sẽ bị gỡ khỏi <strong>cây gia phả</strong></li>
            </ul>
          </div>

          {/* Confirm Input */}
          <div>
            <label className="text-[11px] font-bold text-foreground/50 tracking-widest mb-1.5 block">
              GÕ &quot;<span className="text-red-700">{member.fullName}</span>&quot; ĐỂ XÁC NHẬN
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={member.fullName}
              className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
              autoFocus
            />
          </div>

          {/* Final Confirmation Message */}
          {showFinalConfirm && !isDeleting && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 animate-fade-slide-up">
              <p className="text-sm font-bold text-red-800 text-center">
                Bạn có chắc chắn 100% muốn xóa?
              </p>
              <p className="text-[11px] text-red-600/70 text-center mt-1">
                Nhấn một lần nữa để xác nhận xóa vĩnh viễn.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 py-3 rounded-xl border border-border text-foreground/60 font-bold text-sm hover:bg-foreground/5 transition-colors disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              onClick={() => {
                if (showFinalConfirm) {
                  handleDelete();
                } else {
                  setShowFinalConfirm(true);
                }
              }}
              disabled={!canDelete || isDeleting}
              className={`flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                showFinalConfirm ? "bg-red-700 ring-4 ring-red-100" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isDeleting ? (
                <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Đang xóa...</>
              ) : showFinalConfirm ? (
                <><Trash2 className="w-4 h-4" /> Có, Xóa Ngay</>
              ) : (
                <><Trash2 className="w-4 h-4" /> Xóa vĩnh viễn</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
