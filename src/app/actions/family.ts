'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import type { Gender, RelationshipType, EventType } from '@prisma/client';
import { OverviewData } from '@/types/family';
import { canEditEvents, canEditDocuments, canEditFamily } from '@/utils/permissions';
import { uploadToDrive, deleteFromDrive } from '@/lib/googleDrive';

/**
 * Extracts the file ID from a Google Drive webViewLink
 */
function extractDriveId(url: string | null): string | null {
  if (!url || !url.includes('drive.google.com')) return null;
  const match = url.match(/\/d\/([^/]+)\//);
  return match ? match[1] : null;
}

export async function getOverviewData(): Promise<OverviewData | null> {
  const family = await prisma.family.findFirst({
    include: {
      events: {
        orderBy: { eventDate: 'desc' },
      },
      documents: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!family) return null;

  const totalMembers = await prisma.familyMember.count({
    where: { familyId: family.id },
  });

  const maxGenerationMember = await prisma.familyMember.findFirst({
    where: { familyId: family.id },
    orderBy: { generation: 'desc' },
    select: { generation: true },
  });

  const totalGenerations = maxGenerationMember?.generation || 1;

  return {
    family,
    events: family.events.map((e) => ({
      id: e.id,
      date: e.eventDate ? new Date(e.eventDate).toLocaleDateString("vi-VN") : "",
      isoDate: e.eventDate ? new Date(e.eventDate).toISOString().split("T")[0] : "",
      era: e.era || "",
      title: e.title,
      description: e.description || "",
      iconName: e.icon || "Star",
      type: e.type.toLowerCase(),
      media: e.media ? JSON.parse(e.media) : undefined,
    })),
    documents: family.documents,
    totalMembers,
    totalGenerations,
  } as unknown as OverviewData;
}

export async function addEvent(formData: any) {
  if (!await canEditEvents()) {
    throw new Error('Bạn không có quyền thêm sự kiện.');
  }
  const family = await prisma.family.findFirst();
  if (!family) throw new Error('Family not found');

  const processedMedia: any[] = [];
  if (formData.media && Array.isArray(formData.media)) {
    for (const file of formData.media) {
      if (file.url && file.url.startsWith('data:')) {
        try {
          const base64Data = file.url.split(';base64,').pop();
          if (base64Data) {
            const buffer = Buffer.from(base64Data, 'base64');
            const driveResult = await uploadToDrive(buffer, file.name || `event-${Date.now()}`, file.type || 'image/jpeg');
            processedMedia.push({
              id: driveResult.id,
              url: driveResult.webViewLink,
              name: file.name,
              type: file.type
            });
          }
        } catch (error) {
          console.error('Error uploading event media to Drive:', error);
        }
      } else {
        processedMedia.push(file);
      }
    }
  }

  const event = await prisma.event.create({
    data: {
      familyId: family.id,
      memberId: formData.memberId || (await prisma.familyMember.findFirst())?.id || '',
      title: formData.title,
      description: formData.description,
      eventDate: formData.date ? new Date(formData.date) : null,
      era: formData.era,
      icon: formData.icon,
      type: 'CUSTOM' as EventType,
      media: JSON.stringify(processedMedia),
    },
  });

  revalidatePath('/dashboard');
  return event;
}

export async function updateFamilyInfo(id: string, data: { name: string, motto: string, description: string, origin: string }) {
  if (!await canEditFamily()) {
    throw new Error('Bạn không có quyền chỉnh sửa thông tin dòng họ.');
  }
  const family = await prisma.family.update({
    where: { id },
    data: {
      name: data.name,
      motto: data.motto,
      description: data.description,
      origin: data.origin,
    }
  });

  revalidatePath('/dashboard');
  return family;
}

export async function updateEvent(id: string, data: any) {
  if (!await canEditEvents()) {
    throw new Error('Bạn không có quyền chỉnh sửa sự kiện.');
  }
  
  const oldEvent = await prisma.event.findUnique({ where: { id } });
  if (!oldEvent) throw new Error('Event not found');

  const oldMedia = oldEvent.media ? JSON.parse(oldEvent.media) : [];
  const processedMedia: any[] = [];
  
  if (data.media && Array.isArray(data.media)) {
    const currentUrls = new Set(data.media.map((m: any) => m.url));
    
    // Delete removed files from Drive
    for (const oldFile of oldMedia) {
      if (!currentUrls.has(oldFile.url)) {
        const driveId = oldFile.id || extractDriveId(oldFile.url);
        if (driveId) await deleteFromDrive(driveId);
      }
    }

    // Process new files
    for (const file of data.media) {
      if (file.url && file.url.startsWith('data:')) {
        try {
          const base64Data = file.url.split(';base64,').pop();
          if (base64Data) {
            const buffer = Buffer.from(base64Data, 'base64');
            const driveResult = await uploadToDrive(buffer, file.name || `event-${Date.now()}`, file.type || 'image/jpeg');
            processedMedia.push({
              id: driveResult.id,
              url: driveResult.webViewLink,
              name: file.name,
              type: file.type
            });
          }
        } catch (error) {
          console.error('Error updating event media on Drive:', error);
        }
      } else {
        processedMedia.push(file);
      }
    }
  }

  const updateData: any = { ...data };
  if (data.media) {
    updateData.media = JSON.stringify(processedMedia);
  }
  if (data.date) {
    updateData.eventDate = new Date(data.date);
    delete updateData.date;
  }
  if (data.iconName) {
    updateData.icon = data.iconName;
    delete updateData.iconName;
  }

  const event = await prisma.event.update({
    where: { id },
    data: updateData,
  });

  revalidatePath('/dashboard');
  return event;
}

export async function deleteEvent(id: string) {
  if (!await canEditEvents()) {
    throw new Error('Bạn không có quyền xóa sự kiện.');
  }

  const event = await prisma.event.findUnique({ where: { id } });
  if (event?.media) {
    const media = JSON.parse(event.media);
    for (const file of media) {
      const driveId = file.id || extractDriveId(file.url);
      if (driveId) {
        try {
          await deleteFromDrive(driveId);
        } catch (err) {
          console.error('Error deleting event media from Drive:', err);
        }
      }
    }
  }

  await prisma.event.delete({ where: { id } });

  revalidatePath('/dashboard');
  return { success: true };
}
