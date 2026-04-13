import { getUpcomingAnniversaries, getFamilyEvents } from "@/app/actions/events";
import EventsPageClient from "./EventsPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sự kiện & Ngày giỗ | Gia Phả Ký",
  description: "Quản trị ngày giỗ hiển thị song song Âm - Dương lịch và sự kiện dòng họ.",
};

export default async function EventsPage() {
  const [anniversaries, familyEvents] = await Promise.all([
    getUpcomingAnniversaries(), // Không truyền limit để lấy toàn bộ danh sách đã khuất
    getFamilyEvents()
  ]);

  return <EventsPageClient initialAnniversaries={anniversaries} initialEvents={familyEvents} />;
}
