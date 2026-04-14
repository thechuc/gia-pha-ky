import prisma from "@/lib/db";
import IdentitySettingsView from "@/components/dashboard/settings/IdentitySettingsView";
import { canEditFamily } from "@/utils/permissions";
import { redirect } from "next/navigation";

export default async function IdentityPage() {
  if (!await canEditFamily()) {
    redirect("/dashboard/settings/profile");
  }

  const family = await prisma.family.findFirst();
  if (!family) return <div>Family not found</div>;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-white">Bản sắc Dòng họ</h1>
        <p className="text-sm text-slate-500">Quản lý các thông tin cốt lõi đại diện cho dòng tộc của bạn.</p>
      </div>
      
      <IdentitySettingsView family={family} />
    </div>
  );
}
