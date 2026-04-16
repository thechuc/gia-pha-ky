"use server";

import prisma from "@/lib/db";
import { getAnniversaryInfo, UpcomingAnniversary, getAnniversaryFromFlexibleFields } from "@/utils/lunar/index";
import { Lunar, Solar } from "lunar-javascript";
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
}// ── Calendar Widget Data ─────────────────────────────────────────────────────

export interface CalendarAnniversary {
  memberId: string;
  fullName: string;
  generation: number;
  avatar: string | null;
  solarDay: number;
  lunarDay: number;
  lunarMonth: number;
  formattedLunar: string;
}

export async function getAnniversariesForCalendar(
  year: number,
  month: number // 1-12
): Promise<CalendarAnniversary[]> {
  noStore();
  try {
    const deceasedMembers = await prisma.familyMember.findMany({
      where: {
        isAlive: false,
        OR: [
          { dateOfDeath: { not: null } },
          { AND: [{ deathDay: { not: null } }, { deathMonth: { not: null } }] }
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
      }
    });

    const results: CalendarAnniversary[] = [];

    for (const m of deceasedMembers) {
      let lunarDay: number, lunarMonth: number;

      if (m.deathDay && m.deathMonth) {
        if (m.isDeathDateLunar) {
          lunarDay = m.deathDay;
          lunarMonth = m.deathMonth;
        } else {
          const s = Solar.fromDate(new Date(m.deathYear || year, m.deathMonth - 1, m.deathDay));
          const l = s.getLunar();
          lunarDay = l.getDay();
          lunarMonth = Math.abs(l.getMonth());
        }
      } else if (m.dateOfDeath) {
        const s = Solar.fromDate(new Date(m.dateOfDeath));
        const l = s.getLunar();
        lunarDay = l.getDay();
        lunarMonth = Math.abs(l.getMonth());
      } else {
        continue;
      }

      // Convert lunar anniversary date to solar for the target year
      try {
        const targetLunar = Lunar.fromYmd(year, lunarMonth, lunarDay);
        const targetSolar = targetLunar.getSolar();
        const solarMonth = targetSolar.getMonth();
        const solarDay = targetSolar.getDay();
        const solarYear = targetSolar.getYear();

        // Check if the converted solar date falls in the requested month
        if (solarMonth === month && solarYear === year) {
          results.push({
            memberId: m.id,
            fullName: m.fullName,
            generation: m.generation,
            avatar: m.avatar,
            solarDay,
            lunarDay,
            lunarMonth,
            formattedLunar: `${lunarDay}/${lunarMonth} ÂL`,
          });
        }
      } catch {
        // Skip invalid lunar dates (e.g., leap month edge cases)
        continue;
      }
    }

    return results;
  } catch (error) {
    console.error("Lỗi getAnniversariesForCalendar:", error);
    return [];
  }
}



export async function lightIncenseAction(memberId: string) {
  try {
    // Lấy dữ liệu hiện tại để cập nhật metadata
    const member = await prisma.familyMember.findUnique({
      where: { id: memberId },
      select: { metadata: true }
    });

    const now = new Date();
    let metadata = (member?.metadata as any) || {};
    let incenseSticks = metadata.incenseSticks || [];

    // Thêm nén nhang mới (lưu dạng ISO string)
    incenseSticks.push(now.toISOString());

    // Giới hạn tối đa 9 nén, nếu vượt quá thì xóa nén cũ nhất
    if (incenseSticks.length > 9) {
      incenseSticks.shift();
    }

    metadata.incenseSticks = incenseSticks;

    const updated = await prisma.familyMember.update({
      where: { id: memberId },
      data: { 
        lastIncenseLitAt: now,
        metadata: metadata
      }
    });

    revalidatePath("/dashboard/memorial");
    return { success: true, lastIncenseLitAt: updated.lastIncenseLitAt };
  } catch (error) {
    console.error("Lỗi lightIncenseAction:", error);
    return { success: false };
  }
}
