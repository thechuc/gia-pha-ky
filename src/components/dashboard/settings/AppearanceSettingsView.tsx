"use client";

import { SettingSection } from "./SettingSection";
import { useState } from "react";
import { Save, Layout, LayoutPanelTop, Eye, EyeOff } from "lucide-react";
import { updateFamilySettingsAction } from "@/app/actions/settings";
import { useToast } from "@/components/ui/Toast";

interface AppearanceSettingsViewProps {
  family: any;
}

export default function AppearanceSettingsView({ family }: AppearanceSettingsViewProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const currentSettings = family.settings ? (typeof family.settings === 'string' ? JSON.parse(family.settings) : family.settings) : {};
  
  const [settings, setSettings] = useState({
    treeLayout: currentSettings.treeLayout || "horizontal",
    isPublic: family.isPublic ?? false,
    showPortraits: currentSettings.showPortraits ?? true,
    showDates: currentSettings.showDates ?? true,
    showGeneration: currentSettings.showGeneration ?? true,
    showBranch: currentSettings.showBranch ?? true,
    showHonorifics: currentSettings.showHonorifics ?? true,
    showOccupation: currentSettings.showOccupation ?? true,
    showSpouses: currentSettings.showSpouses ?? true,
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await updateFamilySettingsAction(family.id, settings);
      if (res.success) {
        showToast("Đã lưu cấu hình hiển thị", "success");
      }
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const cardSwitches = [
    { key: 'showDates', label: 'Năm sinh/mất', icon: '★', desc: 'Hiển thị ngày sinh và ngày mất (nếu có)' },
    { key: 'showGeneration', label: 'Đời (Thế hệ)', icon: 'G', desc: 'Hiển thị thứ tự đời của thành viên' },
    { key: 'showBranch', label: 'Nhánh / Chi', icon: 'B', desc: 'Hiển thị tên nhánh hoặc chi tộc' },
    { key: 'showHonorifics', label: 'Hiệu / Tự', icon: 'H', desc: 'Hiển thị tên hiệu, tên tự của tiền nhân' },
    { key: 'showOccupation', label: 'Nghề / Chức', icon: 'O', desc: 'Hiển thị nghề nghiệp hoặc chức vị' },
    { key: 'showSpouses', label: 'Phu nhân', icon: 'S', desc: 'Hiển thị danh sách vợ/chồng trên thẻ' },
  ];

  return (
    <div className="space-y-8 max-w-2xl pb-20">
      <SettingSection 
        title="Trực quan cây gia phả" 
        description="Thay đổi cách cây gia phả được vẽ và hiển thị cho người xem."
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Hướng hiển thị cây</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setSettings({...settings, treeLayout: "horizontal"})}
                className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${
                  settings.treeLayout === "horizontal" 
                    ? "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5" 
                    : "bg-white/5 border-white/10 text-slate-500 hover:border-white/20"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-current/10 flex items-center justify-center">
                  <Layout className="w-5 h-5 rotate-90" />
                </div>
                <span className="text-sm font-bold">Ngang (Cổ điển)</span>
              </button>
              
              <button 
                onClick={() => setSettings({...settings, treeLayout: "vertical"})}
                className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${
                  settings.treeLayout === "vertical" 
                    ? "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5" 
                    : "bg-white/5 border-white/10 text-slate-500 hover:border-white/20"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-current/10 flex items-center justify-center">
                  <LayoutPanelTop className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold">Dọc (Hiện đại)</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Hiển thị ảnh chân dung</p>
              <p className="text-xs text-slate-500">Hiển thị avatar thành viên trên mỗi nút của cây.</p>
            </div>
            <button 
              onClick={() => setSettings({...settings, showPortraits: !settings.showPortraits})}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.showPortraits ? "bg-primary" : "bg-white/20"}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.showPortraits ? "left-7" : "left-1"}`} />
            </button>
          </div>
        </div>
      </SettingSection>

      <SettingSection 
        title="Cấu hình thẻ thành viên" 
        description="Thiết lập các thông tin mặc định sẽ hiển thị trên mỗi nút của cây gia phả."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cardSwitches.map((item) => (
            <button 
              key={item.key}
              onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key as keyof typeof settings] })}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left group
                ${settings[item.key as keyof typeof settings] 
                  ? "bg-primary/5 border-primary/30" 
                  : "bg-white/5 border-white/10 hover:border-white/20"}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all
                  ${settings[item.key as keyof typeof settings] 
                    ? "bg-primary text-black scale-110 shadow-lg shadow-primary/20" 
                    : "bg-white/10 text-slate-500"}`}>
                  {item.icon}
                </div>
                <div className="space-y-0.5">
                  <p className={`text-sm font-bold transition-colors ${settings[item.key as keyof typeof settings] ? "text-white" : "text-slate-400"}`}>
                    {item.label}
                  </p>
                  <p className="text-[10px] text-slate-500 line-clamp-1 group-hover:line-clamp-none transition-all">
                    {item.desc}
                  </p>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full p-0.5 transition-colors shrink-0 ml-2 ${settings[item.key as keyof typeof settings] ? "bg-primary" : "bg-white/10"}`}>
                <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${settings[item.key as keyof typeof settings] ? "translate-x-5" : "translate-x-0"}`} />
              </div>
            </button>
          ))}
        </div>
      </SettingSection>

      <SettingSection 
        title="Quyền riêng tư" 
        description="Quản lý ai có thể tiếp cận được thông tin gia phả của bạn."
      >
        <div className="space-y-4">
          <button 
            onClick={() => setSettings({...settings, isPublic: !settings.isPublic})}
            className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${
              settings.isPublic 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                : "bg-white/5 border-white/10 text-slate-400"
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${settings.isPublic ? "bg-emerald-500/20" : "bg-white/10"}`}>
              {settings.isPublic ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold">{settings.isPublic ? "Chế độ Công khai" : "Chế độ Cá nhân"}</p>
              <p className="text-xs opacity-70">
                {settings.isPublic 
                  ? "Mọi người đều có thể tìm thấy và xem cây gia phả này." 
                  : "Chỉ những thành viên được phê duyệt mới có thể truy cập."}
              </p>
            </div>
          </button>
        </div>
      </SettingSection>

      <div className="sticky bottom-0 left-0 right-0 p-4 bg-[#0E0808]/80 backdrop-blur-xl border-t border-white/5 -mx-8 -mb-8 z-20">
        <div className="max-w-2xl mx-auto flex justify-end">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-primary text-black px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/10"
          >
            {loading ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu cấu hình hệ thống
          </button>
        </div>
      </div>
    </div>
  );
}
