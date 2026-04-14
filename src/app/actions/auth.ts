"use server";

import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

export async function registerAction(formData: any) {
  const { name, email, password, requestBranchId } = formData;

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Email này đã được sử dụng." };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in pending state
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isApproved: false,
        requestBranchId: requestBranchId === "other" ? null : requestBranchId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Đã xảy ra lỗi hệ thống khi đăng ký." };
  }
}

export async function checkUserStatus(email: string, password?: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { isApproved: true, password: true }
    });

    if (!user) return { error: "USER_NOT_FOUND" };
    if (!user.isApproved) return { error: "NOT_APPROVED" };
    if (!user.password) return { error: "NO_PASSWORD" };
    
    // If password provided, verify it immediately
    if (password) {
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return { error: "INVALID_PASSWORD" };
      }
    }
    
    return { success: true };
  } catch (err) {
    console.error("checkUserStatus error:", err);
    return { error: "SYSTEM_ERROR" };
  }
}
