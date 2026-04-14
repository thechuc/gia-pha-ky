import { Sidebar } from "@/components/dashboard/DashboardLayout";
import { ToastProvider } from "@/components/ui/Toast";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { ShieldAlert, Clock, LogIn } from "lucide-react";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const family = await prisma.family.findFirst();

  // 1. Kiểm tra Quyền riêng tư (Chỉ áp dụng nếu gia đình KHÔNG công khai)
  if (family && !family.isPublic && !session) {
    redirect("/?auth=login&error=private");
  }

  // 2. Kiểm tra Trạng thái Phê duyệt (Nếu đã đăng nhập)
  const isApproved = session?.user?.isApproved;
  const userRoles = (session?.user as any)?.roles || [];
  const isSuperAdmin = userRoles.some((r: any) => r.role === "SUPER_ADMIN");
  const isGlobalAdmin = isSuperAdmin || session?.user?.id === process.env.NEXT_PUBLIC_ADMIN_ID;
  
  // Các route luôn được xem (như Tree nếu public)
  // Nhưng nếu đã LOGIN mà chưa APPROVED thì vẫn nên báo để người dùng biết
  if (session && !isApproved && !isGlobalAdmin) {
    // Chỉ chặn các trang mang tính quản trị hoặc tương tác
    // Ở đây ta có thể hiển thị một Overlay cảnh báo nếu chưa được phê duyệt
    return (
      <ToastProvider>
        <div className="flex h-screen bg-ancient-dark text-[#F9F5EB] overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 relative">
             <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
                <div className="bg-[#1A1110] border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl text-center space-y-6">
                   <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                      <Clock className="w-10 h-10 text-amber-500" />
                   </div>
                   <div className="space-y-2">
                      <h2 className="text-2xl font-serif font-bold text-white">Chờ phê duyệt</h2>
                      <p className="text-slate-400 text-sm leading-relaxed">
                         Tài khoản của bạn đã được đăng ký thành công nhưng đang chờ Quản trị viên phê duyệt để có quyền truy cập đầy đủ các tính năng của dòng họ.
                      </p>
                   </div>
                   <div className="pt-4">
                      <Link href="/" className="inline-block px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all">
                        Quay lại Trang chủ
                      </Link>
                   </div>
                </div>
             </div>
             {children}
          </div>
        </div>
      </ToastProvider>
    );
  }

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
