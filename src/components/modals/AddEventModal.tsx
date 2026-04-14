import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  CalendarDays, 
  Type, 
  Upload, 
  Plus, 
  Image as ImageIcon,
  Check,
  Film,
  FileText,
  Trash2,
  ChevronDown,
  Save,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { IconPicker } from "../dashboard/IconPicker";
import { EVENT_TYPE_OPTIONS } from "../dashboard/DashboardConstants";
import { FamilyEvent } from "@/types/family";
import { useToast } from "../ui/Toast";

interface FileWithPreview {
  file: File;
  preview: string;
}



export function AddEventModal({ isOpen, onClose, onAdd, eventToEdit, onUpdate }: {
  isOpen: boolean; 
  onClose: () => void; 
  onAdd: (e: FamilyEvent) => void;
  onUpdate?: (e: FamilyEvent) => void;
  eventToEdit?: FamilyEvent | null;
}) {
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [era, setEra] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("custom");
  const [iconName, setIconName] = useState("Star");
  const [isOpenType, setIsOpenType] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpenType(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Media states
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [currentMedia, setCurrentMedia] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      files.forEach(f => URL.revokeObjectURL(f.preview));
    };
  }, [files]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Pre-fill data when editing
  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDate(eventToEdit.isoDate || "");
      setEra(eventToEdit.era);
      setDescription(eventToEdit.description);
      setType(eventToEdit.type);
      setIconName(eventToEdit.iconName);
      setCurrentMedia(eventToEdit.media || []);
    } else {
      // Reset for add mode
      setTitle("");
      setDate("");
      setEra("");
      setDescription("");
      setType("custom");
      setIconName("Star");
      setCurrentMedia([]);
    }
    setFiles([]);
  }, [eventToEdit, isOpen]);

  if (!isOpen) return null;

  const handleRemoveCurrentMedia = (index: number) => {
    setCurrentMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewFile = (index: number) => {
    setFiles(prev => {
      const fileToRemove = prev[index];
      if (fileToRemove) URL.revokeObjectURL(fileToRemove.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).map(file => ({
      file,
      preview: file.type.startsWith('image/') 
        ? URL.createObjectURL(file) 
        : '' // PDF or others will use icon for now
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || isUploading) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setStatusMessage("Đang khởi tạo quyền tải lên trực tiếp...");

    try {
      // 1. Lấy Access Token và tạo thư mục riêng từ Server (POST để truyền title)
      const tokenRes = await fetch('/api/documents/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() })
      });
      const { accessToken, folderId } = await tokenRes.json();
      
      if (!accessToken) throw new Error("Không lấy được quyền truy cập Google Drive");

      const uploadedMedia = [];
      
      // 2. Tải lên từng tệp mới trực tiếp lên Drive
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const fileObj = files[i].file;
          setStatusMessage(`Đang chuẩn bị: ${fileObj.name}...`);

          // Khởi tạo Resumable Upload
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

          if (!initRes.ok) throw new Error("Lỗi kết nối với máy chủ Google");
          const uploadUrl = initRes.headers.get('Location');
          if (!uploadUrl) throw new Error("Không nhận được địa chỉ tải lên");

          // Thực hiện tải lên trực tiếp (XHR để theo dõi tiến độ)
          await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl, true);
            
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const filePercent = Math.round((event.loaded / event.total) * 100);
                const totalPercent = Math.round((i / files.length) * 100 + (filePercent / files.length));
                setUploadProgress(totalPercent);
                setStatusMessage(`Đang đẩy tư liệu: ${fileObj.name} (${filePercent}%)...`);
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                const driveFile = JSON.parse(xhr.responseText);
                uploadedMedia.push({
                  id: driveFile.id,
                  url: `/api/documents/stream/${driveFile.id}`,
                  name: fileObj.name,
                  size: fileObj.size,
                  type: fileObj.type.startsWith('image/') ? 'IMAGE' : fileObj.type.startsWith('video/') ? 'VIDEO' : 'DOCUMENT'
                });
                resolve(true);
              } else {
                reject(new Error(`Google API returned ${xhr.status}`));
              }
            };

            xhr.onerror = () => reject(new Error("Lỗi mạng khi tải lên Drive"));
            xhr.send(fileObj);
          });
        }
      }

      // 3. Chuẩn bị dữ liệu sự kiện cuối cùng
      const eventData: FamilyEvent = {
        id: eventToEdit?.id,
        isoDate: date,
        date: new Date(date).toLocaleDateString('vi-VN'),
        era: era || "Hiện đại",
        title: title.trim(),
        description: description.trim(),
        iconName,
        type,
        media: [...currentMedia, ...uploadedMedia]
      };

      // 4. Lưu vào Database (Sử dụng onAdd/onUpdate hiện có)
      setStatusMessage("Hoàn tất! Đang lưu thông tin sử ký...");
      setUploadProgress(100);
      
      if (eventToEdit && onUpdate) {
        onUpdate(eventData);
        showToast("Cập nhật sự kiện thành công", "success");
      } else {
        onAdd(eventData);
        showToast("Đã ghi lại sự kiện dòng tộc mới", "success");
      }

      // Nhấn mạnh trạng thái hoàn tất trong 800ms trước khi đóng
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (error: any) {
      console.error("Lỗi tải lên sự kiện:", error);
      showToast(error.message || "Không thể tải lên tư liệu", "error");
    } finally {
      setIsUploading(false);
      setStatusMessage("");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1A0F0F]/95 backdrop-blur-2xl rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] w-[600px] max-w-full h-[85vh] flex flex-col overflow-hidden border border-white/10 animate-fade-slide-up">
        {/* Header - Reduced Height */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-[#140C0C]/95 backdrop-blur-md shrink-0 z-20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary shadow-lg">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-secondary text-lg tracking-wide">
                {eventToEdit ? "Chỉnh sửa Sự kiện" : "Thêm Sự Kiện"}
              </h3>
              <p className="text-[9px] font-bold text-secondary/40 uppercase tracking-[0.2em]">
                {eventToEdit ? "Cập nhật sử ký dòng họ" : "Ghi lại mốc lịch sử dòng tộc"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-secondary/30 hover:text-secondary transition-all outline-none">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar scroll-smooth">
          <form id="event-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-secondary/60 uppercase tracking-[0.2em] ml-1">Tiêu đề sự kiện *</label>
              <div className="relative group">
                <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/30 group-focus-within:text-secondary transition-colors" />
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="VD: Lễ giỗ Tổ năm 2026..." 
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-white/10 bg-white/5 text-secondary placeholder:text-secondary/20 text-sm focus:outline-none focus:border-secondary/50 focus:ring-4 focus:ring-secondary/5 transition-all outline-none" 
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-secondary/60 uppercase tracking-[0.2em] ml-1">Ngày tháng năm *</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className="w-full px-4 py-4 rounded-2xl border border-white/10 bg-white/5 text-secondary text-sm focus:outline-none focus:border-secondary/50 focus:ring-4 focus:ring-secondary/5 transition-all outline-none [color-scheme:dark]" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-secondary/60 uppercase tracking-[0.2em] ml-1">Thời kỳ</label>
                <input 
                  type="text" 
                  value={era} 
                  onChange={(e) => setEra(e.target.value)} 
                  placeholder="VD: Hiện đại" 
                  className="w-full px-4 py-4 rounded-2xl border border-white/10 bg-white/5 text-secondary placeholder:text-secondary/20 text-sm focus:outline-none focus:border-secondary/50 focus:ring-4 focus:ring-secondary/5 transition-all outline-none" 
                />
              </div>
            </div>

            {/* Type Dropdown and Icon Picker on same row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div ref={dropdownRef} className="space-y-2 relative">
                <label className="text-[10px] font-bold text-secondary/60 uppercase tracking-[0.2em] ml-1">Loại sự kiện</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsOpenType(!isOpenType)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border border-white/10 bg-white/5 text-secondary text-xs hover:border-secondary/30 transition-all outline-none min-h-[46px]"
                  >
                    <span className="truncate">
                      {EVENT_TYPE_OPTIONS.find(opt => opt.value === type)?.label || "Chọn loại sự kiện"}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-secondary/30 transition-transform ${isOpenType ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isOpenType && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full mb-2 left-0 right-0 p-2 rounded-2xl border border-white/10 bg-[#1A0F0F]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[110] max-h-[250px] overflow-y-auto custom-scrollbar"
                      >
                        {EVENT_TYPE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setType(opt.value);
                              setIsOpenType(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all mb-1 last:mb-0 ${
                              type === opt.value
                                ? "bg-secondary text-primary"
                                : "text-secondary/60 hover:bg-white/5 hover:text-secondary"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="relative">
                 <IconPicker selected={iconName} onSelect={setIconName} label="Biểu tượng sự kiện" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-secondary/60 uppercase tracking-[0.2em] ml-1">Mô tả di huấn / chi tiết</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Kể lại chi tiết về sự kiện này hoặc những lời răn dạy..." 
                rows={4} 
                className="w-full px-4 py-4 rounded-2xl border border-white/10 bg-white/5 text-secondary placeholder:text-secondary/20 text-sm focus:outline-none focus:border-secondary/50 focus:ring-4 focus:ring-secondary/5 transition-all outline-none resize-none italic leading-relaxed" 
              />
            </div>

            {/* Media Management Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" /> Tệp tin đính kèm
                </label>
              </div>

              {/* Gallery of existing and new media */}
              {(currentMedia.length > 0 || files.length > 0) && (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-3 mb-4">
                  {/* Current Media (on server) */}
                  {currentMedia.map((item, idx) => (
                    <div key={`curr-${idx}`} className="relative group/media aspect-square rounded-xl overflow-hidden border border-white/10 bg-[#0F0A0A] shadow-lg">
                      {item.type === 'IMAGE' ? (
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover/media:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-secondary/5">
                          {item.type === 'DOC' && (item.name.toLowerCase().endsWith('.pdf') || item.mimeType?.includes('pdf')) ? (
                            <>
                              <FileText className="w-8 h-8 text-rose-500 mb-1 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]" />
                              <span className="text-[8px] font-black text-rose-500/80 uppercase tracking-widest bg-rose-500/10 px-1.5 py-0.5 rounded-md">PDF</span>
                            </>
                          ) : item.type === 'VIDEO' ? (
                            <>
                              <Film className="w-8 h-8 text-amber-500 mb-1 drop-shadow-[0_0_8px_rgba(244,158,11,0.3)]" />
                              <span className="text-[8px] font-black text-amber-500/80 uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded-md">VIDEO</span>
                            </>
                          ) : (
                            <>
                              <FileText className="w-8 h-8 text-secondary/40 mb-1" />
                              <span className="text-[8px] font-black text-secondary/30 uppercase tracking-widest">FILE</span>
                            </>
                          )}
                        </div>
                      )}
                      
                      {/* Name Overlay on hover */}
                      <div className="absolute inset-x-0 bottom-0 p-1.5 bg-black/60 backdrop-blur-md opacity-0 group-hover/media:opacity-100 transition-opacity">
                        <p className="text-[7px] font-bold text-white truncate w-full px-1">{item.name}</p>
                      </div>

                      <button 
                        type="button"
                        onClick={() => handleRemoveCurrentMedia(idx)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-all hover:bg-red-500 z-20 shadow-lg"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* New Files (local) */}
                  {files.map((f, idx) => (
                    <div key={`new-${idx}`} className="relative group/media aspect-square rounded-xl overflow-hidden border border-secondary/30 bg-secondary/5 ring-1 ring-secondary/20 shadow-lg">
                      {f.preview ? (
                        <img src={f.preview} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-secondary/60 p-2 text-center bg-secondary/5">
                          {f.file.type.includes('pdf') || f.file.name.toLowerCase().endsWith('.pdf') ? (
                            <>
                              <FileText className="w-8 h-8 text-rose-500 mb-1 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]" />
                              <span className="text-[8px] font-black text-rose-500/80 uppercase tracking-widest bg-rose-500/10 px-1.5 py-0.5 rounded-md">PDF</span>
                            </>
                          ) : f.file.type.startsWith('video/') ? (
                            <>
                              <Film className="w-8 h-8 text-amber-500 mb-1 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
                              <span className="text-[8px] font-black text-amber-500/80 uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded-md">VIDEO</span>
                            </>
                          ) : (
                            <>
                              <FileText className="w-8 h-8 text-secondary/40 mb-1" />
                              <span className="text-[8px] font-black text-secondary/30 uppercase tracking-widest">FILE</span>
                            </>
                          )}
                          <div className="absolute inset-x-0 bottom-0 p-1.5 bg-black/40 backdrop-blur-sm opacity-0 group-hover/media:opacity-100 transition-opacity">
                            <span className="text-[7px] font-bold text-white truncate block w-full px-1">{f.file.name}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="absolute top-1 left-1 bg-secondary text-primary text-[6px] font-bold px-1 py-0.5 rounded shadow-sm z-10 transition-transform group-hover/media:scale-110">NEW</div>
                      <button 
                        type="button"
                        onClick={() => handleRemoveNewFile(idx)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-all hover:bg-red-500 z-20 shadow-lg"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Zone */}
              <div className="relative w-full group/upload">
                 <input 
                  type="file" 
                  multiple 
                  accept="image/*,video/*,.pdf" 
                  onChange={handleFileChange} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                <div className="w-full px-6 py-10 rounded-[32px] border-2 border-dashed border-white/5 text-center bg-white/[0.02] group-hover/upload:border-secondary/30 group-hover/upload:bg-white/5 transition-all flex flex-col items-center justify-center pointer-events-none">
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
          </form>
        </div>

        {/* Footer - Centered & 40% Narrower Buttons */}
        <div className="px-8 py-4 border-t border-white/5 bg-[#140C0C]/80 backdrop-blur-xl shrink-0 flex justify-center gap-4">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isUploading} 
            className="w-32 py-2.5 rounded-xl border border-white/10 text-secondary/40 font-black text-[9px] uppercase tracking-widest hover:bg-white/5 hover:text-secondary transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <X className="w-3.5 h-3.5" />
            Hủy
          </button>
          <button 
            form="event-form"
            type="submit" 
            disabled={!title.trim() || !date || isUploading} 
            className="w-32 py-2.5 rounded-xl bg-secondary text-primary font-black text-[9px] uppercase tracking-widest hover:brightness-110 hover:shadow-[0_8px_25px_rgba(212,175,55,0.2)] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /> 
                <span className="opacity-70">Lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" /> Lưu
              </>
            )}
          </button>
        </div>

        {/* Upload Progress Overlay */}
        <AnimatePresence>
          {isUploading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center p-12 bg-[#140C0C]/80 backdrop-blur-xl"
            >
              <div className="w-full max-w-sm space-y-8 text-center">
                <div className="relative mx-auto w-24 h-24">
                  {/* Outer spinning ring */}
                  <div className="absolute inset-0 border-4 border-secondary/10 rounded-full" />
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-4 border-t-secondary border-r-transparent border-b-transparent border-l-transparent rounded-full"
                  />
                  {/* Percentage in center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-secondary font-serif">{uploadProgress}%</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xl font-serif font-bold text-secondary tracking-tight">
                    {uploadProgress < 100 ? "Đang xử lý dữ liệu..." : "Đang hoàn tất..."}
                  </h4>
                  <p className="text-xs font-medium text-secondary/60 leading-relaxed h-8">
                    {statusMessage}
                  </p>
                </div>

                {/* Progress Bar Container */}
                <div className="relative w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-secondary/40 via-secondary to-secondary shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                  />
                </div>

                <div className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-secondary/30">
                  <Check className={`w-3 h-3 transition-colors ${uploadProgress === 100 ? 'text-secondary' : ''}`} />
                  An toàn • Bản mật • Vĩnh cửu
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
