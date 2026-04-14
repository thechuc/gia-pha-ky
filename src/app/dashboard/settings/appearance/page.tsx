import prisma from "@/lib/db";
import AppearanceSettingsView from "@/components/dashboard/settings/AppearanceSettingsView";
import { canEditFamily } from "@/utils/permissions";
import { redirect } from "next/navigation";

export default async function AppearancePage() {
  if (!await canEditFamily()) {
    redirect("/dashboard/settings/profile");
  }

  const family = await prisma.family.findFirst();
  if (!family) return <div>Family not found</div>;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-white">Hiển thị & Cây</h1>
        <p className="text-sm text-slate-500">Tùy chỉnh trải nghiệm xem và tương tác với cây gia phả.</p>
      </div>
      
      <AppearanceSettingsView family={family} />
    </div>
  );
}
