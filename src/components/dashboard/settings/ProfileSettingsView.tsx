"use client";

import { SettingSection } from "./SettingSection";
import { useState } from "react";
import { Save, User, ShieldCheck, Palette, Bell } from "lucide-react";
import { updatePersonalProfileAction, changePasswordAction } from "@/app/actions/settings";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";

export default function ProfileSettingsView() {
  const { data: session, update } = useSession();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(session?.user?.name || "");
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updatePersonalProfileAction({ name });
      if (res.success) {
        showToast("Đã cập nhật thông tin cá nhân", "success");
        update(); // Refresh session
      }
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return showToast("Mật khẩu xác nhận không khớp", "error");
    }
    
    setLoading(true);
    try {
      const res = await changePasswordAction(passwords);
      if (res.success) {
        showToast("Đã đổi mật khẩu thành công", "success");
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <SettingSection 
        title="Thông tin cơ bản" 
        description="Cập nhật tên hiển thị và ảnh đại diện của bạn."
      >
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Tên hiển thị</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="VD: Nguyễn Văn A"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email</label>
            <input 
              type="email" 
              value={session?.user?.email || ""} 
              disabled
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-500 opacity-60 cursor-not-allowed"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-secondary px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu thay đổi
          </button>
        </form>
      </SettingSection>

      <SettingSection 
        title="Bảo mật" 
        description="Đổi mật khẩu để bảo vệ tài khoản của bạn."
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Mật khẩu hiện tại</label>
            <input 
              type="password" 
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Mật khẩu mới</label>
              <input 
                type="password" 
                value={passwords.newPassword}
                onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Xác nhận mật khẩu</label>
              <input 
                type="password" 
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all border border-white/10 active:scale-95 disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Cập nhật mật khẩu
          </button>
        </form>
      </SettingSection>
    </div>
  );
}
