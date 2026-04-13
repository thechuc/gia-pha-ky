/**
 * Tiện ích tính toán xưng hô theo phong tục Miền Bắc (Bố, Mẹ, Ông nội, Bà nội, Cụ, Cố...)
 */

export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface KinshipMember {
  id: string;
  label: string;
  gender: Gender;
  generation: number;
  isSpouse?: boolean;
}

export function getKinshipTerm(
  descendant: KinshipMember,
  ancestor: KinshipMember,
  isDirect: boolean = true,
  isSenior: boolean = true // Dựa vào vị trí X (trái là anh/chị)
): string {
  const genDiff = descendant.generation - ancestor.generation;
  const isMale = ancestor.gender === "MALE";
  const isSpouse = ancestor.isSpouse;

  if (genDiff <= 0) return "Cùng đời / Đàn em";

  // Danh xưng Miền Bắc
  switch (genDiff) {
    case 1:
      if (isDirect || isSpouse) {
        if (isMale) return "Bố";
        // Vợ của Bố -> Mẹ
        if (isDirect || isSpouse) return "Mẹ"; 
      }
      // Họ hàng bàng hệ (Hàng Bác/Chú/Cô)
      if (isMale) {
        if (isSpouse) return "Chú (rể)"; // Chồng của Cô
        return isSenior ? "Bác" : "Chú";
      } else {
        if (isSpouse) return isSenior ? "Bác (dâu)" : "Thím"; // Vợ của Bác/Chú
        return "Cô";
      }
    case 2:
      if (isDirect) {
        return isMale ? "Ông nội" : "Bà nội";
      }
      // Hàng Ông bác, Ông chú, Bà cô...
      if (isMale) {
        if (isSpouse) return "Ông (rể)"; // Chồng của Bà cô
        return isSenior ? "Ông bác" : "Ông chú";
      } else {
        if (isSpouse) return isSenior ? "Bà bác" : "Bà thím"; // Vợ của Ông bác/Ông chú
        return "Bà cô";
      }
    case 3:
      if (isDirect) {
        return isMale ? "Cụ ông" : "Cụ bà";
      }
      return isMale ? "Cụ bác/chú" : "Cụ cô/dì";
    case 4:
      return isMale ? "Cố nội (ông)" : "Cố nội ( bà)";
    case 5:
      return isMale ? "Cao tổ (ông)" : "Cao tổ (bà)";
    case 6:
      return isMale ? "Tiên tổ (ông)" : "Tiên tổ (bà)";
    case 7:
      return isMale ? "Viễn tổ (ông)" : "Viễn tổ (bà)";
    case 8:
    case 9:
    case 10:
      return `${isMale ? "Cụ tổ" : "Bà tổ"} đời ${genDiff}`;
    case 11:
      return isMale ? "Thủy tổ (Ông)" : "Thủy tổ (Bà)";
    default:
      return `${genDiff} đời trước (${isMale ? "Cụ tổ" : "Bà tổ"})`;
  }
}
