"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function clearAllData() {
  try {
    // Delete in order of dependencies
    await prisma.relationship.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.familyMember.deleteMany({});
    await prisma.branch.deleteMany({});
    await prisma.familyRole.deleteMany({});
    await prisma.family.deleteMany({});
    
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/members");
    revalidatePath("/dashboard/tree");
    return { success: true };
  } catch (error) {
    console.error("Failed to clear data:", error);
    throw new Error("Không thể xóa dữ liệu.");
  }
}

export async function initializeHeritage(familyData: any, ancestorData: any) {
  try {
    // 1. Create Family
    const family = await prisma.family.create({
      data: {
        name: familyData.name,
        slug: familyData.name.toLowerCase().replace(/ /g, "-") + "-" + Math.random().toString(36).substring(2, 7),
        description: familyData.description,
        motto: familyData.motto,
        origin: familyData.origin,
      },
    });

    // 2. Create Default Branch (Chi Trưởng)
    const branch = await prisma.branch.create({
      data: {
        familyId: family.id,
        name: "Chi Trưởng",
        description: "Nhánh gốc của dòng họ",
      },
    });

    // 3. Create Thủy Tổ (Ancestor) - Generation 1
    const fullName = `${ancestorData.lastName} ${ancestorData.firstName}`.trim();
    await prisma.familyMember.create({
      data: {
        familyId: family.id,
        branchId: branch.id,
        firstName: ancestorData.firstName,
        lastName: ancestorData.lastName,
        fullName: fullName,
        gender: ancestorData.gender || "MALE",
        generation: 1,
        honorific: ancestorData.honorific,
        alias: ancestorData.alias,
        title: ancestorData.title,
        isAlive: false, // Thủy tổ thường đã khuất
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/members");
    revalidatePath("/dashboard/tree");
    return { success: true, familyId: family.id };
  } catch (error) {
    console.error("Failed to initialize heritage:", error);
    throw new Error("Không thể khởi tạo di sản.");
  }
}
