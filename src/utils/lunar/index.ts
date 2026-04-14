import { Lunar, Solar } from 'lunar-javascript';

export interface UpcomingAnniversary {
  solarDateObj: Date;
  lunarDay: number;
  lunarMonth: number;
  lunarYearOnDeath: number;
  daysLeft: number;
  isToday: boolean;
  isTomorrow: boolean;
  isPassedThisYear: boolean;
  formattedLunar: string;
  formattedSolar: string;
}

export function getAnniversaryInfo(deathDate: Date, currentOffsetDays: number = 0): UpcomingAnniversary {
  const deathSolar = Solar.fromDate(deathDate);
  const deathLunar = deathSolar.getLunar();
  
  return calculateUpcomingAnniversary(
    deathLunar.getDay(),
    Math.abs(deathLunar.getMonth()),
    deathLunar.getYear(),
    currentOffsetDays
  );
}

export function getAnniversaryFromFlexibleFields(
  day: number,
  month: number,
  year: number | null,
  isLunar: boolean,
  currentOffsetDays: number = 0
): UpcomingAnniversary {
  if (isLunar) {
    return calculateUpcomingAnniversary(day, month, year || 0, currentOffsetDays);
  }

  // If input is Solar, convert to Lunar first to get the fixed anniversary day/month
  const sDate = year 
    ? Solar.fromDate(new Date(year, month - 1, day))
    : Solar.fromDate(new Date(new Date().getFullYear(), month - 1, day)); 
  const lunar = sDate.getLunar();
  
  return calculateUpcomingAnniversary(
    lunar.getDay(),
    Math.abs(lunar.getMonth()),
    lunar.getYear(),
    currentOffsetDays
  );
}

function calculateUpcomingAnniversary(
  lDay: number,
  lMonth: number,
  lYearOnDeath: number,
  currentOffsetDays: number
): UpcomingAnniversary {
  const today = new Date();
  today.setDate(today.getDate() + currentOffsetDays);
  today.setHours(0, 0, 0, 0);

  const todaySolar = Solar.fromDate(today);
  const todayLunar = todaySolar.getLunar();
  let targetLunarYear = todayLunar.getYear();

  let targetLunar = Lunar.fromYmd(targetLunarYear, lMonth, lDay);
  let targetSolar = targetLunar.getSolar();
  let annivDate = new Date(targetSolar.getYear(), targetSolar.getMonth() - 1, targetSolar.getDay());
  
  let isPassedThisYear = false;
  if (annivDate.getTime() < today.getTime()) {
    isPassedThisYear = true;
    targetLunarYear += 1;
    targetLunar = Lunar.fromYmd(targetLunarYear, lMonth, lDay);
    targetSolar = targetLunar.getSolar();
    annivDate = new Date(targetSolar.getYear(), targetSolar.getMonth() - 1, targetSolar.getDay());
  }

  const diffTime = annivDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isToday = daysLeft === 0;
  const isTomorrow = daysLeft === 1;

  const formattedLunar = `Ngày ${lDay} tháng ${lMonth} (Âm lịch)`;
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = days[annivDate.getDay()];
  const formattedSolar = `${dayName}, ${targetSolar.getDay().toString().padStart(2, '0')}/${targetSolar.getMonth().toString().padStart(2, '0')}/${targetSolar.getYear()}`;

  return {
    solarDateObj: annivDate,
    lunarDay: lDay,
    lunarMonth: lMonth,
    lunarYearOnDeath: lYearOnDeath,
    daysLeft,
    isToday,
    isTomorrow,
    isPassedThisYear,
    formattedLunar,
    formattedSolar
  };
}
