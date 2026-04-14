import { auth } from "@/auth";
import { Role } from "@prisma/client";
import prisma from "@/lib/db";

/**
 * Interface đại diện cho bộ quyền của người dùng
 */
export interface UserPermissions {
  canApprove: boolean;       // Phê duyệt người dùng (Admin/FamilyAdmin)
  canEditGlobal: boolean;    // Chỉnh sửa mọi thứ (Admin/FamilyAdmin/Editor)
  canEditFamily: boolean;    // Chỉnh sửa thông tin dòng họ (Admin/FamilyAdmin/Editor)
  canEditEvents: boolean;    // Thao tác sự kiện (Admin/FamilyAdmin/Editor)
  canEditDocuments: boolean; // Thao tác tài liệu (Admin/FamilyAdmin/Editor)
  isBranchManager: boolean;  // Có vai trò theo nhánh
  userRoles: any[];          // Danh sách roles để kiểm tra chi tiết
}

/**
 * Lấy bộ quyền tổng quát từ session
 */
export async function getPermissions(): Promise<UserPermissions> {
  const session = await auth();
  if (!session?.user) {
    return {
      canApprove: false,
      canEditGlobal: false,
      canEditFamily: false,
      canEditEvents: false,
      canEditDocuments: false,
      isBranchManager: false,
      userRoles: [],
    };
  }

  // @ts-ignore
  const userRoles = session.user.roles || [];
  
  // Kiểm tra Admin cấp cao qua Email cấu hình (Bypass)
  const isGlobalAdmin = session.user.email === process.env.NEXT_PUBLIC_ADMIN_ID;

  const isSuperAdmin = isGlobalAdmin || userRoles.some((r: any) => r.role === Role.SUPER_ADMIN);
  const isFamilyAdmin = userRoles.some((r: any) => r.role === Role.FAMILY_ADMIN);
  const isEditor = userRoles.some((r: any) => r.role === Role.EDITOR);
  const hasBranchRole = userRoles.some((r: any) => r.branchId !== null);

  const canEditGlobal = isSuperAdmin || isFamilyAdmin || isEditor;

  return {
    canApprove: isSuperAdmin || isFamilyAdmin,
    canEditGlobal,
    canEditFamily: canEditGlobal,
    canEditEvents: canEditGlobal,
    canEditDocuments: canEditGlobal,
    isBranchManager: hasBranchRole,
    userRoles,
  };
}

/**
 * Kiểm tra quyền chỉnh sửa một thành viên cụ thể
 */
export async function canEditMember(memberId: string) {
  const perms = await getPermissions();
  if (perms.canEditGlobal) return true;

  // Nếu là vai trò theo nhánh, kiểm tra member có thuộc nhánh đó không
  for (const r of perms.userRoles) {
    if (r.branchId) {
      const member = await prisma.familyMember.findUnique({
        where: { id: memberId },
        select: { branchId: true }
      });

      if (member && member.branchId === r.branchId) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Kiểm tra quyền thêm thành viên vào một nhánh cụ thể
 */
export async function canAddMember(branchId?: string) {
  const perms = await getPermissions();
  if (perms.canEditGlobal) return true;

  // Vai trò theo nhánh chỉ được thêm vào chính nhánh của mình
  if (branchId) {
    return perms.userRoles.some((r: any) => r.branchId === branchId);
  }

  return false;
}

/**
 * Các hàm tiện ích kiểm tra nhanh
 */
export async function canEditEvents() {
  const p = await getPermissions();
  return p.canEditEvents;
}

export async function canEditDocuments() {
  const p = await getPermissions();
  return p.canEditDocuments;
}

export async function canEditFamily() {
  const p = await getPermissions();
  return p.canEditFamily;
}

export async function canApproveUsers() {
  const p = await getPermissions();
  return p.canApprove;
}
