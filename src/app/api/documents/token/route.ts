import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, createFolder } from '@/lib/googleDrive';
import { normalizeDriveFolderName } from '@/utils/stringUtils';

export async function GET() {
  try {
    const token = await getAccessToken();
    return NextResponse.json({ 
      accessToken: token, 
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID 
    });
  } catch (error: any) {
    console.error('Error getting Drive access token:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json();
    const token = await getAccessToken();
    
    let targetFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (title) {
      const normalizedName = normalizeDriveFolderName(title);
      console.log(`[Drive API] Creating dynamic folder: ${normalizedName}`);
      const newFolderId = await createFolder(normalizedName);
      if (newFolderId) {
        targetFolderId = newFolderId;
      }
    }

    return NextResponse.json({ 
      accessToken: token, 
      folderId: targetFolderId 
    });
  } catch (error: any) {
    console.error('Error creating dynamic folder and token:', error);
    return NextResponse.json({ 
      error: 'Failed to provision folder',
      details: error.message 
    }, { status: 500 });
  }
}
