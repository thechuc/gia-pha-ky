'use server';

import prisma from '@/lib/db';

export async function getBranchesForRegister() {
  try {
    const firstFamily = await prisma.family.findFirst();
    if (!firstFamily) return [];

    return await prisma.branch.findMany({
      where: { familyId: firstFamily.id },
      select: { id: true, name: true },
      orderBy: { order: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching branches for register:', error);
    return [];
  }
}
