import { NextRequest, NextResponse } from 'next/server';
import { getFileStream } from '@/lib/googleDrive';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    
    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
    }

    const { stream, mimeType, size } = await getFileStream(fileId);

    // Sử dụng Response với ReadableStream để đẩy dữ liệu về Client
    return new Response(stream as any, {
      headers: {
        'Content-Type': mimeType || 'video/mp4',
        'Content-Length': size || '',
        'Accept-Ranges': 'bytes', // Quan trọng để hỗ trợ tua (seek) video
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('[Stream API Error]:', error);
    return NextResponse.json({ error: 'Failed to stream file' }, { status: 500 });
  }
}
