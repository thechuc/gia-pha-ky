import React, { useState, useRef, useEffect } from "react";
import { 
  X, 
  Upload, 
  Type, 
  AlignLeft,
  FileText
} from "lucide-react";
import { IconPicker } from "../dashboard/IconPicker";
import { DOC_TYPE_OPTIONS } from "../dashboard/DashboardConstants";
import { FamilyDocument, DocumentFile } from "@/types/family";



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
      if (f.size > 30 * 1024 * 1024) {
        alert(`Tệp "${f.name}" quá lớn (>30MB).`);
        continue;
      }
      
      const fileBase64 = await readFileAsDataURL(f);
      processedNewFiles.push({
        url: fileBase64,
        name: f.name,
        size: f.size,
        mimeType: f.type
      });
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    
    const colorOption = DOC_TYPE_OPTIONS.find((o) => o.value === docType);
    
    if (initialData && initialData.id && onUpdate) {
      onUpdate(initialData.id, {
        title: title.trim(),
        type: docType,
        year: parseInt(year) || new Date().getFullYear(),
        description: description.trim(),
        iconName,
        color: colorOption?.color || "bg-gray-50 border-gray-200 text-gray-700",
        files: files,
      });
    } else if (onAdd) {
      onAdd({
        title: title.trim(), 
        type: docType, 
        year: parseInt(year) || new Date().getFullYear(),
        description: description.trim(), 
        iconName,
        color: colorOption?.color || "bg-gray-50 border-gray-200 text-gray-700",
        createdAt: new Date().toLocaleDateString("vi-VN"),
        files: files,
      });
    }
    setFiles([]);
    onClose();
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
              <label className="text-[10px] font-bold text-secondary/60 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <Upload className="w-3.5 h-3.5" /> Tệp tin đính kèm
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`border-2 border-dashed rounded-[24px] p-8 text-center transition-all cursor-pointer relative group/upload shadow-inner ${
                  isDragging 
                    ? "border-secondary bg-secondary/10 scale-[1.02]" 
                    : files.length > 0 
                      ? "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40" 
                      : "border-white/5 bg-white/[0.02] hover:border-secondary/30 hover:bg-white/5"
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                  multiple
                />
                <Upload className="w-10 h-10 text-secondary/20 mx-auto mb-3 group-hover/upload:text-secondary/50 transition-all duration-500 group-hover/upload:scale-110" />
                <p className="text-sm font-bold text-secondary/60 transition-colors">
                  {files.length > 0 ? "Thêm tệp tin di sản khác..." : "Kéo thả bản sao hoặc click để số hóa"}
                </p>
                <p className="text-[10px] text-secondary/20 mt-2 uppercase tracking-widest font-medium">Ảnh, PDF, DOCX (Tối đa 30MB/file)</p>
              </div>
            </div>

            {/* Files List */}
            {files.length > 0 && (
              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-bold text-secondary/40 uppercase tracking-[0.2em] ml-1">Danh sách tệp tin ({files.length})</label>
                <div className="grid grid-cols-1 gap-3">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 group/file hover:bg-white/5 hover:border-secondary/30 transition-all shadow-lg">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-[#1A0F0F] border border-white/10 flex items-center justify-center shadow-inner text-secondary">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-secondary/80 truncate max-w-[280px]" title={file.name}>{file.name}</p>
                          <p className="text-[10px] text-secondary/30 uppercase tracking-widest mt-0.5">{formatSize(file.size)}</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeFile(idx)}
                        className="p-2.5 rounded-xl text-rose-500/40 hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                        title="Xóa tệp"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-[#140C0C]/80 backdrop-blur-xl sticky bottom-0 z-10 flex gap-4">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 py-4 rounded-2xl border border-white/10 text-secondary/40 font-black text-[10px] uppercase tracking-widest hover:bg-white/5 hover:text-secondary transition-all"
          >
            Hủy bỏ
          </button>
          <button 
            form="doc-form" 
            type="submit" 
            disabled={!title.trim() || !description.trim()} 
            className="flex-1 py-4 rounded-2xl bg-secondary text-primary font-black text-[10px] uppercase tracking-widest hover:brightness-110 hover:shadow-[0_10px_30px_rgba(212,175,55,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {initialData ? 'Lưu cập nhật' : 'Khai báo di sản'}
          </button>
        </div>
      </div>
    </div>
  );
}
