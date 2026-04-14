'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { canEditDocuments } from '@/utils/permissions';
import { uploadToDrive, deleteFromDrive } from '@/lib/googleDrive';

export interface DocumentFile {
  id?: string; // Google Drive File ID
  url: string; // Google Drive WebViewLink
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

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/x-matroska': 'mkv'
};

export async function addDocument(data: DocumentFormData) {
  if (!await canEditDocuments()) {
    throw new Error('Bạn không có quyền thêm tài liệu.');
  }

  console.log(`[addDocument] Received request: ${data.name}, type: ${data.type}, file count: ${data.files?.length}`);

  // Validate all files before processing
  for (const file of data.files) {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File ${file.name} quá lớn (tối đa 15MB).`);
    }
  }

  const family = await prisma.family.findFirst();
  if (!family) throw new Error('Family not found');

  const processedFiles: DocumentFile[] = [];

  for (const fileData of data.files) {
    // Trường hợp 1: Nhận trực tiếp đối tượng File (Next.js Server Actions hỗ trợ File object)
    const rawFile = (fileData as any).file; 
    
    if (rawFile && typeof rawFile.arrayBuffer === 'function') {
      try {
        console.log(`[addDocument] Processing binary file: ${fileData.name}`);
        // Chuyển đổi Web stream sang Node.js stream
        const nodeStream = Readable.fromWeb(rawFile.stream() as any);
        
        const driveResult = await uploadToDrive(
          nodeStream,
          fileData.name,
          fileData.mimeType
        );

        processedFiles.push({
          id: driveResult.id!,
          url: driveResult.webViewLink!,
          name: fileData.name,
          mimeType: fileData.mimeType,
          size: fileData.size
        });
      } catch (error) {
        console.error(`[addDocument] Error streaming file ${fileData.name} to Drive:`, error);
      }
    } 
    // Trường hợp 2: Nhận chuỗi base64 (cho tệp nhỏ hoặc tương thích cũ)
    else if (fileData.url && fileData.url.startsWith('data:')) {
      try {
        console.log(`[addDocument] Processing base64 file: ${fileData.name}`);
        const base64Data = fileData.url.split(';base64,').pop();
        if (!base64Data) throw new Error('Invalid base64 data');

        const buffer = Buffer.from(base64Data, 'base64');
        
        const driveResult = await uploadToDrive(
          buffer,
          fileData.name,
          fileData.mimeType
        );

        processedFiles.push({
          id: driveResult.id!,
          url: driveResult.webViewLink!,
          name: fileData.name,
          mimeType: fileData.mimeType,
          size: fileData.size
        });
      } catch (error) {
        console.error(`[addDocument] Error saving base64 file to Drive:`, error);
      }
    } else {
      processedFiles.push(fileData);
    }
  }

  if (processedFiles.length === 0) {
    console.warn('[addDocument] No files were successfully processed');
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
      uploadedBy: 'Hệ thống (Drive)',
    } as any,
  });

  revalidatePath('/dashboard/documents');
  return document;
}

export async function updateDocument(id: string, data: Partial<DocumentFormData>) {
  if (!await canEditDocuments()) {
    throw new Error('Bạn không có quyền chỉnh sửa tài liệu.');
  }
  const family = await prisma.family.findFirst();
  if (!family) throw new Error('Family not found');

  const oldDoc = await prisma.document.findUnique({ where: { id } }) as any;
  if (!oldDoc) throw new Error('Document not found');

  let oldFiles: DocumentFile[] = [];
  try {
    oldFiles = typeof oldDoc.files === 'string' 
      ? JSON.parse(oldDoc.files) 
      : (oldDoc.files as DocumentFile[]) || [];
  } catch (e) {
    oldFiles = [];
  }

  const processedFiles: DocumentFile[] = [];
  const currentUrls = new Set((data.files || []).map(f => f.url));

  // Identify files to delete from Drive
  for (const oldFile of oldFiles) {
    if (!currentUrls.has(oldFile.url) && oldFile.id) {
      try {
        await deleteFromDrive(oldFile.id);
      } catch (err) {
        console.error(`Error deleting file ${oldFile.id} from Drive:`, err);
      }
    }
  }

  if (data.files) {
    for (const fileData of data.files) {
      // Trường hợp 1: Nhận trực tiếp đối tượng File
      const rawFile = (fileData as any).file; 
      
      if (rawFile && typeof rawFile.arrayBuffer === 'function') {
        try {
          const nodeStream = Readable.fromWeb(rawFile.stream() as any);
          const driveResult = await uploadToDrive(
            nodeStream,
            fileData.name,
            fileData.mimeType
          );

          processedFiles.push({
            id: driveResult.id!,
            url: driveResult.webViewLink!,
            name: fileData.name,
            mimeType: fileData.mimeType,
            size: fileData.size
          });
        } catch (error) {
          console.error('Error streaming update file to Drive:', error);
        }
      } 
      // Trường hợp 2: Base64
      else if (fileData.url && fileData.url.startsWith('data:')) {
        try {
          const base64Data = fileData.url.split(';base64,').pop();
          if (!base64Data) throw new Error('Invalid base64 data');

          const buffer = Buffer.from(base64Data, 'base64');
          
          const driveResult = await uploadToDrive(
            buffer,
            fileData.name,
            fileData.mimeType
          );

          processedFiles.push({
            id: driveResult.id!,
            url: driveResult.webViewLink!,
            name: fileData.name,
            mimeType: fileData.mimeType,
            size: fileData.size
          });
        } catch (error) {
          console.error('Error saving base64 update file to Drive:', error);
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
  if (!await canEditDocuments()) {
    throw new Error('Bạn không có quyền xóa tài liệu.');
  }
  const doc = await prisma.document.findUnique({
    where: { id }
  }) as any;

  if (doc) {
    let files: DocumentFile[] = [];
    try {
      files = typeof doc.files === 'string' 
        ? JSON.parse(doc.files) 
        : (doc.files as DocumentFile[]) || [];
    } catch (e) {
      files = [];
    }

    for (const fileInfo of files) {
      if (fileInfo.id) {
        try {
          await deleteFromDrive(fileInfo.id);
        } catch (error) {
          console.error('Error deleting file from Drive:', error);
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
