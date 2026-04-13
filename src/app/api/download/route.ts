import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    let fileData, fileName, contentType;

    const contentTypeHeader = request.headers.get('content-type') || '';
    
    if (contentTypeHeader.includes('application/json')) {
      const body = await request.json();
      fileData = body.fileData;
      fileName = body.fileName;
      contentType = body.contentType;
    } else {
      const formData = await request.formData();
      fileData = formData.get('fileData') as string;
      fileName = formData.get('fileName') as string;
      contentType = formData.get('contentType') as string;
    }

    if (!fileData || !fileName || !contentType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const base64Content = fileData.split(',')[1] || fileData;
    const buffer = Buffer.from(base64Content, 'base64');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Download Proxy Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
