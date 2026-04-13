"use server";

import prisma from "@/lib/db";
import { getAnniversaryInfo, UpcomingAnniversary, getAnniversaryFromFlexibleFields } from "@/utils/lunar/index";
import { Lunar } from "lunar-javascript";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

export interface AnniversaryItem extends UpcomingAnniversary {
  memberId: string;
  fullName: string;
  generation: number;
  avatar: string | null;
  lastIncenseLitAt: Date | null;
}

export async function getUpcomingAnniversaries(limit?: number, onlyUpcoming: boolean = false): Promise<AnniversaryItem[]> {
  noStore(); // Đảm bảo không bị cache kết quả dựa trên thời gian cũ
  
  try {
    // Truy vấn tất cả những thành viên ĐÃ KHUẤT và có ngày mất
    const deceasedMembers = await prisma.familyMember.findMany({
      where: {
        isAlive: false,
        OR: [
          { dateOfDeath: { not: null } },
          {
            AND: [
              { deathDay: { not: null } },
              { deathMonth: { not: null } }
            ]
          }
        ]
      },
      select: {
        id: true,
        fullName: true,
        generation: true,
        avatar: true,
        dateOfDeath: true,
        deathDay: true,
        deathMonth: true,
        deathYear: true,
        isDeathDateLunar: true,
        lastIncenseLitAt: true
      }
    });

    const annivList: AnniversaryItem[] = [];

    for (const m of deceasedMembers) {
      let info;
      
      // ƯU TIÊN ngày linh hoạt (deathDay, deathMonth) hơn vì người dùng vừa cập nhật
      if (m.deathDay && m.deathMonth) {
        info = getAnniversaryFromFlexibleFields(
          m.deathDay,
          m.deathMonth,
          m.deathYear,
          m.isDeathDateLunar
        );
      } else if (m.dateOfDeath) {
        info = getAnniversaryInfo(new Date(m.dateOfDeath));
      }

      if (info) {
        annivList.push({
          memberId: m.id,
          fullName: m.fullName,
          generation: m.generation,
          avatar: m.avatar,
          lastIncenseLitAt: m.lastIncenseLitAt,
          ...info
        });
      }
    }

    // Sort by daysLeft ascending (Giỗ gần nhất tới xa nhất)
    annivList.sort((a, b) => a.daysLeft - b.daysLeft);

    let result = annivList;
    if (onlyUpcoming) {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const currentLunar = Lunar.fromDate(now);
      const currentLunarMonth = Math.abs(currentLunar.getMonth());

      console.log(`[Anniversary Debug] Today: ${now.toLocaleDateString()}, SolarMonth: ${currentMonth}, LunarMonth: ${currentLunarMonth}`);

      result = annivList.filter(item => {
        const isNext7Days = item.daysLeft <= 7;
        const isSameSolarMonth = item.solarDateObj.getMonth() === currentMonth && item.solarDateObj.getFullYear() === currentYear;
        const isSameLunarMonth = item.lunarMonth === currentLunarMonth;

        if (isNext7Days || isSameSolarMonth || isSameLunarMonth) {
          console.log(`[Anniversary Debug] KEEPING: ${item.fullName}, daysLeft: ${item.daysLeft}, solarMonth: ${item.solarDateObj.getMonth()}, lunarMonth: ${item.lunarMonth}`);
          return true;
        }

        return false;
      });
    }

    return limit ? result.slice(0, limit) : result;
  } catch (error) {
    console.error("Lỗi getUpcomingAnniversaries:", error);
    return [];
  }
}

export async function getFamilyEvents() {
  try {
    const family = await prisma.family.findFirst({
      include: {
        events: {
          orderBy: { eventDate: "desc" },
        },
      },
    });

    if (!family) return [];

    return family.events.map((e) => {
      let parsedMedia = [];
      try {
        parsedMedia = e.media ? JSON.parse(e.media) : [];
      } catch (err) {
        console.error(`Invalid media JSON for event ${e.id}:`, err);
        parsedMedia = [];
      }

      return {
        id: e.id,
        date: e.eventDate ? new Date(e.eventDate).toLocaleDateString("vi-VN") : "",
        isoDate: e.eventDate ? new Date(e.eventDate).toISOString().split("T")[0] : "",
        era: e.era || "",
        title: e.title,
        description: e.description || "",
        iconName: e.icon || "Star",
        type: e.type.toLowerCase(),
        media: parsedMedia,
      };
    });
  } catch (error) {
    console.error("Lỗi getFamilyEvents:", error);
    return [];
  }
}
export async function lightIncenseAction(memberId: string) {
  try {
    const updated = await prisma.familyMember.update({
      where: { id: memberId },
      data: { lastIncenseLitAt: new Date() }
    });
    revalidatePath("/dashboard");
    return { success: true, lastIncenseLitAt: updated.lastIncenseLitAt };
  } catch (error) {
    console.error("Lỗi lightIncenseAction:", error);
    return { success: false };
  }
}
