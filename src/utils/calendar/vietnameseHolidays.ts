/**
 * Vietnamese Holidays Data
 * Includes both Solar (Gregorian) and Lunar calendar holidays
 */

export interface VietHoliday {
  name: string;
  day: number;
  month: number;
  emoji: string;
  isOfficial: boolean; // Ngày nghỉ lễ chính thức
}

// ── Ngày lễ theo Dương lịch ──────────────────────────────────────────────────
export const SOLAR_HOLIDAYS: VietHoliday[] = [
  { name: "Tết Dương lịch", day: 1, month: 1, emoji: "🎉", isOfficial: true },
  { name: "Thành lập Đảng", day: 3, month: 2, emoji: "🏛️", isOfficial: false },
  { name: "Quốc tế Phụ nữ", day: 8, month: 3, emoji: "🌸", isOfficial: false },
  { name: "Giải phóng miền Nam", day: 30, month: 4, emoji: "⭐", isOfficial: true },
  { name: "Quốc tế Lao động", day: 1, month: 5, emoji: "💪", isOfficial: true },
  { name: "Sinh nhật Bác Hồ", day: 19, month: 5, emoji: "🌻", isOfficial: false },
  { name: "Ngày Gia đình VN", day: 28, month: 6, emoji: "👨‍👩‍👧‍👦", isOfficial: false },
  { name: "Thương binh Liệt sĩ", day: 27, month: 7, emoji: "🕯️", isOfficial: false },
  { name: "Quốc khánh", day: 2, month: 9, emoji: "🇻🇳", isOfficial: true },
  { name: "Phụ nữ Việt Nam", day: 20, month: 10, emoji: "💐", isOfficial: false },
  { name: "Nhà giáo Việt Nam", day: 20, month: 11, emoji: "📚", isOfficial: false },
  { name: "Quân đội Nhân dân", day: 22, month: 12, emoji: "🎖️", isOfficial: false },
];

// ── Ngày lễ theo Âm lịch ────────────────────────────────────────────────────
export const LUNAR_HOLIDAYS: VietHoliday[] = [
  { name: "Tết Nguyên Đán", day: 1, month: 1, emoji: "🧧", isOfficial: true },
  { name: "Mùng 2 Tết", day: 2, month: 1, emoji: "🧧", isOfficial: true },
  { name: "Mùng 3 Tết", day: 3, month: 1, emoji: "🧧", isOfficial: true },
  { name: "Rằm tháng Giêng", day: 15, month: 1, emoji: "🏮", isOfficial: false },
  { name: "Tết Hàn Thực", day: 3, month: 3, emoji: "🍡", isOfficial: false },
  { name: "Giỗ Tổ Hùng Vương", day: 10, month: 3, emoji: "🏔️", isOfficial: true },
  { name: "Lễ Phật Đản", day: 15, month: 4, emoji: "🪷", isOfficial: false },
  { name: "Tết Đoan Ngọ", day: 5, month: 5, emoji: "🌿", isOfficial: false },
  { name: "Vu Lan", day: 15, month: 7, emoji: "🌹", isOfficial: false },
  { name: "Tết Trung Thu", day: 15, month: 8, emoji: "🥮", isOfficial: false },
  { name: "Tết Trùng Cửu", day: 9, month: 9, emoji: "🍃", isOfficial: false },
  { name: "Ông Táo về trời", day: 23, month: 12, emoji: "🐟", isOfficial: false },
  { name: "Tất Niên", day: 30, month: 12, emoji: "🎊", isOfficial: false },
];

/**
 * Get Solar holidays for a specific month
 */
export function getSolarHolidaysForMonth(month: number): VietHoliday[] {
  return SOLAR_HOLIDAYS.filter(h => h.month === month);
}

/**
 * Get Solar holidays for a specific day in a month
 */
export function getSolarHolidaysForDay(day: number, month: number): VietHoliday[] {
  return SOLAR_HOLIDAYS.filter(h => h.day === day && h.month === month);
}

/**
 * Get Lunar holidays for a specific lunar day and month
 */
export function getLunarHolidaysForDay(lunarDay: number, lunarMonth: number): VietHoliday[] {
  return LUNAR_HOLIDAYS.filter(h => h.day === lunarDay && h.month === lunarMonth);
}
