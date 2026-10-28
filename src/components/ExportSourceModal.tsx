import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FolderArchive,
  Terminal,
  LogOut,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  uploadSourceZipToDrive,
  DriveUploadResult,
  getAccessToken,
} from '../services/googleDrive';

interface ExportSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportSourceModal: React.FC<ExportSourceModalProps> = ({ isOpen, onClose }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<DriveUploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [directDownloadStatus, setDirectDownloadStatus] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
        setErrorMessage(null);
      },
      () => {
        setCurrentUser(null);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setCurrentUser(res.user);
        setTimeout(() => {
          handleUploadToDrive();
        }, 200);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message || 'Đăng nhập Google thất bại. Vui lòng cho phép mở cửa sổ popup trên trình duyệt.'
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setCurrentUser(null);
      setUploadResult(null);
      setUploadStatus('');
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleUploadToDrive = async () => {
    setIsUploading(true);
    setErrorMessage(null);
    setUploadResult(null);
    try {
      const result = await uploadSourceZipToDrive((status) => {
        setUploadStatus(status);
      });
      setUploadResult(result);
    } catch (err: any) {
      console.error('Upload Error:', err);
      setErrorMessage(
        err.message || 'Không thể tải tệp lên Google Drive. Vui lòng kiểm tra quyền truy cập.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDirectBlobDownload = async () => {
    try {
      setDirectDownloadStatus('Đang lấy dữ liệu zip...');
      const response = await fetch('/zenpulse-source-code.zip');
      if (!response.ok) throw new Error('Không thể tải tệp zip.');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'zenpulse-breathing-source.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      setDirectDownloadStatus('Đã gửi yêu cầu tải xuống trình duyệt!');
      setTimeout(() => setDirectDownloadStatus(''), 4000);
    } catch (e: any) {
      setDirectDownloadStatus('Tải trực tiếp thất bại, hãy dùng Google Drive ở trên');
    }
  };

  const deployCommand = `unzip zenpulse-source-code.zip
cd zenpulse-breathing-source
npm install
npm run dev`;

  const copyDeployScript = () => {
    navigator.clipboard.writeText(deployCommand);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Nhận Mã Nguồn (Source Code)</h2>
              <p className="text-xs text-slate-400">Tự do lưu trữ và triển khai riêng tư</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-6">
          {/* Section 1: Google Drive Direct Export */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-4">
            <div className="flex items-center gap-2.5 text-cyan-400 font-semibold text-sm">
              <Cloud className="w-4 h-4 text-cyan-400" />
              <span>Phương án 1: Lưu trực tiếp vào Google Drive (Khuyên dùng)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Do môi trường web sandbox có thể chặn tải file trực tiếp, giải pháp tốt nhất là lưu tệp mã nguồn nén (<code className="text-cyan-300 font-mono text-[11px]">.zip</code>) thẳng vào Google Drive của bạn.
            </p>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {!currentUser ? (
              <div className="pt-2 flex flex-col items-center sm:items-start gap-3">
                <button
                  onClick={handleSignIn}
                  disabled={isAuthenticating}
                  className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white text-slate-800 hover:bg-slate-100 font-medium text-xs shadow-md transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>
                    {isAuthenticating ? 'Đang kết nối Google...' : 'Đăng nhập Google để lưu vào Drive'}
                  </span>
                </button>
                <span className="text-[11px] text-slate-400">
                  Chỉ yêu cầu quyền lưu tệp do app tạo (<code className="text-slate-300">drive.file</code>)
                </span>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {/* User info */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2.5 truncate">
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt="Avatar"
                        className="w-7 h-7 rounded-full border border-slate-700 object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-cyan-900/60 text-cyan-300 flex items-center justify-center font-bold text-xs">
                        {currentUser.displayName?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="truncate">
                      <div className="font-semibold text-slate-200 truncate">
                        {currentUser.displayName || 'Google User'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {currentUser.email}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Upload action button */}
                {!uploadResult ? (
                  <button
                    onClick={handleUploadToDrive}
                    disabled={isUploading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>{uploadStatus || 'Đang tạo thư mục và tải lên Google Drive...'}</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-4 h-4" />
                        <span>Bấm để tạo thư mục & đẩy mã nguồn lên Drive</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 space-y-3">
                    <div className="flex items-center gap-2 font-semibold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Đã tạo thư mục "ZenPulse-Breathing-App" trên Google Drive!</span>
                    </div>
                    <p className="text-[11px] text-emerald-300">
                      Đã đẩy: <span className="font-mono">{uploadResult.name}</span> và hướng dẫn cài đặt.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <a
                        href={uploadResult.folderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors shadow-sm"
                      >
                        <span>Mở thư mục trên Google Drive</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={uploadResult.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-500/60 text-emerald-300 font-semibold text-xs hover:bg-emerald-900 transition-colors"
                      >
                        <span>Tải tệp zip từ Drive</span>
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Direct Blob Download */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Phương án 2: Thử tải trực tiếp về máy</span>
            </div>
            <p className="text-xs text-slate-300">
              Nếu trình duyệt của bạn cho phép tải file từ iframe:
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={handleDirectBlobDownload}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors border border-slate-700 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tải tệp zenpulse-source-code.zip</span>
              </button>
            </div>
            {directDownloadStatus && (
              <p className="text-[11px] text-cyan-400">{directDownloadStatus}</p>
            )}
          </div>

          {/* Section 3: Deploy & Run Instructions */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>Hướng dẫn tự chạy và deploy</span>
              </div>
              <button
                onClick={copyDeployScript}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors border border-slate-700"
              >
                {copiedCommand ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Sao chép lệnh</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-3 rounded-xl bg-black/80 font-mono text-[11px] text-slate-300 border border-slate-800 overflow-x-auto space-y-1">
              <p className="text-slate-500"># 1. Giải nén tệp zip</p>
              <p className="text-emerald-400">$ unzip zenpulse-source-code.zip</p>
              <p className="text-slate-500"># 2. Cài đặt các thư viện cần thiết</p>
              <p className="text-emerald-400">$ npm install</p>
              <p className="text-slate-500"># 3. Chạy ở chế độ phát triển (port 3000)</p>
              <p className="text-emerald-400">$ npm run dev</p>
              <p className="text-slate-500"># 4. Đóng gói để đưa lên Vercel / Netlify / Cloudflare</p>
              <p className="text-emerald-400">$ npm run build</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
