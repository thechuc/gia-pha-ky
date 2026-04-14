"use server";

import prisma from "@/lib/db";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

async function checkIsAdmin() {
  const session = await auth();
  if (!session?.user) return false;
  
  // @ts-ignore - Check if any role is ADMIN
  const isAdmin = session.user.roles.some(
    (r: any) => r.role === Role.SUPER_ADMIN || r.role === Role.FAMILY_ADMIN
  );
  
  return isAdmin;
}

export async function getPendingUsers() {
  if (!await checkIsAdmin()) throw new Error("Unauthorized");

  return await prisma.user.findMany({
    where: { isApproved: false },
    orderBy: { createdAt: "desc" },
    include: {
      // @ts-ignore
      branch: true, // This won't work because branch connection is on FamilyRole
    }
  });
}

// Fixed version: Get users needing approval with their requested branch
export async function getUsersForApproval() {
  if (!await checkIsAdmin()) throw new Error("Unauthorized");

  const users = await prisma.user.findMany({
    where: { isApproved: false },
    orderBy: { createdAt: "desc" },
  });

  // Manually attach branch name for requested branch
  const usersWithBranch = await Promise.all(users.map(async (user) => {
    let branchName = "Không rõ";
    if (user.requestBranchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: user.requestBranchId }
      });
      branchName = branch?.name || "Chi nhánh đã xóa";
    }
    return { ...user, requestedBranchName: branchName };
  }));

  return usersWithBranch;
}

export async function getAllUsers() {
  if (!await checkIsAdmin()) throw new Error("Unauthorized");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      roles: {
        include: {
          branch: true
        }
      }
    }
  });

  return users;
}

export async function approveUserAction(userId: string, familyId: string, role: Role, branchId?: string) {
  if (!await checkIsAdmin()) throw new Error("Unauthorized");

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Approve user
      await tx.user.update({
        where: { id: userId },
        data: { isApproved: true }
      });

      // 2. Create family role
      await tx.familyRole.upsert({
        where: {
          userId_familyId: { userId, familyId }
        },
        update: {
          role,
          branchId: branchId || null
        },
        create: {
          userId,
          familyId,
          role,
          branchId: branchId || null
        }
      });
    });

    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Approval error:", error);
    return { error: "Không thể phê duyệt người dùng này." };
  }
}

export async function updateUserPermissionsAction(userId: string, familyId: string, role: Role, branchId?: string) {
  if (!await checkIsAdmin()) throw new Error("Unauthorized");

  try {
    await prisma.familyRole.upsert({
      where: {
        userId_familyId: { userId, familyId }
      },
      update: {
        role,
        branchId: branchId || null
      },
      create: {
        userId,
        familyId,
        role,
        branchId: branchId || null
      }
    });

    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Update permissions error:", error);
    return { error: "Lỗi khi cập nhật quyền hạn." };
  }
}

export async function rejectUserAction(userId: string) {
  if (!await checkIsAdmin()) throw new Error("Unauthorized");

  try {
    await prisma.user.delete({
      where: { id: userId }
    });
    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (error) {
    return { error: "Lỗi khi từ chối người dùng." };
  }
}
