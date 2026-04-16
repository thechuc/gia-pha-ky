"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface MemorialComment {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

export interface MemorialMember {
  id: string;
  fullName: string;
  avatar: string | null;
  generation: number;
  birthYear: number | null;
  deathYear: number | null;
  dateOfBirth: Date | null;
  dateOfDeath: Date | null;
  biography: string | null;
  lastIncenseLitAt: Date | null;
  metadata: any;
  comments: MemorialComment[];
}

export async function getMemorialMembers(): Promise<MemorialMember[]> {
  const family = await prisma.family.findFirst();
  if (!family) return [];

  const members = await prisma.familyMember.findMany({
    where: {
      familyId: family.id,
      isAlive: false,
    },
    select: {
      id: true,
      fullName: true,
      avatar: true,
      generation: true,
      birthYear: true,
      deathYear: true,
      dateOfBirth: true,
      dateOfDeath: true,
      biography: true,
      lastIncenseLitAt: true,
      metadata: true,
      comments: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          authorId: true,
          content: true,
          createdAt: true,
        },
      },
    },
    orderBy: [
      { generation: "asc" },
      { birthYear: "asc" },
      { dateOfBirth: "asc" },
    ],
  });

  return members as MemorialMember[];
}

export async function getMemorialMemberById(id: string): Promise<MemorialMember | null> {
  const member = await prisma.familyMember.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      avatar: true,
      generation: true,
      birthYear: true,
      deathYear: true,
      dateOfBirth: true,
      dateOfDeath: true,
      biography: true,
      lastIncenseLitAt: true,
      metadata: true,
      comments: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          authorId: true,
          content: true,
          createdAt: true,
        },
      },
    },
  });

  return member as MemorialMember | null;
}

export async function addMemorialComment(memberId: string, authorName: string, content: string) {
  if (!content.trim() || !authorName.trim()) {
    throw new Error("Vui lòng nhập đầy đủ tên và lời tưởng nhớ.");
  }

  const comment = await prisma.comment.create({
    data: {
      memberId,
      authorId: authorName,
      content: content.trim(),
      isApproved: true,
    },
  });

  revalidatePath("/dashboard/memorial");
  return comment;
}
