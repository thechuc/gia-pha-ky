'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface DocumentFile {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface DocumentFormData {
  name: string;
  type: string;
  description?: string;
  files: DocumentFile[];
  memberId?: string;
}

export async function getDocuments() {
  const family = await prisma.family.findFirst();
  if (!family) return [];

  return prisma.document.findMany({
    where: { familyId: family.id },
    include: {
      member: {
        select: {
          id: true,
          fullName: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function addDocument(data: DocumentFormData) {
  const family = await prisma.family.findFirst();
  if (!family) throw new Error('Family not found');

  const processedFiles: DocumentFile[] = [];

  for (const fileData of data.files) {
    if (fileData.url.startsWith('data:')) {
      try {
        const base64Data = fileData.url.split(';base64,').pop();
        if (!base64Data) throw new Error('Invalid base64 data');

        const buffer = Buffer.from(base64Data, 'base64');
        const mimeMap: Record<string, string> = {
          'application/pdf': 'pdf',
          'application/msword': 'doc',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
          'application/vnd.ms-excel': 'xls',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
          'image/jpeg': 'jpg',
          'image/png': 'png',
          'image/webp': 'webp',
          'image/gif': 'gif'
        };

        const extension = mimeMap[fileData.mimeType] || fileData.mimeType.split('/').pop() || 'dat';
        const safeFileName = `${Date.now()}-${crypto.randomUUID().substring(0, 8)}.${extension}`;
        const relativePath = `/uploads/documents/${safeFileName}`;
        const absolutePath = path.join(process.cwd(), 'public', 'uploads', 'documents', safeFileName);

        await fs.writeFile(absolutePath, buffer);
        processedFiles.push({
          url: relativePath,
          name: fileData.name,
          mimeType: fileData.mimeType,
          size: fileData.size
        });
      } catch (error) {
        console.error('Error saving file to FS:', error);
      }
    } else {
      processedFiles.push(fileData);
    }
  }

  const document = await prisma.document.create({
    data: {
      familyId: family.id,
      memberId: data.memberId || null,
      name: data.name,
      type: data.type,
      description: data.description || null,
      url: processedFiles[0]?.url || "", 
      mimeType: processedFiles[0]?.mimeType || "",
      size: processedFiles[0]?.size || 0,
      files: JSON.stringify(processedFiles),
      uploadedBy: 'Hệ thống',
    } as any,
  });

  revalidatePath('/dashboard/documents');
  return document;
}

export async function updateDocument(id: string, data: Partial<DocumentFormData>) {
  const family = await prisma.family.findFirst();
  if (!family) throw new Error('Family not found');

  const oldDoc = await prisma.document.findUnique({ where: { id } }) as any;
  if (!oldDoc) throw new Error('Document not found');

  let oldFiles: DocumentFile[] = [];
  try {
    oldFiles = typeof oldDoc.files === 'string' 
      ? JSON.parse(oldDoc.files) 
      : (oldDoc.files as DocumentFile[]) || [];
    
    if (oldFiles.length === 0 && oldDoc.url) {
      oldFiles = [{
        url: oldDoc.url,
        name: oldDoc.name,
        mimeType: oldDoc.mimeType || 'application/octet-stream',
        size: oldDoc.size || 0
      }];
    }
  } catch (e) {
    if (oldDoc.url) {
      oldFiles = [{
        url: oldDoc.url,
        name: oldDoc.name,
        mimeType: oldDoc.mimeType || 'application/octet-stream',
        size: oldDoc.size || 0
      }];
    }
  }

  const processedFiles: DocumentFile[] = [];
  const currentUrls = new Set((data.files || []).map(f => f.url));

  for (const oldFile of oldFiles) {
    if (!currentUrls.has(oldFile.url) && oldFile.url.startsWith('/uploads/')) {
      try {
        const absolutePath = path.join(process.cwd(), 'public', oldFile.url);
        await fs.unlink(absolutePath);
      } catch (err) {
        console.error(`Error deleting orphaned file ${oldFile.url}:`, err);
      }
    }
  }

  if (data.files) {
    for (const fileData of data.files) {
      if (fileData.url.startsWith('data:')) {
        try {
          const base64Data = fileData.url.split(';base64,').pop();
          if (!base64Data) throw new Error('Invalid base64 data');

          const buffer = Buffer.from(base64Data, 'base64');
          const safeFileName = `${Date.now()}-${crypto.randomUUID().substring(0, 8)}.${fileData.mimeType.split('/').pop() || 'dat'}`;
          const relativePath = `/uploads/documents/${safeFileName}`;
          const absolutePath = path.join(process.cwd(), 'public', 'uploads', 'documents', safeFileName);

          await fs.writeFile(absolutePath, buffer);
          processedFiles.push({
            url: relativePath,
            name: fileData.name,
            mimeType: fileData.mimeType,
            size: fileData.size
          });
        } catch (error) {
          console.error('Error saving dynamic file:', error);
        }
      } else {
        processedFiles.push(fileData);
      }
    }
  }

  const updateData: any = {
    name: data.name,
    type: data.type,
    description: data.description,
    memberId: data.memberId === undefined ? undefined : (data.memberId || null),
  };

  if (data.files) {
    updateData.files = JSON.stringify(processedFiles);
    updateData.url = processedFiles[0]?.url || "";
    updateData.mimeType = processedFiles[0]?.mimeType || "";
    updateData.size = processedFiles[0]?.size || 0;
  }

  const document = await prisma.document.update({
    where: { id },
    data: updateData,
  });

  revalidatePath('/dashboard/documents');
  return document;
}

export async function deleteDocument(id: string) {
  const doc = await prisma.document.findUnique({
    where: { id }
  }) as any;

  if (doc) {
    let files: DocumentFile[] = [];
    try {
      files = typeof doc.files === 'string' 
        ? JSON.parse(doc.files) 
        : (doc.files as DocumentFile[]) || [];
      
      if (files.length === 0 && doc.url) {
        files = [{ url: doc.url, name: doc.name, mimeType: doc.mimeType || '', size: doc.size || 0 }];
      }
    } catch (e) {
      if (doc.url) files = [{ url: doc.url, name: doc.name, mimeType: doc.mimeType || '', size: doc.size || 0 }];
    }

    for (const fileInfo of files) {
      if (fileInfo.url.startsWith('/uploads/')) {
        try {
          const absolutePath = path.join(process.cwd(), 'public', fileInfo.url);
          await fs.unlink(absolutePath);
        } catch (error) {
          console.error('Error deleting file from FS:', error);
        }
      }
    }
  }

  await prisma.document.delete({
    where: { id },
  });

  revalidatePath('/dashboard/documents');
  return { success: true };
}
