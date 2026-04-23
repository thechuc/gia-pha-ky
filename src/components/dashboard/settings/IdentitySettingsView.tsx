"use client";

import { SettingSection } from "./SettingSection";
import { useState, useEffect, useRef } from "react";
import { Save, Image as ImageIcon, Globe, FileText, Upload } from "lucide-react";
import { updateFamilyIdentityAction } from "@/app/actions/settings";
import { useToast } from "@/components/ui/Toast";

interface IdentitySettingsViewProps {
  family: any;
}

export default function IdentitySettingsView({ family }: IdentitySettingsViewProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: family?.name || "",
    motto: family?.motto || "",
    description: family?.description || "",
    origin: family?.origin || "",
    coverImage: family?.coverImage || "",
  });

  // Đồng bộ lại dữ liệu khi prop family thay đổi (sau khi lưu thành công và revalidate)
  useEffect(() => {
    if (family) {
      setFormData({
        name: family.name || "",
        motto: family.motto || "",
        description: family.description || "",
        origin: family.origin || "",
        coverImage: family.coverImage || "",
      });
    }
  }, [family]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return showToast("Ảnh quá lớn (tối đa 5MB)", "error");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, coverImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
    // Reset input value để cho phép chọn lại cùng 1 file
    if (e.target) {
      e.target.value = "";
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateFamilyIdentityAction(family.id, formData);
      if (res.success) {
        showToast("Đã cập nhật bản sắc dòng họ thành công", "success");
      }
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-2xl pb-20">
      <SettingSection 
        title="Thông tin cơ bản" 
        description="Định nghĩa tên gọi và lời tổ huấn đặc trưng của dòng tộc."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Tên Dòng Họ</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="VD: Nguyễn Văn (Tộc)"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Slogan / Lời Giáo Huấn</label>
            <input 
              type="text" 
              value={formData.motto}
              onChange={(e) => setFormData({...formData, motto: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="VD: Uống nước nhớ nguồn"
            />
          </div>
        </div>
      </SettingSection>

      <SettingSection 
        title="Hình ảnh đại diện" 
        description="Ảnh bìa dòng họ hiển thị trên trang chủ và các khu vực công cộng."
      >
        <div className="space-y-4">
          {/* File input ẩn duy nhất, dùng ref để trigger */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />
          <div className="relative w-full aspect-video rounded-2xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center p-4 group overflow-hidden">
            {formData.coverImage ? (
              <>
                <img src={formData.coverImage} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={triggerFileSelect}
                    className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all"
                  >
                    Chỉnh sửa ảnh
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={triggerFileSelect}
                className="flex flex-col items-center gap-2 cursor-pointer text-slate-500 hover:text-white transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold uppercase tracking-tight">Tải ảnh lên</span>
                <span className="text-[10px]">Định dạng JPG, PNG (Tối đa 5MB)</span>
              </button>
            )}
          </div>
        </div>
      </SettingSection>

      <SettingSection 
        title="Lý lịch & Nguồn gốc" 
        description="Sơ lược về lịch sử phát triển và nguồn gốc địa lý của dòng họ."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Vị trí địa lý / Gốc gác</label>
            <input 
              type="text" 
              value={formData.origin}
              onChange={(e) => setFormData({...formData, origin: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="VD: Thanh Miện, Hải Dương"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Mô tả chi tiết</label>
            <textarea 
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="Viết vài dòng giới thiệu về dòng tộc..."
            />
          </div>
        </div>
      </SettingSection>

      <div className="sticky bottom-0 left-0 right-0 p-4 bg-[#0E0808]/80 backdrop-blur-xl border-t border-white/5 -mx-8 -mb-8 z-20">
        <div className="max-w-2xl mx-auto flex justify-end">
          <button 
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-secondary text-black px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-secondary/10"
          >
            {loading ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu bản sắc dòng tộc
          </button>
        </div>
      </div>
    </form>
  );
}
