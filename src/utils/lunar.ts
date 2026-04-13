/**
 * Tiện ích Âm Lịch Việt Nam
 * Chuyển đổi Dương lịch → Âm lịch (Simplified algorithm)
 * Hiển thị Can Chi (Thiên Can + Địa Chi)
 */

const THIEN_CAN = ["Canh", "Tân", "Nhâm", "Quý", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ"];
const DIA_CHI = ["Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi"];

export function getCanChi(year: number): string {
  const can = THIEN_CAN[year % 10];
  const chi = DIA_CHI[year % 12];
  return `${can} ${chi}`;
}

export function formatVietnameseDate(dateStr?: string): string {
  if (!dateStr) return "Không rõ";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function formatWithCanChi(dateStr?: string): string {
  if (!dateStr) return "Không rõ";

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const formatted = formatVietnameseDate(dateStr);
  const canChi = getCanChi(date.getFullYear());

  return `${formatted} (${canChi})`;
}

export function calculateAge(birthDate?: string, deathDate?: string): string {
  if (!birthDate) return "";

  const birth = new Date(birthDate);
  const end = deathDate ? new Date(deathDate) : new Date();

  if (isNaN(birth.getTime())) return "";

  let age = end.getFullYear() - birth.getFullYear();
  const monthDiff = end.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
    age--;
  }

  return deathDate ? `Hưởng thọ ${age} tuổi` : `${age} tuổi`;
}

export function getZodiacAnimal(year: number): string {
  const animals = ["Khỉ", "Gà", "Chó", "Lợn", "Chuột", "Trâu", "Hổ", "Mèo", "Rồng", "Rắn", "Ngựa", "Dê"];
  return animals[year % 12];
}
