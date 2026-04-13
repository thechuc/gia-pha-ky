'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import type { Gender, RelationshipType, EventType } from '@prisma/client';
import { OverviewData } from '@/types/family';

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
  const family = await prisma.family.findFirst();
  if (!family) throw new Error('Family not found');

  const event = await prisma.event.create({
    data: {
      familyId: family.id,
      memberId: formData.memberId || (await prisma.familyMember.findFirst())?.id || '', // Fallback to first member
      title: formData.title,
      description: formData.description,
      // Parse ISO string safely. Example: "2026-03-31" -> valid Date
      eventDate: formData.date ? new Date(formData.date) : null,
      era: formData.era,
      icon: formData.icon,
      type: 'CUSTOM' as EventType,
      media: formData.media ? JSON.stringify(formData.media) : null,
    },
  });

  revalidatePath('/dashboard');
  return event;
}

export async function addDocument(formData: any) {
  const family = await prisma.family.findFirst();
  if (!family) throw new Error('Family not found');

  const doc = await prisma.document.create({
    data: {
      familyId: family.id,
      name: formData.title,
      url: formData.fileUrl || '/files/placeholder.pdf',
      mimeType: formData.mimeType || 'application/pdf',
      size: formData.size || 0,
      type: formData.type,
      description: formData.description,
      uploadedBy: 'Admin',
    },
  });

  revalidatePath('/dashboard');
  return doc;
}

// /**
//  * Temporary action to seed the database if it's empty.
//  * Triggered once to populate the 11 generations.
//  */
export async function updateFamilyInfo(id: string, data: { name: string, motto: string, description: string, origin: string }) {
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
  const updateData: any = { ...data };
  if (data.media) {
    updateData.media = JSON.stringify(data.media);
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
  await prisma.event.delete({
    where: { id }
  });

  revalidatePath('/dashboard');
  return { success: true };
}
