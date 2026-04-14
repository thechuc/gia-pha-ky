import { SettingSection } from "@/components/dashboard/settings/SettingSection";
import { Info } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-white">Thông báo</h1>
        <p className="text-sm text-slate-500">Cấu hình các kênh và nội dung nhận thông báo từ hệ thống.</p>
      </div>
      
      <SettingSection 
        title="Tính năng đang phát triển" 
        description="Chúng tôi đang hoàn thiện hệ thống thông báo đa kênh để phục vụ dòng họ tốt hơn."
      >
        <div className="flex items-center gap-4 p-6 bg-primary/5 border border-primary/20 rounded-2xl text-primary">
          <Info className="w-6 h-6 shrink-0" />
          <p className="text-sm font-bold">
            Hệ thống thông báo qua Email và Zalo OA sẽ được tích hợp trong phiên bản tiếp theo. 
            Bạn hãy quay lại sau nhé!
          </p>
        </div>
      </SettingSection>
    </div>
  );
}
