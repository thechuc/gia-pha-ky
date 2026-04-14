import React, { useState, useRef, useEffect } from "react";
import { 
  X, 
  Upload, 
  Type, 
  AlignLeft,
  FileText,
  Check,
  Loader2,
  Film,
  ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { IconPicker } from "../dashboard/IconPicker";
import { DOC_TYPE_OPTIONS } from "../dashboard/DashboardConstants";
import { FamilyDocument, DocumentFile } from "@/types/family";
import { useToast } from "../ui/Toast";

const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function AddDocumentModal({ isOpen, onClose, onAdd, onUpdate, initialData }: {
  isOpen: boolean; 
  onClose: () => void; 
  onAdd?: (d: FamilyDocument) => void;
  onUpdate?: (id: string, d: Partial<FamilyDocument>) => void;
  initialData?: FamilyDocument;
}) {
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("Bài viết");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState("AlignLeft");
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(prev => prev !== (initialData.title || "") ? (initialData.title || "") : prev);
      setDocType(prev => prev !== (initialData.type || "Bài viết") ? (initialData.type || "Bài viết") : prev);
      const yearStr = initialData.createdAt ? new Date(initialData.createdAt).getFullYear().toString() : new Date().getFullYear().toString();
      setYear(prev => prev !== yearStr ? yearStr : prev);
      setDescription(prev => prev !== (initialData.description || "") ? (initialData.description || "") : prev);
      setIconName(prev => prev !== (initialData.iconName || "AlignLeft") ? (initialData.iconName || "AlignLeft") : prev);
      
      let initialFiles: DocumentFile[] = [];
      try {
        initialFiles = Array.isArray(initialData.files) ? initialData.files : [];
      } catch (e) {
        initialFiles = [];
      }
      setFiles(initialFiles);
    } else {
      setTitle("");
      setDocType("Bài viết");
      setYear(new Date().getFullYear().toString());
      setDescription("");
      setIconName("AlignLeft");
      setFiles([]);
    }
  }, [initialData]);

  const handleFiles = async (newFiles: FileList | null) => {
    if (!newFiles) return;
    
    const processedNewFiles: DocumentFile[] = [];
    for (let i = 0; i < newFiles.length; i++) {
      const f = newFiles[i];
      if (f.size > 1024 * 1024 * 1024) {
        showToast(`Tệp "${f.name}" quá lớn (>1GB).`, "error");
        continue;
      }
      
      let previewUrl = "";
      if (f.size < 2 * 1024 * 1024 && f.type.startsWith('image/')) {
        previewUrl = await readFileAsDataURL(f);
      } else {
        previewUrl = URL.createObjectURL(f);
      }

      processedNewFiles.push({
        url: previewUrl,
        file: f,
        name: f.name,
        size: f.size,
        mimeType: f.type
      } as any);
    }

    setFiles(prev => [...prev, ...processedNewFiles]);
    
    if (!title && processedNewFiles.length > 0) {
      setTitle(processedNewFiles[0].name.split(".")[0]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    
    if (initialData && files.every(f => !f.file)) {
      if (onUpdate) {
        onUpdate(initialData.id, {
          title: title.trim(),
          type: docType,
          year: parseInt(year) || new Date().getFullYear(),
          description: description.trim(),
          iconName,
          files: files,
        });
        onClose();
      }
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setStatusMessage("Đang xin cấp quyền tải lên trực tiếp...");

    try {
      const tokenRes = await fetch('/api/documents/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() })
      });
      const { accessToken, folderId } = await tokenRes.json();
      
      if (!accessToken) throw new Error("Không lấy được quyền truy cập");

      const uploadedResults = [];
      const filesToUpload = files.filter(f => f.file);

      for (let i = 0; i < filesToUpload.length; i++) {
        const fileObj = filesToUpload[i].file!;
        setStatusMessage(`Đang khởi tạo phiên tải lên cho: ${fileObj.name}...`);

        const initMetadata = {
          name: fileObj.name,
          parents: [folderId],
          mimeType: fileObj.type
        };

        const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
          },
          body: JSON.stringify(initMetadata)
        });

        if (!initRes.ok) throw new Error("Lỗi khởi tạo với Google");
        const uploadUrl = initRes.headers.get('Location');
        if (!uploadUrl) throw new Error("Không nhận được địa chỉ tải lên");

        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', uploadUrl, true);
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const filePercent = Math.round((event.loaded / event.total) * 100);
              const totalPercent = Math.round((i / filesToUpload.length) * 100 + (filePercent / filesToUpload.length));
              setUploadProgress(totalPercent);
              setStatusMessage(`Đang đẩy trực tiếp dữ liệu: ${fileObj.name} (${filePercent}%)...`);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const driveFile = JSON.parse(xhr.responseText);
              uploadedResults.push({
                fileId: driveFile.id,
                name: fileObj.name,
                size: fileObj.size,
                mimeType: fileObj.type
              });
              resolve(true);
            } else {
              reject(new Error(`Google API returned ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error("Lỗi kết mạng"));
          xhr.send(fileObj);
        });
      }

      setStatusMessage("Hoàn tất! Đang đồng bộ thông tin vào di sản...");
      const finalizeData = new FormData();
      finalizeData.append("title", title);
      finalizeData.append("type", docType);
      finalizeData.append("description", description);
      finalizeData.append("year", year);
      finalizeData.append("iconName", iconName);
      finalizeData.append("uploadedFiles", JSON.stringify(uploadedResults));
      if (initialData?.id) finalizeData.append("id", initialData.id);

      const saveRes = await fetch('/api/documents/upload', {
        method: 'POST',
        body: finalizeData
      });

      if (saveRes.ok) {
        const result = await saveRes.json();
        if (onAdd) onAdd(result);
        setUploadProgress(100);
        setStatusMessage("Hoàn tất! Tài liệu của bạn đã được lưu.");
        showToast("Đã khai báo di sản thành công", "success");
        setFiles([]);
        
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        throw new Error("Không thể lưu thông tin vào DB");
      }

    } catch (error: any) {
      console.error("Lỗi upload tối ưu:", error);
      showToast(error.message || "Không thể tải lên tài liệu", "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1A0F0F]/95 backdrop-blur-2xl rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] w-[600px] max-w-full max-h-[92vh] overflow-hidden flex flex-col border border-white/10 animate-fade-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-[#140C0C]/95 backdrop-blur-md sticky top-0 z-20 text-secondary">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary shadow-lg">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-secondary text-xl tracking-wide">
                {initialData ? 'Chỉnh Sửa Di Sản' : 'Đăng Tài Liệu'}
              </h3>
              <p className="text-[10px] font-bold text-secondary/40 uppercase tracking-[0.2em]">Thêm bài viết hoặc hồ sơ di sản</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-secondary/30 hover:text-secondary transition-all outline-none">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form id="doc-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-secondary/60 uppercase tracking-[0.2em] ml-1">Tiêu đề *</label>
              <div className="relative group">
                <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/30 group-focus-within:text-secondary transition-colors" />
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="VD: Câu chuyện về Cụ tổ đời thứ 3..." 
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-white/10 bg-white/5 text-secondary placeholder:text-secondary/20 text-sm focus:outline-none focus:border-secondary/50 focus:ring-4 focus:ring-secondary/5 transition-all outline-none" 
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-secondary/60 uppercase tracking-[0.2em] ml-1">Loại tài liệu</label>
                <div className="relative group">
                  <select 
                    value={docType} 
                    onChange={(e) => setDocType(e.target.value)} 
                    className="w-full px-4 py-4 rounded-2xl border border-white/10 bg-white/5 text-secondary text-sm focus:outline-none focus:border-secondary/50 focus:ring-4 focus:ring-secondary/5 transition-all outline-none appearance-none cursor-pointer"
                  >
                    {DOC_TYPE_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value} className="bg-[#1A0F0F] text-secondary">{opt.value}</option>))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-secondary/60 uppercase tracking-[0.2em] ml-1">Năm liên quan</label>
                <input 
                  type="number" 
                  value={year} 
                  onChange={(e) => setYear(e.target.value)} 
                  min="1000" 
                  max="2100" 
                  className="w-full px-4 py-4 rounded-2xl border border-white/10 bg-white/5 text-secondary text-sm focus:outline-none focus:border-secondary/50 focus:ring-4 focus:ring-secondary/5 transition-all outline-none" 
                />
              </div>
            </div>

            <IconPicker selected={iconName} onSelect={setIconName} label="Biểu tượng" />

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-secondary/60 uppercase tracking-[0.2em] ml-1">Nội dung / Mô tả *</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Viết nội dung bài viết hoặc mô tả chi tiết về tài liệu di sản này..." 
                rows={5} 
                className="w-full px-4 py-4 rounded-2xl border border-white/10 bg-white/5 text-secondary placeholder:text-secondary/20 text-sm focus:outline-none focus:border-secondary/50 focus:ring-4 focus:ring-secondary/5 transition-all outline-none resize-none italic leading-relaxed" 
                required 
              />
            </div>

            <div className="space-y-3">
               <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                 <Upload className="w-3.5 h-3.5" /> Tệp tin đính kèm
               </label>
               {/* Upload Zone - Corrected & Design Sync */}
               <div className="relative w-full group/upload">
                 <input 
                   type="file" 
                   ref={fileInputRef}
                   multiple 
                   accept="image/*,video/*,.pdf,.doc,.docx" 
                   onChange={(e) => handleFiles(e.target.files)} 
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                 />
                 <div 
                   onDragOver={onDragOver}
                   onDrop={onDrop}
                   className="w-full px-6 py-10 rounded-[32px] border-2 border-dashed border-white/5 text-center bg-white/[0.02] group-hover/upload:border-secondary/30 group-hover/upload:bg-white/5 transition-all flex flex-col items-center justify-center pointer-events-none"
                 >
                   <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center mb-4 group-hover/upload:scale-110 transition-transform duration-500 shadow-inner border border-secondary/20">
                     <Upload className="w-6 h-6 text-secondary/60" />
                   </div>
                   <p className="text-xs font-bold text-secondary mb-1">
                     Click hoặc kéo thả để số hóa tài liệu
                   </p>
                   <p className="text-[9px] text-secondary/20 uppercase tracking-[0.2em] font-medium">ẢNH, VIDEO, PDF, DOCX (MAX 1GB/FILE)</p>
                 </div>
               </div>
            </div>

            {/* Files List - Modern Auto-Grid with Preview */}
            {files.length > 0 && (
              <div className="space-y-4 pt-2">
                <label className="text-[10px] font-bold text-secondary/40 uppercase tracking-[0.2em] ml-1">
                  Danh sách tệp tin ({files.length})
                </label>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
                  {files.map((file, idx) => {
                    const isImage = file.mimeType?.startsWith('image/') || file.file?.type.startsWith('image/');
                    const isVideo = file.mimeType?.startsWith('video/') || file.file?.type.startsWith('video/');
                    const isPdf = file.name?.toLowerCase().endsWith('.pdf') || file.mimeType?.includes('pdf') || file.file?.type.includes('pdf');
                    
                    return (
                      <div 
                        key={idx} 
                        className="group/file relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-[#0F0A0A] hover:border-secondary/30 transition-all shadow-lg"
                      >
                        {/* Preview Area */}
                        <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                          {isImage && file.url ? (
                            <img 
                              src={file.url} 
                              alt={file.name} 
                              className="w-full h-full object-cover group-hover/file:scale-110 transition-transform duration-500" 
                            />
                          ) : isVideo ? (
                            <div className="flex flex-col items-center justify-center text-secondary/60 bg-secondary/5 w-full h-full">
                              <Film className="w-8 h-8 text-amber-500 mb-1 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
                              <span className="text-[8px] font-black text-amber-500/80 uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded-md">VIDEO</span>
                            </div>
                          ) : isPdf ? (
                            <div className="flex flex-col items-center justify-center text-secondary/60 bg-secondary/5 w-full h-full">
                              <FileText className="w-8 h-8 text-rose-500 mb-1 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]" />
                              <span className="text-[8px] font-black text-rose-500/80 uppercase tracking-widest bg-rose-500/10 px-1.5 py-0.5 rounded-md">PDF</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-secondary/60 bg-secondary/5 w-full h-full">
                              <FileText className="w-8 h-8 text-secondary/40 mb-1" />
                              <span className="text-[8px] font-black text-secondary/30 uppercase tracking-widest">FILE</span>
                            </div>
                          )}
                          
                          {/* Remove Button Overlay */}
                          <button 
                            type="button" 
                            onClick={() => removeFile(idx)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-500/80 text-white opacity-0 group-hover/file:opacity-100 transition-all hover:bg-rose-500 z-10 shadow-lg flex items-center justify-center"
                            title="Xóa tệp"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {/* Info Overlay at Bottom */}
                          <div className="absolute inset-x-0 bottom-0 p-1.5 bg-black/60 backdrop-blur-md opacity-0 group-hover/file:opacity-100 transition-opacity pointer-events-none">
                            <p className="text-[7px] font-bold text-white truncate w-full px-1" title={file.name}>
                              {file.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-[#140C0C]/80 backdrop-blur-xl sticky bottom-0 z-10 flex flex-col gap-6">
          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isUploading}
              className="flex-1 py-4 rounded-2xl border border-white/10 text-secondary/40 font-black text-[10px] uppercase tracking-widest hover:bg-white/5 hover:text-secondary transition-all disabled:opacity-20"
            >
              Hủy bỏ
            </button>
            <button 
              form="doc-form" 
              type="submit" 
              disabled={!title.trim() || !description.trim() || isUploading} 
              className="flex-1 py-4 rounded-2xl bg-secondary text-primary font-black text-[10px] uppercase tracking-widest hover:brightness-110 hover:shadow-[0_10px_30px_rgba(212,175,55,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
              )}
              {isUploading ? 'Đang xử lý...' : (initialData ? 'Lưu cập nhật' : 'Khai báo di sản')}
            </button>
          </div>
        </div>

        {/* Upload Progress Overlay */}
        <AnimatePresence>
          {isUploading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[110] flex flex-col items-center justify-center p-12 bg-[#140C0C]/85 backdrop-blur-xl"
            >
              <div className="w-full max-w-sm space-y-8 text-center">
                <div className="relative mx-auto w-24 h-24">
                  <div className="absolute inset-0 border-4 border-secondary/10 rounded-full" />
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-4 border-t-secondary border-r-transparent border-b-transparent border-l-transparent rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-secondary font-serif">{uploadProgress}%</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xl font-serif font-bold text-secondary tracking-tight">
                    {uploadProgress < 100 ? "Đang số hóa di sản..." : "Đang hoàn tất..."}
                  </h4>
                  <p className="text-[10px] font-bold text-secondary/60 uppercase tracking-widest leading-relaxed h-8 px-4">
                    {statusMessage}
                  </p>
                </div>

                <div className="relative w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-secondary/40 via-secondary to-secondary shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                  />
                </div>

                <div className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-secondary/30">
                  <Check className={`w-3 h-3 transition-colors ${uploadProgress === 100 ? 'text-secondary' : ''}`} />
                  Di sản Số • Bảo mật • Vĩnh cửu
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
