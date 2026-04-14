'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { canEditFamily } from '@/utils/permissions';
import { uploadToDrive, deleteFromDrive } from '@/lib/googleDrive';
import bcrypt from 'bcryptjs';

/**
 * Cập nhật thông tin bản sắc dòng họ
 */
export async function updateFamilyIdentityAction(id: string, data: any) {
  if (!await canEditFamily()) {
    throw new Error('Bạn không có quyền chỉnh sửa thông tin dòng họ.');
  }

  const updateData: any = {
    name: data.name,
    motto: data.motto,
    description: data.description,
    origin: data.origin,
  };

  // Xử lý ảnh bìa (Cover Image)
  if (data.coverImage && data.coverImage.startsWith('data:')) {
    try {
      const base64Data = data.coverImage.split(';base64,').pop();
      if (base64Data) {
        const buffer = Buffer.from(base64Data, 'base64');
        const driveResult = await uploadToDrive(buffer, `family-cover-${Date.now()}`, 'image/jpeg');
        
        // Xóa ảnh cũ nếu có
        const currentFamily = await prisma.family.findUnique({ where: { id }, select: { coverImage: true } });
        if (currentFamily?.coverImage && currentFamily.coverImage.includes('drive.google.com')) {
          const match = currentFamily.coverImage.match(/\/d\/([^/]+)\//);
          if (match) await deleteFromDrive(match[1]);
        }

        updateData.coverImage = driveResult.directLink;
      }
    } catch (error) {
      console.error('Error uploading family cover to Drive:', error);
    }
  }

  const family = await prisma.family.update({
    where: { id },
    data: updateData
  });

  revalidatePath('/dashboard/settings/identity');
  revalidatePath('/dashboard');
  return { success: true, family };
}

/**
 * Cập nhật cấu hình hiển thị và vận hành (JSON settings)
 */
export async function updateFamilySettingsAction(id: string, settings: any) {
  if (!await canEditFamily()) {
    throw new Error('Bạn không có quyền chỉnh sửa cài đặt hệ thống.');
  }

  const currentFamily = await prisma.family.findUnique({ where: { id } });
  if (!currentFamily) throw new Error('Family not found');

  const currentSettings = currentFamily.settings ? (typeof currentFamily.settings === 'string' ? JSON.parse(currentFamily.settings) : currentFamily.settings) : {};
  const newSettings = { ...currentSettings, ...settings };

  await prisma.family.update({
    where: { id },
    data: {
      settings: newSettings,
      isPublic: settings.isPublic !== undefined ? settings.isPublic : currentFamily.isPublic
    }
  });

  revalidatePath('/dashboard/settings/appearance');
  revalidatePath('/dashboard/tree');
  return { success: true };
}

/**
 * Cập nhật thông tin cá nhân
 */
export async function updatePersonalProfileAction(data: { name: string, image?: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      image: data.image
    }
  });

  revalidatePath('/dashboard/settings/profile');
  return { success: true };
}

/**
 * Thay đổi mật khẩu
 */
export async function changePasswordAction(data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !user.password) throw new Error('Cửa sổ đăng nhập bằng mạng xã hội không hỗ trợ đổi mật khẩu trực tiếp.');

  const isValid = await bcrypt.compare(data.currentPassword, user.password);
  if (!isValid) throw new Error('Mật khẩu hiện tại không chính xác.');

  const hashedPassword = await bcrypt.hash(data.newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword }
  });

  return { success: true };
}

/**
 * Lấy tùy chọn hiển thị cây của người dùng (Có logic fallback về cấu hình dòng họ)
 */
export async function getUserPreferencesAction() {
  const session = await auth();
  const userId = session?.user?.id;

  // 1. Lấy cấu hình mặc định từ Dòng họ
  const family = await prisma.family.findFirst();
  const familySettings = family?.settings ? (typeof family.settings === 'string' ? JSON.parse(family.settings) : family.settings) : {};
  
  const defaultPrefs = {
    showAvatar: familySettings.showAvatar ?? true,
    showDates: familySettings.showDates ?? true,
    showGeneration: familySettings.showGeneration ?? true,
    showHonorifics: familySettings.showHonorifics ?? true,
    showOccupation: familySettings.showOccupation ?? true,
    showSpouses: familySettings.showSpouses ?? true,
    showBranch: familySettings.showBranch ?? true
  };

  if (!userId) return defaultPrefs;

  // 2. Lấy tùy chọn riêng của người dùng
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferences: true }
  });

  if (!user?.preferences) return defaultPrefs;

  const userPrefs = typeof user.preferences === 'string' ? JSON.parse(user.preferences) : user.preferences;
  
  // Merge để đảm bảo luôn có đủ các trường
  return { ...defaultPrefs, ...userPrefs };
}

/**
 * Lưu tùy chọn hiển thị cây của người dùng
 */
export async function updateUserPreferencesAction(preferences: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      preferences: preferences
    }
  });

  return { success: true };
}
