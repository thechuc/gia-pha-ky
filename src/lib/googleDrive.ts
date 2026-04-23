import { google } from 'googleapis';
import { Readable } from 'stream';

const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !FOLDER_ID) {
  console.warn('Google Drive OAuth credentials are not fully configured in .env');
}

// Chuyển sang sử dụng OAuth2 Client để mượn danh nghĩa tài khoản chính chủ (5 TB)
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
  refresh_token: REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

/**
 * Lấy Access Token tạm thời để cấp cho Client upload trực tiếp
 */
export async function getAccessToken() {
  const { token } = await oauth2Client.getAccessToken();
  return token;
}

/**
 * Thiết lập quyền xem công khai cho file
 */
export async function setFilePublic(fileId: string) {
  await drive.permissions.create({
    fileId: fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });
  
  const res = await drive.files.get({
    fileId: fileId,
    fields: 'webViewLink',
  });
  
  return res.data.webViewLink;
}

/**
 * Lấy luồng dữ liệu (Stream) của file từ Drive để phát video
 */
export async function getFileStream(fileId: string) {
  const response = await drive.files.get(
    { fileId: fileId, alt: 'media' },
    { responseType: 'stream' }
  );
  return {
    stream: response.data as any as Readable,
    mimeType: response.headers['content-type'],
    size: response.headers['content-length']
  };
}

/**
 * Uploads a file to a specific folder on Google Drive
 * @param buffer File content
 * @param fileName Name of the file on Drive
 * @param mimeType MIME type of the file
 * @returns { id, webViewLink }
 */
export async function uploadToDrive(
  fileData: Buffer | Readable | any,
  fileName: string,
  mimeType: string
) {
  try {
    const fileMetadata = {
      name: fileName,
      parents: [FOLDER_ID!],
    };

    const media = {
      mimeType: mimeType,
      body: fileData instanceof Buffer ? Readable.from(fileData) : fileData,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    const fileId = response.data.id;

    // Thiết lập quyền xem cho bất kỳ ai có link (để hiển thị trên Web)
    if (fileId) {
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    }

    return {
      id: fileId,
      webViewLink: response.data.webViewLink,
      directLink: `https://lh3.googleusercontent.com/d/${fileId}`,
    };
  } catch (error: any) {
    console.error('Error uploading to Google Drive via OAuth:', error);
    
    // Phát hiện lỗi token hết hạn → thông báo rõ ràng cho admin
    const errorMsg = error?.message || '';
    if (errorMsg.includes('invalid_grant') || errorMsg.includes('Token has been expired or revoked')) {
      throw new Error('Google Drive token đã hết hạn. Vui lòng truy cập OAuth Playground để tạo Refresh Token mới và cập nhật vào .env (GOOGLE_DRIVE_REFRESH_TOKEN).');
    }
    
    throw new Error('Lỗi upload ảnh lên Google Drive. Vui lòng thử lại.');
  }
}

/**
 * Tạo thư mục mới trên Google Drive
 * @param folderName Tên thư mục
 * @param parentId ID thư mục cha (mặc định là FOLDER_ID từ .env)
 */
export async function createFolder(folderName: string, parentId?: string) {
  try {
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId || FOLDER_ID!],
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });

    const folderId = response.data.id;
    
    // Cấp quyền xem cho folder để các file bên trong kế thừa quyền (nếu cần)
    if (folderId) {
      await drive.permissions.create({
        fileId: folderId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    }

    return folderId;
  } catch (error) {
    console.error('Error creating folder on Google Drive:', error);
    throw new Error('Failed to create folder on Google Drive');
  }
}

/**
 * Deletes a file from Google Drive
 * @param fileId ID of the file to delete
 */
export async function deleteFromDrive(fileId: string) {
  try {
    await drive.files.delete({
      fileId: fileId,
    });
    return { success: true };
  } catch (error: any) {
    // If file already deleted or not found, consider it a success
    if (error.code === 404) return { success: true };
    
    console.error('Error deleting from Google Drive via OAuth:', error);
    throw new Error('Failed to delete file from Google Drive');
  }
}
