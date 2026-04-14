"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Crown,
  Database,
  Plus,
  TrendingUp,
  MapPin,
  Shield,
  Star,
  PenTool,
  History,
  FileText,
  Trash2,
  TreeDeciduous,
  Heart,
  Baby,
  Swords,
  ArrowRight,
  Network,
  BookOpen,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { getOverviewData, addEvent, updateFamilyInfo } from "@/app/actions/family";
import { addDocument } from "@/app/actions/documents";
import { FamilyTimeline } from "./FamilyTimeline";
import { UpcomingDeathAnniversaries } from "./UpcomingDeathAnniversaries";
import { FamilyEvent, FamilyDocument, FamilyInfo } from "@/types/family";
import { CreateHeritageModal } from "@/components/modals/CreateHeritageModal";

import { RenderIcon } from "./IconRegistry";
import { IconPicker } from "./IconPicker";
import { EVENT_TYPE_OPTIONS, DOC_TYPE_OPTIONS } from "./DashboardConstants";
import { AddEventModal } from "../modals/AddEventModal";
import { AddDocumentModal } from "../modals/AddDocumentModal";
import { DocumentDetailModal } from "../modals/DocumentDetailModal";
import { EventDetailModal } from "../modals/EventDetailModal";
import { EditFamilyModal } from "../modals/EditFamilyModal";

// ─── Types ─────────────────────────────────────────────────────────────────


// ─── Skeleton: Mirrors the actual initialized layout ─────────────────────────
function DashboardSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto bg-transparent pb-12 custom-scrollbar">
      <div className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* Hero skeleton */}
        <div className="bg-[#1A0F0F]/60 backdrop-blur-xl px-8 py-10 rounded-[32px] border border-white/5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex-1 space-y-4">
              <div className="skeleton-dark h-5 w-32 rounded-full" />
              <div className="skeleton-dark h-10 w-72 rounded-xl" />
              <div className="skeleton-dark h-4 w-96 max-w-full rounded-lg" />
              <div className="skeleton-dark h-4 w-64 rounded-lg" />
              <div className="flex gap-3 pt-1">
                <div className="skeleton-dark h-9 w-36 rounded-xl" />
                <div className="skeleton-dark h-9 w-44 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="skeleton-dark h-24 w-36 rounded-3xl" />
              <div className="skeleton-dark h-24 w-36 rounded-3xl" />
            </div>
          </div>
        </div>

        {/* Tree link skeleton */}
        <div className="skeleton-dark h-20 rounded-3xl" />

        {/* Main grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Timeline skeleton */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#1A0F0F]/60 backdrop-blur-xl rounded-[32px] border border-white/5 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="skeleton-dark w-10 h-10 rounded-xl" />
                  <div className="skeleton-dark h-6 w-44 rounded-lg" />
                </div>
                <div className="skeleton-dark h-9 w-28 rounded-xl" />
              </div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="skeleton-dark w-16 h-16 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton-dark h-5 w-3/4 rounded-lg" />
                    <div className="skeleton-dark h-4 w-full rounded" />
                    <div className="skeleton-dark h-4 w-2/3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column skeleton */}
          <div className="lg:col-span-5 space-y-6">
            <div className="skeleton-dark h-64 rounded-[32px]" />
            <div className="bg-[#1A0F0F]/60 backdrop-blur-xl rounded-[32px] border border-white/5 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="skeleton-dark h-6 w-36 rounded-lg" />
                <div className="skeleton-dark h-8 w-8 rounded-xl" />
              </div>
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-4 items-start p-3 rounded-2xl border border-white/5">
                  <div className="skeleton-dark w-12 h-12 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton-dark h-4 w-3/4 rounded" />
                    <div className="skeleton-dark h-3 w-full rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyHeritage({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-transparent">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full mx-4"
      >
        <div className="relative bg-[#1A0F0F]/80 backdrop-blur-3xl p-10 rounded-3xl border border-secondary/20 shadow-2xl text-center overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-secondary/8 blur-3xl pointer-events-none" />

          <div className="relative w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-secondary/30">
            <Database className="w-9 h-9 text-secondary" />
          </div>

          <h2 className="text-2xl font-serif font-bold text-secondary mb-3">
            Khởi Tạo Di Sản
          </h2>
          <p className="text-[#E2D1B0]/60 mb-8 leading-relaxed italic text-sm">
            Chào mừng bạn đến với Gia Phả Ký. Hãy bắt đầu hành trình lưu giữ cội nguồn bằng cách khởi tạo thông tin dòng tộc và vị Thủy Tổ đầu tiên.
          </p>

          <button
            onClick={onStart}
            className="relative w-full bg-secondary text-primary font-bold py-4 rounded-2xl hover:bg-white hover:shadow-2xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden group cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
            <Shield className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Bắt đầu khởi tạo Di sản</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  unit,
  highlighted,
}: {
  label: string;
  value: number;
  unit: string;
  highlighted?: boolean;
}) {
  return (
    <div className={`p-5 rounded-3xl border min-w-[130px] transition-all duration-200 hover:-translate-y-1 cursor-default ${
      highlighted
        ? "bg-primary border-secondary/30 shadow-[0_10px_30px_rgba(92,30,30,0.4)]"
        : "bg-white/5 backdrop-blur-md border-white/10 shadow-xl"
    }`}>
      <p className={`text-[9px] font-black uppercase mb-1 tracking-[0.18em] ${
        highlighted ? "text-secondary/50" : "text-secondary/30"
      }`}>{label}</p>
      <div className="flex items-end gap-1.5 mt-1">
        <span className={`text-3xl font-serif font-bold ${
          highlighted ? "text-secondary" : "text-secondary/70"
        }`}>{value}</span>
        <span className={`text-xs pb-1 ${
          highlighted ? "text-secondary/40" : "text-secondary/25"
        }`}>{unit}</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// MAIN: Overview Page
// ════════════════════════════════════════════════════════
export function OverviewPage({ initialData }: { initialData: any }) {
  const { canEditFamily, canEditEvents, canEditDocuments } = useUserPermissions();
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [documents, setDocuments] = useState<FamilyDocument[]>([]);
  const [familyInfo, setFamilyInfo] = useState<FamilyInfo>({
    id: "", name: "", motto: "", origin: "", description: "",
    totalGenerations: 1, totalMembers: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isEditFamilyModalOpen, setIsEditFamilyModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<FamilyDocument | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<FamilyEvent | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [initialDataProcessed, setInitialDataProcessed] = useState(false);

  useEffect(() => {
    async function processData(data: any) {
      if (data && data.family) {
        setFamilyInfo({
          id: data.family.id,
          name: data.family.name,
          motto: data.family.motto || "",
          origin: data.family.origin || "",
          description: data.family.description || "",
          totalGenerations: data.totalGenerations || 1,
          totalMembers: data.totalMembers || 0,
        });
        setEvents(data.events as FamilyEvent[]);
        setDocuments((data.documents || []).map((d: any) => ({
          id: d.id,
          title: d.name,
          type: d.type || "Tài liệu",
          year: d.createdAt ? new Date(d.createdAt).getFullYear() : 0,
          description: d.description || "",
          iconName: "FileText",
          color: "bg-amber-50 border-amber-200 text-amber-700",
          url: d.url ?? undefined,
          fileName: d.name,
          mimeType: d.mimeType ?? undefined,
          size: d.size ?? undefined,
        })));
      }
      setIsLoading(false);
      setInitialDataProcessed(true);
    }

    if (initialData && !initialDataProcessed) {
      processData(initialData);
    } else if (!initialDataProcessed) {
      async function fetchData() {
        try {
          const data = await getOverviewData();
          await processData(data);
        } catch (error) {
          console.error("Error fetching data:", error);
          setIsLoading(false);
        }
      }
      fetchData();
    }
  }, [initialData, initialDataProcessed]);

  const handleEventAdd = async (newEvent: FamilyEvent) => {
    if (!canEditEvents) return;
    setEvents(prev => [newEvent, ...prev]);
    await addEvent({ ...newEvent, date: newEvent.isoDate || newEvent.date, icon: newEvent.iconName });
  };

  const handleDocAdd = async (newPost: FamilyDocument) => {
    if (!canEditDocuments) return;
    setDocuments(prev => [newPost, ...prev]);
    await addDocument({
      name: newPost.title,
      type: newPost.type,
      description: newPost.description,
      files: newPost.files || [],
    });
  };

  const handleFamilyInfoSave = async (data: any) => {
    if (!familyInfo?.id || !canEditFamily) return;
    await updateFamilyInfo(familyInfo.id, data);
    setFamilyInfo(prev => ({ ...prev, ...data }));
  };

  const displayedEvents = showAllEvents ? events : events.slice(0, 5);

  // ── Render States ──────────────────────────────────────────────────────────
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (familyInfo.totalMembers === 0) {
    return (
      <>
        <EmptyHeritage onStart={() => setIsCreateModalOpen(true)} />
        <CreateHeritageModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => window.location.reload()}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto bg-transparent custom-scrollbar">
        <div className="max-w-7xl mx-auto px-6 pt-8 space-y-8">

          {/* ── Hero Section ──────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden bg-[#1A0F0F]/60 backdrop-blur-xl px-8 py-10 rounded-[32px] border border-white/5 shadow-2xl group"
          >
            {/* Layered ambient glows */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full -mr-36 -mt-36 blur-3xl transition-all duration-700 group-hover:bg-primary/18 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-secondary/4 rounded-full -ml-28 -mb-28 blur-2xl transition-all duration-700 group-hover:bg-secondary/7 pointer-events-none" />
            {/* Subtle top gradient line */}
            <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-secondary/20 to-transparent" />

            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="flex-1 space-y-4">
                {/* Badge row */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest border border-secondary/20">
                    <Shield className="w-3 h-3" />
                    Di sản trường tồn
                  </div>
                  {canEditFamily && (
                    <button
                      onClick={() => setIsEditFamilyModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5 text-secondary/50 hover:bg-secondary hover:text-primary transition-all duration-200 border border-white/5 cursor-pointer"
                    >
                      <PenTool className="w-2.5 h-2.5" />
                      Chỉnh sửa
                    </button>
                  )}
                </div>

                <h1 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight leading-tight drop-shadow-lg">
                  {familyInfo.name}
                </h1>

                <p className="text-[15px] text-[#E2D1B0]/65 max-w-2xl leading-relaxed whitespace-pre-line italic">
                  {familyInfo.description}
                </p>

                <div className="flex flex-wrap gap-3 pt-1">
                  {familyInfo.origin && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 shadow-inner">
                      <MapPin className="w-3.5 h-3.5 text-secondary/50" />
                      <span className="text-sm font-medium text-[#E2D1B0]/75">{familyInfo.origin}</span>
                    </div>
                  )}
                  {familyInfo.motto && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 shadow-inner">
                      <Star className="w-3.5 h-3.5 text-secondary/70" />
                      <span className="text-sm font-medium text-secondary/75 italic">"{familyInfo.motto}"</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                <StatCard label="Tổng thế hệ" value={familyInfo.totalGenerations} unit="đời" highlighted />
                <StatCard label="Thành viên" value={familyInfo.totalMembers} unit="người" />
              </div>
            </div>
          </motion.div>

          {/* ── Tree Quick Link ───────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            <Link
              href="/dashboard/tree"
              className="flex items-center gap-4 p-5 rounded-3xl bg-[#1A0F0F]/40 backdrop-blur-md border border-white/5 hover:border-secondary/20 hover:shadow-2xl hover:shadow-secondary/5 transition-all duration-200 group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary shadow-lg group-hover:bg-secondary group-hover:text-primary transition-all duration-200 shrink-0">
                <Network className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-serif font-bold text-secondary group-hover:text-white transition-colors duration-200">
                  Xem Cây Gia Phả Tương Tác
                </h3>
                <p className="text-sm text-[#E2D1B0]/45 font-medium mt-0.5">
                  {familyInfo.totalMembers} thành viên · {familyInfo.totalGenerations} thế hệ · Sơ đồ phả hệ hiện đại
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-primary transition-all duration-200 shrink-0">
                <ArrowRight className="w-5 h-5" />
              </div>
            </Link>
          </motion.div>

          {/* ── Main Content Grid ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left: Timeline */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.12 }}
              className="lg:col-span-7 space-y-6"
            >
              <div className="bg-[#1A0F0F]/60 backdrop-blur-xl rounded-[32px] border border-white/5 shadow-2xl overflow-hidden flex flex-col">
                <div className="px-8 py-6 border-b border-white/5 bg-[#140C0C]/40 flex items-center justify-between sticky top-0 z-20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 border border-secondary/30 flex items-center justify-center text-secondary shadow-lg">
                      <History className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-[15px] font-serif font-bold text-secondary tracking-wide">Dòng Thời Gian</h2>
                      <p className="text-[10px] text-secondary/30 font-bold uppercase tracking-widest">{events.length} sự kiện lịch sử</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 px-2">
                  <FamilyTimeline 
                    events={displayedEvents as any} 
                    onEventClick={(e) => setSelectedEvent(e as FamilyEvent)}
                  />

                  {events.length > 5 && (
                    <button
                      onClick={() => setShowAllEvents(!showAllEvents)}
                      className="w-[calc(100%-32px)] mx-4 mb-8 py-4 rounded-2xl border-2 border-dashed border-white/5 text-xs font-bold text-secondary/40 hover:border-secondary/20 hover:text-secondary hover:bg-white/5 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      {showAllEvents ? (
                        <>Thu gọn <ChevronUp className="w-4 h-4" /></>
                      ) : (
                        <>Xem toàn bộ {events.length} sự kiện <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform duration-200" /></>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Right: Anniversaries + Documents */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.16 }}
              className="lg:col-span-5 space-y-6"
            >
              <UpcomingDeathAnniversaries />

              {/* Documents */}
              <div className="bg-[#1A0F0F]/60 backdrop-blur-xl rounded-[32px] border border-white/5 shadow-2xl flex flex-col">
                <div className="px-8 py-6 border-b border-white/5 bg-[#140C0C]/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary shadow-lg">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-[15px] font-serif font-bold text-secondary tracking-wide">Tài Liệu & Di Sản</h2>
                      <p className="text-[10px] text-secondary/30 font-bold uppercase tracking-widest">{documents.length} tài liệu</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  {documents.length === 0 ? (
                    <div className="py-10 text-center space-y-3">
                      <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto text-secondary/20 border border-dashed border-white/10">
                        <BookOpen className="w-7 h-7" />
                      </div>
                      <p className="text-secondary/30 italic text-sm">Chưa có tài liệu nào được lưu trữ</p>
                      {canEditDocuments && (
                        <button
                          onClick={() => setIsDocModalOpen(true)}
                          className="text-xs font-bold text-secondary/50 hover:text-secondary transition-colors duration-200 cursor-pointer"
                        >
                          + Thêm tài liệu đầu tiên
                        </button>
                      )}
                    </div>
                  ) : (
                    documents.map((doc, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedDoc(doc)}
                        className="group border border-white/5 rounded-2xl p-4 hover:border-secondary/20 hover:bg-white/5 transition-all duration-200 cursor-pointer flex items-start gap-4"
                      >
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-secondary/20 bg-primary/10 text-secondary group-hover:scale-105 transition-transform duration-200 shadow-lg">
                          <RenderIcon name={doc.iconName} className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-bold text-sm text-secondary truncate group-hover:text-white transition-colors duration-200">{doc.title}</h4>
                            <span className="text-[10px] font-bold text-secondary/25 tracking-widest shrink-0">{doc.year}</span>
                          </div>
                          <p className="text-xs text-[#E2D1B0]/45 line-clamp-2 leading-relaxed italic">{doc.description}</p>
                          {/* Type pill */}
                          <span className="mt-2 inline-block text-[9px] font-black uppercase tracking-widest text-secondary/40 bg-secondary/5 border border-secondary/10 px-2 py-0.5 rounded-full">
                            {doc.type}
                          </span>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-white/5 text-secondary/25 flex items-center justify-center group-hover:bg-secondary group-hover:text-primary transition-all duration-200 shrink-0">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-8 py-4 bg-[#140C0C]/60 border-t border-white/5 rounded-b-[32px]">
                  <p className="text-[9px] text-center text-secondary/25 font-black uppercase tracking-[0.22em] animate-shimmer-gold">
                    Gia phả được bảo tồn bằng công nghệ số ✦
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

      {/* ── Page Footer ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mt-16 bg-[#1A0F0F]/60 backdrop-blur-md border-t border-secondary/10 w-full"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-px bg-secondary/30" />
              <h3 className="text-[11px] font-black text-secondary tracking-[0.2em] uppercase">Tâm Nguyện Dòng Tộc</h3>
            </div>
            <p className="text-[10px] text-[#E2D1B0]/40 italic">
              &ldquo;Uống nước nhớ nguồn&rdquo; — Hãy đóng góp tư liệu để trang sử dòng tộc trường tồn.
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <p className="hidden md:block text-[9px] text-secondary/15 font-black uppercase tracking-[0.3em]">
              Bảo tồn số ✦
            </p>
            <button className="px-6 py-2 bg-secondary text-primary font-bold rounded-lg text-[10px] hover:bg-white transition-all duration-300 tracking-widest uppercase cursor-pointer flex items-center gap-2 group/cta">
              <Heart className="w-3.5 h-3.5 transition-transform" />
              Liên hệ
            </button>
          </div>
        </div>
      </motion.div>
    </div>

    {/* ── Modals ────────────────────────────────────────────────────────── */}
    <AddEventModal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} onAdd={handleEventAdd} />
    <AddDocumentModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} onAdd={handleDocAdd} />
    <DocumentDetailModal doc={selectedDoc as any} onClose={() => setSelectedDoc(null)} />
    <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    <EditFamilyModal
      isOpen={isEditFamilyModalOpen}
      onClose={() => setIsEditFamilyModalOpen(false)}
      info={familyInfo}
      onSave={handleFamilyInfoSave}
    />
    <CreateHeritageModal
      isOpen={isCreateModalOpen}
      onClose={() => setIsCreateModalOpen(false)}
      onSuccess={() => window.location.reload()}
    />
  </div>
);
}
