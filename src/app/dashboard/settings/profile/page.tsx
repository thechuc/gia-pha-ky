import ProfileSettingsView from "@/components/dashboard/settings/ProfileSettingsView";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-white">Cài đặt Cá nhân</h1>
        <p className="text-sm text-slate-500">Quản lý tài khoản và thông tin bảo mật của riêng bạn.</p>
      </div>
      
      <ProfileSettingsView />
    </div>
  );
}
