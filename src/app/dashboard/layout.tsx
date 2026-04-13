import { Sidebar, DashboardHeader } from "@/components/dashboard/DashboardLayout";
import { ToastProvider } from "@/components/ui/Toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="flex h-screen bg-ancient-dark text-[#F9F5EB] overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {children}
        </div>
      </div>
    </ToastProvider>
  );
}
