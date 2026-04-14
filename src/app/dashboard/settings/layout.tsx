import { DashboardHeader } from "@/components/dashboard/DashboardLayout";
import { SettingsSidebar } from "@/components/dashboard/settings/SettingsSidebar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  // Settings MUST always be protected even in public mode
  if (!session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col h-full bg-[#0E0808]">
      <DashboardHeader title="Cài đặt hệ thống" />
      
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
          {/* Internal Sidebar */}
          <SettingsSidebar />
          
          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
