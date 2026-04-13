"use client";

import React, { useState, useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardLayout";
import { 
  FileText, 
  Search, 
  Plus, 
  Filter, 
  Grid2X2, 
  List, 
  FileCheck,
  Shapes,
  X
} from "lucide-react";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { AddDocumentModal } from "@/components/modals/AddDocumentModal";
import { DocumentDetailModal } from "@/components/modals/DocumentDetailModal";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { DOC_TYPE_OPTIONS } from "@/components/dashboard/DashboardConstants";
import { addDocument, deleteDocument, updateDocument } from "@/app/actions/documents";
import { ToastProvider, useToast } from "@/components/ui/Toast";

interface DocumentsPageClientProps {
  initialDocuments: any[];
}

export function DocumentsPageContent({ initialDocuments }: DocumentsPageClientProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const { showToast } = useToast();

  // Statistics
  const stats = useMemo(() => {
    const total = documents.length;
    const byType = documents.reduce((acc: any, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total,
      mostCommonType: Object.entries(byType).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "N/A",
      recentCount: documents.filter(d => {
        const date = new Date(d.createdAt);
        const now = new Date();
        return (now.getTime() - date.getTime()) < 1000 * 60 * 60 * 24 * 7; // Last 7 days
      }).length
    };
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === "all" || doc.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [searchTerm, selectedType, documents]);

  const handleAddDocument = async (data: any) => {
    try {
      const newDoc = await addDocument({
        name: data.title,
        type: data.type,
        description: data.description,
        files: data.files || []
      });
      
      setDocuments([newDoc, ...documents]);
      showToast(`Đã thêm tài liệu: ${newDoc.name}`, "success");
    } catch (error) {
      console.error("Error adding document:", error);
      showToast("Không thể thêm tài liệu. Vui lòng thử lại.", "error");
    }
  };

  const handleUpdateDocument = async (id: string, data: any) => {
    try {
      const updatedDoc = await updateDocument(id, {
        name: data.title,
        type: data.type,
        description: data.description,
        files: data.files
      });
      
      setDocuments(documents.map(d => d.id === id ? updatedDoc : d));
      showToast(`Đã cập nhật tài liệu: ${updatedDoc.name}`, "info");
    } catch (error) {
      console.error("Error updating document:", error);
      showToast("Không thể cập nhật tài liệu.", "error");
    }
  };

  const handleDeleteDocument = async () => {
    if (!deletingDocId) return;
    try {
      await deleteDocument(deletingDocId);
      setDocuments(documents.filter(d => d.id !== deletingDocId));
      showToast("Đã xóa tài liệu thành công", "success");
    } catch (error) {
      showToast("Lỗi khi xóa tài liệu", "error");
    } finally {
      setDeletingDocId(null);
    }
  };

  const startDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingDocId(id);
  };

  const startEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDocId(id);
    setIsAddModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-ancient-scroll">
      <DashboardHeader title="Tài Liệu Số">
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-primary text-secondary rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-bold text-sm border border-secondary"
        >
          <Plus className="w-4 h-4" />
          Đăng tài liệu
        </button>
      </DashboardHeader>

      <main className="flex-1 overflow-y-auto p-8 space-y-8 relative">
        <div className="scroll-vignette" />
        
        {/* --- Stats and Search --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 z-10 relative">
          <div className="md:col-span-1 bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-secondary/20 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><FileCheck className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Tổng số</p>
              <p className="text-lg font-serif font-bold text-primary">{stats.total} bản ghi</p>
            </div>
          </div>
          <div className="md:col-span-1 bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-secondary/20 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600"><Shapes className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Phổ biến nhất</p>
              <p className="text-lg font-serif font-bold text-primary">{stats.mostCommonType}</p>
            </div>
          </div>
          
          <div className="md:col-span-2 relative flex items-center group">
            <Search className="absolute left-4 w-5 h-5 text-primary/60 group-focus-within:text-primary transition-colors duration-200" />
            <input 
              type="text" 
              placeholder="Tìm kiếm tài liệu, sắc phong, hình ảnh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/95 border-2 border-secondary/30 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/10 h-full backdrop-blur-md transition-all shadow-sm focus:shadow-xl text-sm font-medium"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-4 p-1 rounded-full text-slate-400 hover:text-primary hover:bg-slate-100 transition-all cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* --- Filters and View --- */}
        <div className="flex flex-wrap items-center justify-between gap-4 z-10 relative">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setSelectedType("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                selectedType === "all" 
                ? "bg-primary text-secondary border-secondary shadow-lg shadow-primary/20" 
                : "bg-white/80 text-foreground/60 border-secondary/10 hover:border-secondary/40"
              }`}
            >
              Tất cả
            </button>
            {DOC_TYPE_OPTIONS.map((opt) => (
              <button 
                key={opt.value}
                onClick={() => setSelectedType(opt.value)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  selectedType === opt.value 
                  ? "bg-primary text-secondary border-secondary shadow-lg shadow-primary/20" 
                  : "bg-white/80 text-foreground/60 border-secondary/10 hover:border-secondary/40"
                }`}
              >
                {opt.value}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white/60 p-1.5 rounded-xl border border-secondary/10 backdrop-blur-sm">
            <button 
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-primary shadow-sm" : "text-foreground/40 hover:text-foreground/70"}`}
            >
              <Grid2X2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white text-primary shadow-sm" : "text-foreground/40 hover:text-foreground/70"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* --- Document List --- */}
        <div className="z-10 relative min-h-[400px]">
          {filteredDocuments.length > 0 ? (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-slide-up"
              : "flex flex-col gap-3 animate-fade-slide-up"
            }>
              {filteredDocuments.map((doc) => (
                <DocumentCard 
                  key={doc.id}
                  {...doc}
                  onView={(id) => setSelectedDocId(id)}
                  onEdit={startEdit}
                  onDelete={startDelete}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center p-12 bg-white/40 rounded-3xl border border-dashed border-secondary/20 backdrop-blur-sm">
              <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center text-secondary mb-6">
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-serif font-bold text-primary mb-2">Không tìm thấy tài liệu nào</h3>
              <p className="text-sm text-foreground/50 max-w-sm mx-auto italic">
                Hãy thử thay đổi từ khóa tìm kiếm hoặc lọc theo danh mục khác.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* --- Modals --- */}
      <AddDocumentModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingDocId(null);
        }} 
        onAdd={handleAddDocument}
        onUpdate={handleUpdateDocument}
        initialData={editingDocId ? documents.find(d => d.id === editingDocId) : null}
      />
      
      {selectedDocId && (
        <DocumentDetailModal 
          doc={documents.find(d => d.id === selectedDocId) || null} 
          onClose={() => setSelectedDocId(null)} 
        />
      )}

      <ConfirmModal 
        isOpen={!!deletingDocId}
        title="Xóa tài liệu?"
        message="Bạn có chắc chắn muốn xóa tài liệu này? Hành động này không thể hoàn tác."
        onConfirm={handleDeleteDocument}
        onClose={() => setDeletingDocId(null)}
      />
    </div>
  );
}

export function DocumentsPageClient(props: DocumentsPageClientProps) {
  return <DocumentsPageContent {...props} />;
}
