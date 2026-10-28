/**
 * Google Drive integration service for ZenPulse.
 * Handles Firebase Auth with Google OAuth (drive.file scope) and uploads project zip to user's Drive.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut as fbSignOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Initialize auth listener and token lifecycle.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Trigger Google Sign In popup with Google Drive scopes.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Không thể nhận access token từ Google Auth. Vui lòng thử lại.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await fbSignOut(auth);
  cachedAccessToken = null;
};

export interface DriveUploadResult {
  folderId: string;
  folderUrl: string;
  fileId: string;
  fileUrl: string;
  name: string;
}

/**
 * Creates or gets a folder in Google Drive and uploads source zip + README into it.
 */
export const uploadSourceZipToDrive = async (
  onProgress?: (status: string) => void
): Promise<DriveUploadResult> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập Google hoặc phiên làm việc đã hết hạn.');
  }

  onProgress?.('Đang tạo thư mục "ZenPulse-Breathing-App" trên Google Drive...');

  // 1. Create a dedicated folder in Google Drive so it shows up cleanly in user's Drive folder list
  const createFolderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'ZenPulse-Breathing-App',
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Thư mục chứa mã nguồn ứng dụng thiền & thở ZenPulse',
    }),
  });

  if (!createFolderRes.ok) {
    const errText = await createFolderRes.text();
    throw new Error(`Không thể tạo thư mục trên Google Drive: ${errText}`);
  }

  const folderData = await createFolderRes.json();
  const folderId = folderData.id;
  const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;

  // 2. Fetch the source code zip from local public
  onProgress?.('Đang đóng gói tệp mã nguồn...');
  const zipResponse = await fetch('/zenpulse-source-code.zip');
  if (!zipResponse.ok) {
    throw new Error('Không tìm thấy tệp mã nguồn nén trên máy chủ.');
  }
  const zipBlob = await zipResponse.blob();

  // 3. Upload zip inside this new folder
  onProgress?.('Đang tải file zenpulse-source-code.zip vào thư mục...');
  const fileName = 'zenpulse-source-code.zip';
  const metadata = {
    name: fileName,
    mimeType: 'application/zip',
    parents: [folderId],
    description: 'Toàn bộ mã nguồn ZenPulse (React, Vite, Tailwind CSS, Web Audio, Web Haptics)',
  };

  const boundary = '-------zenpulse_boundary_' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const fileHeader = `${delimiter}Content-Type: application/zip\r\n\r\n`;

  const metadataBlob = new Blob([metadataPart], { type: 'text/plain' });
  const fileHeaderBlob = new Blob([fileHeader], { type: 'text/plain' });
  const closeBlob = new Blob([closeDelimiter], { type: 'text/plain' });

  const multipartBody = new Blob([metadataBlob, fileHeaderBlob, zipBlob, closeBlob]);

  const uploadFileRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!uploadFileRes.ok) {
    const errorText = await uploadFileRes.text();
    throw new Error(`Tải tệp zip thất bại: ${errorText}`);
  }

  const fileData = await uploadFileRes.json();

  // 4. Also create a handy README inside the folder for easy viewing
  try {
    const readmeContent = `=== ZENPULSE MOBILE BREATHING APP ===
Mã nguồn ứng dụng luyện thở nhịp điệu & thiền định có rung xúc giác (Haptics) và âm thanh Lo-Fi.

CÁCH CÀI ĐẶT VÀ TRIỂN KHAI:
1. Tải tệp zenpulse-source-code.zip trong thư mục này về máy.
2. Giải nén:
   unzip zenpulse-source-code.zip
3. Mở terminal vào thư mục vừa giải nén:
   npm install
4. Chạy thử nghiệm trên máy:
   npm run dev
5. Đóng gói triển khai lên Vercel / Netlify / VPS cá nhân:
   npm run build
`;

    const readmeBoundary = '-------zenpulse_readme_' + Date.now();
    const readmeMetadata = {
      name: 'HUONG_DAN_CAI_DAT.txt',
      mimeType: 'text/plain',
      parents: [folderId],
    };
    const readmeMetadataPart = `\r\n--${readmeBoundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(readmeMetadata)}\r\n`;
    const readmeFileHeader = `\r\n--${readmeBoundary}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n`;
    const readmeClose = `\r\n--${readmeBoundary}--`;

    const readmeBlob = new Blob([
      new Blob([readmeMetadataPart], { type: 'text/plain' }),
      new Blob([readmeFileHeader], { type: 'text/plain' }),
      new Blob([readmeContent], { type: 'text/plain' }),
      new Blob([readmeClose], { type: 'text/plain' }),
    ]);

    await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${readmeBoundary}`,
      },
      body: readmeBlob,
    });
  } catch (e) {
    console.warn('Could not upload helper readme:', e);
  }

  onProgress?.('Hoàn tất! Thư mục đã có trên Google Drive của bạn.');

  return {
    folderId,
    folderUrl,
    fileId: fileData.id,
    fileUrl: fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`,
    name: fileName,
  };
};
