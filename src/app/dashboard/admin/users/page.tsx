import { DashboardHeader } from "@/components/dashboard/DashboardLayout";
import UserManagementView from "@/components/admin/UserManagementView";
import { getAllUsers } from "@/app/actions/admin";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export default async function AdminUsersPage() {
  const session = await auth();
  
  // Security check
  // @ts-ignore
  const isAdmin = session?.user?.roles?.some(
    (r: any) => r.role === Role.SUPER_ADMIN || r.role === Role.FAMILY_ADMIN
  );

  if (!isAdmin) {
    redirect("/dashboard");
  }

  const allUsers = await getAllUsers();
  
  // Get all branches for assignment
  const family = await prisma.family.findFirst();
  const branches = family 
    ? await prisma.branch.findMany({ 
        where: { familyId: family.id },
        orderBy: { order: "asc" } 
      })
    : [];

  return (
    <div className="flex flex-col h-full bg-[#0E0808]">
      <DashboardHeader title="Quản trị hệ thống" />
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-white mb-2">Quản lý người dùng</h1>
            <p className="text-slate-400">Kiểm soát phê duyệt, cấp quyền và điều phối thành viên trong dòng tộc.</p>
          </div>
          
          <UserManagementView 
            users={allUsers} 
            branches={branches} 
            familyId={family?.id || ""} 
          />
        </div>
      </main>
    </div>
  );
}
