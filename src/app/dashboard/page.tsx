import { DashboardHeader } from "@/components/dashboard/DashboardLayout";
import { OverviewPage } from "@/components/dashboard/OverviewPage";
import { getOverviewData } from "@/app/actions/family";

export default async function Dashboard() {
  const data = await getOverviewData();
  const isInitialized = !!(data && data.totalMembers > 0);
  const familyName = isInitialized ? data.family.name : "";
  
  // Hiển thị dạng "Tổng Quan — Họ [Tên]" hoặc chỉ "Tổng Quan" nếu chưa khởi tạo
  let displayTitle = "Tổng Quan";
  if (isInitialized && familyName) {
    displayTitle = familyName.toLowerCase().startsWith("họ") 
      ? `Tổng Quan — ${familyName}` 
      : `Tổng Quan — Họ ${familyName}`;
  }

  return (
    <>
      <DashboardHeader title={displayTitle} />
      <OverviewPage initialData={data} />
    </>
  );
}
