import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { setFilePublic } from '@/lib/googleDrive';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const description = formData.get('description') as string;
    const year = formData.get('year') as string;
    const iconName = formData.get('iconName') as string;
    const memberIdRaw = formData.get('memberId') as string;
    const memberId = (memberIdRaw && memberIdRaw !== 'undefined' && memberIdRaw !== '') ? memberIdRaw : null;
    
    // Client gửi danh sách tệp đã upload thành công lên Drive (chứa fileId)
    const uploadedFilesRaw = formData.get('uploadedFiles') as string;
    const uploadedFiles = JSON.parse(uploadedFilesRaw || '[]');

    if (!title || uploadedFiles.length === 0) {
      return NextResponse.json({ error: 'Thiếu thông tin hoặc tệp tin' }, { status: 400 });
    }

    const family = await prisma.family.findFirst();
    if (!family) {
      return NextResponse.json({ error: 'Family project not found' }, { status: 404 });
    }

    const processedFiles = [];

    for (const fileInfo of uploadedFiles) {
      console.log(`[API Finalize] Finalizing file: ${fileInfo.name} (Drive ID: ${fileInfo.fileId})`);
      
      // 1. Cấp quyền xem công khai và lấy link webView
      const webViewLink = await setFilePublic(fileInfo.fileId);

      processedFiles.push({
        id: fileInfo.fileId,
        url: `/api/documents/stream/${fileInfo.fileId}`,
        name: fileInfo.name,
        mimeType: fileInfo.mimeType,
        size: fileInfo.size
      });
    }

    // Tạo bản ghi trong cơ sở dữ liệu
    const document = await prisma.document.create({
      data: {
        familyId: family.id,
        memberId: memberId || null,
        name: title,
        type: type,
        description: description || null,
        url: processedFiles[0]?.url || "", 
        mimeType: processedFiles[0]?.mimeType || "",
        size: processedFiles[0]?.size || 0,
        files: JSON.stringify(processedFiles),
        uploadedBy: 'Hệ thống (Direct Upload)',
        year: parseInt(year) || new Date().getFullYear(),
        iconName: iconName || "FileText",
      } as any,
    });

    return NextResponse.json(document);
  } catch (error: any) {
    console.error('[API Upload Error]:', error);
    return NextResponse.json({ error: error.message || 'Lỗi xử lý tải lên' }, { status: 500 });
  }
}
