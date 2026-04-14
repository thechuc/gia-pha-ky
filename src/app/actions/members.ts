'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { Prisma, type Gender, type RelationshipType } from '@prisma/client';
import { Member, Branch, MemberStats, SimpleMember, MemberFilters, MemberFormData, NewSpouseData } from '@/types/member';
import { canAddMember, canEditMember } from '@/utils/permissions';
import { uploadToDrive, deleteFromDrive } from '@/lib/googleDrive';

/**
 * Extracts the file ID from a Google Drive webViewLink
 */
function extractDriveId(url: string | null): string | null {
  if (!url || !url.includes('drive.google.com')) return null;
  // Standard webViewLink format: https://drive.google.com/file/d/[ID]/view?usp=drivesdk
  const match = url.match(/\/d\/([^/]+)\//);
  return match ? match[1] : null;
}

// ─── Queries ───

export async function getMembers(filters?: MemberFilters): Promise<Member[]> {
  const family = await prisma.family.findFirst();
  if (!family) return [];

  const where: Prisma.FamilyMemberWhereInput = { familyId: family.id };

  if (filters?.generation) {
    where.generation = filters.generation;
  }
  if (filters?.gender) {
    where.gender = filters.gender;
  }
  if (filters?.isAlive !== undefined) {
    where.isAlive = filters.isAlive;
  }
  if (filters?.branchId) {
    where.branchId = filters.branchId;
  }
  if (filters?.search) {
    where.fullName = { contains: filters.search };
  }

  const orderBy: Prisma.FamilyMemberOrderByWithRelationInput = {};
  const sortBy = filters?.sortBy || 'generation';
  const sortOrder = filters?.sortOrder || 'asc';
  orderBy[sortBy === 'name' ? 'fullName' : sortBy] = sortOrder;

  const members = await prisma.familyMember.findMany({
    where,
    orderBy,
    include: {
      branch: { select: { id: true, name: true } },
      sourceRels: {
        include: { targetMember: { select: { id: true, fullName: true, gender: true, isAlive: true } } },
      },
      targetRels: {
        include: { sourceMember: { select: { id: true, fullName: true, gender: true, isAlive: true } } },
      },
    },
  });

  return members as unknown as Member[];
}

export async function getMemberById(id: string): Promise<Member | null> {
  const member = await prisma.familyMember.findUnique({
    where: { id },
    include: {
      branch: true,
      sourceRels: {
        include: { targetMember: true },
      },
      targetRels: {
        include: { sourceMember: true },
      },
      events: { orderBy: { eventDate: 'asc' } },
    },
  });

  return member as unknown as Member;
}

export async function getMemberStats(): Promise<MemberStats | null> {
  const family = await prisma.family.findFirst();
  if (!family) return null;

  const where = { familyId: family.id };

  const [total, male, female, alive, deceased, generations] = await Promise.all([
    prisma.familyMember.count({ where }),
    prisma.familyMember.count({ where: { ...where, gender: 'MALE' } }),
    prisma.familyMember.count({ where: { ...where, gender: 'FEMALE' } }),
    prisma.familyMember.count({ where: { ...where, isAlive: true } }),
    prisma.familyMember.count({ where: { ...where, isAlive: false } }),
    prisma.familyMember.groupBy({ by: ['generation'], where }),
  ]);

  return {
    total,
    male,
    female,
    alive,
    deceased,
    generations: generations.length,
    maxGeneration: Math.max(...generations.map(g => g.generation), 0),
  };
}

export async function getBranches(): Promise<Branch[]> {
  const family = await prisma.family.findFirst();
  if (!family) return [];

  return prisma.branch.findMany({
    where: { familyId: family.id },
    orderBy: { order: 'asc' },
  });
}

export async function getAllMembersSimple(): Promise<SimpleMember[]> {
  const family = await prisma.family.findFirst();
  if (!family) return [];

  return prisma.familyMember.findMany({
    where: { familyId: family.id },
    select: { id: true, fullName: true, gender: true, generation: true },
    orderBy: [{ generation: 'asc' }, { fullName: 'asc' }],
  });
}

// ─── Mutations ───

export async function addMember(data: MemberFormData) {
  const family = await prisma.family.findFirst();
  if (!family) throw new Error('Family not found');

  // Check permission
  if (!await canAddMember(data.branchId || undefined)) {
    throw new Error('Bạn không có quyền thêm thành viên vào Chi/Nhánh này.');
  }

  let avatarUrl = data.avatar || null;
  
  // Handle Avatar upload to Google Drive
  if (avatarUrl && avatarUrl.startsWith('data:')) {
    try {
      const base64Data = avatarUrl.split(';base64,').pop();
      if (base64Data) {
        const buffer = Buffer.from(base64Data, 'base64');
        const driveResult = await uploadToDrive(buffer, `avatar-${Date.now()}`, 'image/jpeg');
        avatarUrl = driveResult.webViewLink || null;
      }
    } catch (error) {
      console.error('Error uploading avatar to Drive:', error);
    }
  }

  const fullName = `${data.lastName} ${data.firstName}`.trim();

  // ── Auto-calculate generation from parents ──
  let generation = data.generation ?? 1;
  if (data.fatherId || data.motherId) {
    const parentId = data.fatherId || data.motherId;
    const parent = await prisma.familyMember.findUnique({
      where: { id: parentId! },
      select: { generation: true },
    });
    if (parent) generation = parent.generation + 1;
  }

  // ── Resolve branchId (find-or-create branch by name) ──
  let resolvedBranchId: string | null = data.branchId || null;
  if (data.branchName) {
    const existing = await prisma.branch.findFirst({
      where: { familyId: family.id, name: data.branchName },
    });
    if (existing) {
      resolvedBranchId = existing.id;
    } else {
      const created = await prisma.branch.create({
        data: { familyId: family.id, name: data.branchName, description: null },
      });
      resolvedBranchId = created.id;
    }
  } else if (!data.branchId) {
    resolvedBranchId = null;
  }

  const member = await prisma.familyMember.create({
    data: {
      familyId: family.id,
      branchId: resolvedBranchId,
      firstName: data.firstName,
      lastName: data.lastName,
      fullName,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth && !isNaN(new Date(data.dateOfBirth).getTime()) ? new Date(data.dateOfBirth) : null,
      birthDay: data.birthDay ?? null,
      birthMonth: data.birthMonth ?? null,
      birthYear: data.birthYear ?? null,
      isBirthDateLunar: data.isBirthDateLunar ?? false,
      
      dateOfDeath: data.dateOfDeath && !isNaN(new Date(data.dateOfDeath).getTime()) ? new Date(data.dateOfDeath) : null,
      deathDay: data.deathDay ?? null,
      deathMonth: data.deathMonth ?? null,
      deathYear: data.deathYear ?? null,
      isDeathDateLunar: data.isDeathDateLunar ?? false,
      
      isAlive: data.isAlive,
      occupation: data.occupation || null,
      birthPlace: data.birthPlace || null,
      currentLocation: data.currentLocation || null,
      biography: data.biography || null,
      avatar: avatarUrl,
      generation,
      birthOrder: data.birthOrder || 0,
      honorific: data.honorific || null,
      alias: data.alias || null,
      title: data.title || null,
      metadata: data.metadata || {},
    },
  });

  // ── Relationships ──
  if (data.fatherId) {
    await prisma.relationship.create({
      data: { familyId: family.id, sourceMemberId: data.fatherId, targetMemberId: member.id, type: 'PARENT_CHILD' },
    });
  }
  if (data.motherId) {
    await prisma.relationship.create({
      data: { familyId: family.id, sourceMemberId: data.motherId, targetMemberId: member.id, type: 'PARENT_CHILD' },
    });
  }
  if (data.spouseId) {
    await prisma.relationship.create({
      data: { familyId: family.id, sourceMemberId: data.spouseId, targetMemberId: member.id, type: 'SPOUSE' },
    });
  }

  // ── Spouse: create new member and link ──
  if (data.newSpouse) {
    const spouseFullName = `${data.newSpouse.lastName} ${data.newSpouse.firstName}`.trim();
    const spouseMember = await prisma.familyMember.create({
      data: {
        familyId: family.id,
        firstName: data.newSpouse.firstName,
        lastName: data.newSpouse.lastName,
        fullName: spouseFullName,
        gender: data.newSpouse.gender,
        dateOfBirth: data.newSpouse.dateOfBirth && !isNaN(new Date(data.newSpouse.dateOfBirth).getTime())
          ? new Date(data.newSpouse.dateOfBirth) : null,
        birthPlace: data.newSpouse.birthPlace || null,
        isAlive: true,
        generation: data.generation,
      },
    });
    await prisma.relationship.create({
      data: { familyId: family.id, sourceMemberId: spouseMember.id, targetMemberId: member.id, type: 'SPOUSE' },
    });
  }

  revalidatePath('/dashboard/members');
  revalidatePath('/dashboard');
  return member;
}

export async function updateMember(id: string, data: Partial<MemberFormData>) {
  if (!await canEditMember(id)) {
    throw new Error('Bạn không có quyền chỉnh sửa thành viên này.');
  }

  const currentMember = await prisma.familyMember.findUnique({ where: { id } });
  if (!currentMember) throw new Error('Member not found');

  const updateData: Prisma.FamilyMemberUpdateInput = {};

  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.firstName !== undefined || data.lastName !== undefined) {
    const fn = data.firstName ?? currentMember.firstName;
    const ln = data.lastName ?? currentMember.lastName;
    updateData.fullName = `${ln} ${fn}`.trim();
  }
  
  if (data.gender !== undefined) updateData.gender = data.gender;
  if (data.dateOfBirth !== undefined) {
    updateData.dateOfBirth = data.dateOfBirth && !isNaN(new Date(data.dateOfBirth).getTime()) ? new Date(data.dateOfBirth) : null;
  }
  if (data.birthDay !== undefined) updateData.birthDay = data.birthDay ?? null;
  if (data.birthMonth !== undefined) updateData.birthMonth = data.birthMonth ?? null;
  if (data.birthYear !== undefined) updateData.birthYear = data.birthYear ?? null;
  if (data.isBirthDateLunar !== undefined) updateData.isBirthDateLunar = data.isBirthDateLunar;

  if (data.dateOfDeath !== undefined) {
    updateData.dateOfDeath = data.dateOfDeath && !isNaN(new Date(data.dateOfDeath).getTime()) ? new Date(data.dateOfDeath) : null;
  }
  if (data.deathDay !== undefined) updateData.deathDay = data.deathDay ?? null;
  if (data.deathMonth !== undefined) updateData.deathMonth = data.deathMonth ?? null;
  if (data.deathYear !== undefined) updateData.deathYear = data.deathYear ?? null;
  if (data.isDeathDateLunar !== undefined) updateData.isDeathDateLunar = data.isDeathDateLunar;

  if (data.isAlive !== undefined) updateData.isAlive = data.isAlive;
  
  // Handle Avatar Change on GDrive
  if (data.avatar !== undefined) {
    let newAvatarUrl = data.avatar || null;
    
    // If it's a new base64 upload
    if (newAvatarUrl && newAvatarUrl.startsWith('data:')) {
      try {
        // Delete old avatar from Drive if exists
        const oldDriveId = extractDriveId(currentMember.avatar);
        if (oldDriveId) await deleteFromDrive(oldDriveId);

        const base64Data = newAvatarUrl.split(';base64,').pop();
        if (base64Data) {
          const buffer = Buffer.from(base64Data, 'base64');
          const driveResult = await uploadToDrive(buffer, `avatar-${Date.now()}`, 'image/jpeg');
          newAvatarUrl = driveResult.webViewLink || null;
        }
      } catch (error) {
        console.error('Error updating member avatar on Drive:', error);
      }
    } 
    // If avatar removed
    else if (newAvatarUrl === null && currentMember.avatar) {
      const oldDriveId = extractDriveId(currentMember.avatar);
      if (oldDriveId) await deleteFromDrive(oldDriveId);
    }
    
    updateData.avatar = newAvatarUrl;
  }

  if (data.occupation !== undefined) updateData.occupation = data.occupation || null;
  if (data.birthPlace !== undefined) updateData.birthPlace = data.birthPlace || null;
  if (data.currentLocation !== undefined) updateData.currentLocation = data.currentLocation || null;
  if (data.biography !== undefined) updateData.biography = data.biography || null;
  if (data.generation !== undefined) updateData.generation = data.generation;
  if (data.birthOrder !== undefined) updateData.birthOrder = data.birthOrder;
  if (data.honorific !== undefined) updateData.honorific = data.honorific || null;
  if (data.alias !== undefined)    updateData.alias = data.alias || null;
  if (data.title !== undefined) updateData.title = data.title || null;
  if (data.metadata !== undefined) updateData.metadata = data.metadata || {};

  // Branch: support branchName (find-or-create) or branchId
  if (data.branchName !== undefined) {
    if (!data.branchName) {
      updateData.branch = { disconnect: true };
    } else {
      const family = await prisma.family.findFirst();
      if (family) {
        const existing = await prisma.branch.findFirst({
          where: { familyId: family.id, name: data.branchName },
        });
        const branch = existing || await prisma.branch.create({
          data: { familyId: family.id, name: data.branchName, description: null },
        });
        updateData.branch = { connect: { id: branch.id } };
      }
    }
  } else if (data.branchId !== undefined) {
    updateData.branch = data.branchId ? { connect: { id: data.branchId } } : { disconnect: true };
  }

  const updated = await prisma.familyMember.update({
    where: { id },
    data: updateData,
  });

  revalidatePath('/dashboard/members');
  revalidatePath('/dashboard');
  return updated;
}

export async function deleteMember(id: string) {
  if (!await canEditMember(id)) {
    throw new Error('Bạn không có quyền xóa thành viên này.');
  }

  const member = await prisma.familyMember.findUnique({ where: { id } });
  
  // Cleanup avatar from Drive
  if (member?.avatar) {
    const driveId = extractDriveId(member.avatar);
    if (driveId) await deleteFromDrive(driveId);
  }

  await prisma.familyMember.delete({ where: { id } });

  revalidatePath('/dashboard/members');
  revalidatePath('/dashboard');
  return { success: true };
}

// ─── Relationship Management (for EditMemberModal) ───────────────────────────

export async function addMemberRelationship(
  memberId: string,
  relatedMemberId: string,
  type: RelationshipType,
  role: 'source' | 'target' = 'target'
) {
  // Check permission
  if (!await canEditMember(memberId)) {
    throw new Error('Bạn không có quyền chỉnh sửa thành viên này.');
  }

  const family = await prisma.family.findFirst();
  if (!family) throw new Error('Family not found');

  // For PARENT_CHILD: relatedMember is parent (source), member is child (target)
  // For SPOUSE: either order works, use memberId as source
  const sourceMemberId = role === 'target' ? relatedMemberId : memberId;
  const targetMemberId = role === 'target' ? memberId : relatedMemberId;

  // Avoid duplicate
  const existing = await prisma.relationship.findFirst({
    where: {
      OR: [
        { sourceMemberId, targetMemberId, type },
        { sourceMemberId: targetMemberId, targetMemberId: sourceMemberId, type },
      ],
    },
  });
  if (existing) return existing;

  const rel = await prisma.relationship.create({
    data: { familyId: family.id, sourceMemberId, targetMemberId, type },
  });

  revalidatePath('/dashboard/members');
  revalidatePath('/dashboard/tree');
  return rel;
}

export async function removeRelationship(relationshipId: string) {
  const rel = await prisma.relationship.findUnique({
    where: { id: relationshipId },
    select: { sourceMemberId: true, targetMemberId: true }
  });
  
  if (rel && (!await canEditMember(rel.sourceMemberId) && !await canEditMember(rel.targetMemberId))) {
    throw new Error('Bạn không có quyền chỉnh sửa mối quan hệ này.');
  }

  await prisma.relationship.delete({ where: { id: relationshipId } });
  revalidatePath('/dashboard/members');
  revalidatePath('/dashboard/tree');
  return { success: true };
}

export async function addNewSpouseAndLink(memberId: string, spouseData: NewSpouseData) {
  // Check permission
  if (!await canEditMember(memberId)) {
    throw new Error('Bạn không có quyền chỉnh sửa thành viên này.');
  }

  const family = await prisma.family.findFirst();
  if (!family) throw new Error('Family not found');

  const member = await prisma.familyMember.findUnique({ where: { id: memberId } });
  if (!member) throw new Error('Member not found');

  const spouseFullName = `${spouseData.lastName} ${spouseData.firstName}`.trim();
  const spouseMember = await prisma.familyMember.create({
    data: {
      familyId: family.id,
      firstName: spouseData.firstName,
      lastName: spouseData.lastName,
      fullName: spouseFullName,
      gender: spouseData.gender,
      dateOfBirth: spouseData.dateOfBirth && !isNaN(new Date(spouseData.dateOfBirth).getTime())
        ? new Date(spouseData.dateOfBirth) : null,
      birthDay: spouseData.birthDay ?? null,
      birthMonth: spouseData.birthMonth ?? null,
      birthYear: spouseData.birthYear ?? null,
      isBirthDateLunar: spouseData.isBirthDateLunar ?? false,
      birthPlace: spouseData.birthPlace || null,
      isAlive: true,
      generation: member.generation,
    },
  });

  await prisma.relationship.create({
    data: {
      familyId: family.id,
      sourceMemberId: spouseMember.id,
      targetMemberId: memberId,
      type: 'SPOUSE',
    },
  });

  revalidatePath('/dashboard/members');
  revalidatePath('/dashboard/tree');
  return spouseMember;
}

// ─── Sibling Reorder ─────────────────────────────────────────────────────────

export async function swapSiblingOrder(memberId: string, direction: 'left' | 'right') {
  // Check permission
  if (!await canEditMember(memberId)) {
    throw new Error('Bạn không có quyền chỉnh sửa thành viên này.');
  }

  // 1. Find the father (PARENT_CHILD where target = this member, source = MALE)
  const parentRel = await prisma.relationship.findFirst({
    where: {
      targetMemberId: memberId,
      type: 'PARENT_CHILD',
      sourceMember: { gender: 'MALE' },
    },
    select: { sourceMemberId: true },
  });

  // Fallback: try mother if no father
  const parentId = parentRel?.sourceMemberId
    ?? (await prisma.relationship.findFirst({
      where: { targetMemberId: memberId, type: 'PARENT_CHILD' },
      select: { sourceMemberId: true },
    }))?.sourceMemberId;

  if (!parentId) throw new Error('Không tìm thấy cha/mẹ để xác định thứ tự anh chị em');

  // 2. Get all siblings (children of this parent)
  const siblingRels = await prisma.relationship.findMany({
    where: { sourceMemberId: parentId, type: 'PARENT_CHILD' },
    include: { targetMember: { select: { id: true, birthOrder: true, dateOfBirth: true, createdAt: true } } },
  });

  // Deduplicate + sort by birthOrder
  const seen = new Set<string>();
  const siblings = siblingRels
    .filter(r => {
      if (seen.has(r.targetMemberId)) return false;
      seen.add(r.targetMemberId);
      return true;
    })
    .map(r => r.targetMember)
    .sort((a, b) => {
      const oA = a.birthOrder || 0;
      const oB = b.birthOrder || 0;
      if (oA !== oB) return oA - oB;
      const tA = a.dateOfBirth ? new Date(a.dateOfBirth).getTime() : 0;
      const tB = b.dateOfBirth ? new Date(b.dateOfBirth).getTime() : 0;
      if (tA && tB && tA !== tB) return tA - tB;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  // 3. Find current index
  const currentIndex = siblings.findIndex(s => s.id === memberId);
  if (currentIndex === -1) throw new Error('Không tìm thấy thành viên trong danh sách anh chị em');

  const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= siblings.length) return; // Already at boundary

  const current = siblings[currentIndex];
  const target = siblings[targetIndex];

  // 4. Swap birthOrder atomically
  // Ensure both have valid birthOrder values (1-based)
  const currentOrder = current.birthOrder || (currentIndex + 1);
  const targetOrder = target.birthOrder || (targetIndex + 1);

  await prisma.$transaction([
    prisma.familyMember.update({ where: { id: current.id }, data: { birthOrder: targetOrder } }),
    prisma.familyMember.update({ where: { id: target.id }, data: { birthOrder: currentOrder } }),
  ]);

  revalidatePath('/dashboard/members');
  revalidatePath('/dashboard/tree');
  revalidatePath('/dashboard');
}
