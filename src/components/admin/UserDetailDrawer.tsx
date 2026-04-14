"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Shield, LayoutPanelLeft, UserCheck, UserX, 
  Mail, Calendar, Fingerprint, Save, Loader2 
} from "lucide-react";
import { Role } from "@prisma/client";
import { approveUserAction, rejectUserAction, updateUserPermissionsAction } from "@/app/actions/admin";
import { useToast } from "@/components/ui/Toast";

interface UserDetailDrawerProps {
  user: any | null;
  isOpen: boolean;
  onClose: () => void;
  branches: any[];
  familyId: string;
}

import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function UserDetailDrawer({ user, isOpen, onClose, branches, familyId }: UserDetailDrawerProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>(Role.MEMBER);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      const userRole = user.roles?.[0]?.role || Role.MEMBER;
      const userBranch = user.roles?.[0]?.branchId || user.requestBranchId || "";
      setSelectedRole(userRole);
      setSelectedBranch(userBranch);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    
    let result;
    if (!user.isApproved) {
      result = await approveUserAction(user.id, familyId, selectedRole, selectedBranch);
    } else {
      result = await updateUserPermissionsAction(user.id, familyId, selectedRole, selectedBranch);
    }

    if (result.success) {
      showToast("Đã cập nhật quyền người dùng thành công", "success");
      onClose();
    } else {
      showToast(result.error, "error");
    }
    setLoading(false);
  };

  const handleReject = async () => {
    if (!user) return;
    setLoading(true);
    const result = await rejectUserAction(user.id);
    if (result.success) {
      showToast("Đã xóa người dùng thành công", "success");
      setShowDeleteConfirm(false);
      onClose();
    } else {
      showToast(result.error, "error");
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && user && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0E0808]/95 border-l border-white/10 shadow-2xl z-50 overflow-hidden flex flex-col backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Quản lý người dùng
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-8">
              {/* Profile Summary */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-24 h-24 rounded-3xl bg-primary/20 flex items-center justify-center border-2 border-primary/30 text-primary font-bold text-3xl shadow-lg overflow-hidden">
                  {user.image && user.image.trim() !== "" ? (
                    <img 
                      src={user.image} 
                      alt={user.name} 
                      className="w-full h-full object-cover rounded-[inherit]" 
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const span = document.createElement("span");
                          span.innerText = user.name?.[0]?.toUpperCase() || "U";
                          parent.appendChild(span);
                        }
                      }}
                    />
                  ) : (
                    <span>{user.name?.[0]?.toUpperCase() || "U"}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{user.name}</h3>
                  <div className="text-sm text-slate-500 flex items-center justify-center gap-1.5 mt-1">
                    <Mail className="w-3.5 h-3.5" />
                    {user.email}
                  </div>
                </div>
              </div>

              {/* User Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-[10px] uppercase font-black text-slate-600 tracking-widest block mb-1">Trạng thái</span>
                  <div className={`text-xs font-bold ${user.isApproved ? "text-emerald-400" : "text-amber-400"}`}>
                    {user.isApproved ? "Đã phê duyệt" : "Chờ phê duyệt"}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-[10px] uppercase font-black text-slate-600 tracking-widest block mb-1">Ngày tham gia</span>
                  <div className="text-xs font-bold text-slate-300">
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                </div>
              </div>

              {/* Permissions Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                  <div className="h-px flex-1 bg-white/10" />
                  <span>Phân quyền & Điều phối</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                {/* Role Select */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> Vai trò hệ thống
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as Role)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
                  >
                    <option value={Role.MEMBER} className="bg-[#1A1111]">Thành viên (Editor)</option>
                    <option value={Role.BRANCH_MANAGER} className="bg-[#1A1111]">Trưởng Chi / Nhánh</option>
                    <option value={Role.FAMILY_ADMIN} className="bg-[#1A1111]">Quản trị dòng họ (Admin)</option>
                    <option value={Role.SUPER_ADMIN} className="bg-[#1A1111]">Super Admin (Toàn quyền)</option>
                    <option value={Role.GUEST} className="bg-[#1A1111]">Khách xem (Viewer)</option>
                  </select>
                </div>

                {/* Branch Select */}
                {(selectedRole === Role.BRANCH_MANAGER || user.requestBranchId) && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-2">
                      <LayoutPanelLeft className="w-3.5 h-3.5" /> Chi / Nhánh quản lý
                    </label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
                    >
                      <option value="" className="bg-[#1A1111]">Chọn Chi/Nhánh</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id} className="bg-[#1A1111]">{b.name}</option>
                      ))}
                    </select>
                    {user.requestBranchId && (
                      <p className="text-[10px] text-primary/60 italic ml-1">
                        * Người dùng đã gửi yêu cầu gia nhập nhánh: <span className="font-bold underline">
                          {branches.find(b => b.id === user.requestBranchId)?.name || "N/A"}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-white/[0.02] space-y-3">
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full py-3.5 bg-primary hover:bg-primary/90 text-secondary font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {user.isApproved ? "Lưu thay đổi" : "Phê duyệt ngay"}
              </button>
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="w-full py-3 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                <UserX className="w-4 h-4" />
                {user.isApproved ? "Gỡ bỏ người dùng" : "Từ chối yêu cầu"}
              </button>
            </div>

            <ConfirmModal 
              isOpen={showDeleteConfirm}
              onClose={() => setShowDeleteConfirm(false)}
              onConfirm={handleReject}
              isLoading={loading}
              title={user.isApproved ? "Gỡ bỏ người dùng" : "Từ chối yêu cầu"}
              message={`Bạn có chắc chắn muốn ${user.isApproved ? "gỡ bỏ" : "từ chối"} người dùng ${user.name}? Hành động này không thể hoàn tác.`}
              confirmText={user.isApproved ? "Gỡ bỏ" : "Từ chối"}
              type="danger"
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
