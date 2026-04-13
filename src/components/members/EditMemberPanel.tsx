"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  User,
  MapPin,
  Briefcase,
  Calendar,
  Heart,
  Users,
  ChevronRight,
  Edit3,
  Save,
  Trash2,
  Clock,
  BookOpen,
  Cake,
  Skull,
  Baby,
  Star,
  Sparkles,
  Check,
  Network,
  ChevronDown,
  ImageIcon,
} from "lucide-react";
import { formatWithCanChi, calculateAge, getZodiacAnimal } from "@/utils/lunar";
import type { Gender } from "@prisma/client";

interface MemberFull {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  generation: number;
  isAlive: boolean;
  occupation?: string | null;
  birthPlace?: string | null;
  currentLocation?: string | null;
  avatar?: string | null;
  dateOfBirth?: Date | string | null;
  dateOfDeath?: Date | string | null;
  biography?: string | null;
  branch?: { id: string; name: string } | null;
  sourceRels?: any[];
  targetRels?: any[];
  events?: any[];
}

interface Branch {
  id: string;
  name: string;
}

interface EditMemberPanelProps {
  member: MemberFull | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => void;
  onNavigateToMember?: (id: string) => void;
  branches: Branch[];
  maxGeneration: number;
}

type TabKey = "info" | "relations" | "events";

export function EditMemberPanel({
  member,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onNavigateToMember,
  branches,
  maxGeneration,
}: EditMemberPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("info");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        setIsAnimating(true);
        setActiveTab("info");
        setIsEditing(false);
      });
    } else {
      requestAnimationFrame(() => setIsAnimating(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (member) {
      const dob = member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split("T")[0] : "";
      const dod = member.dateOfDeath ? new Date(member.dateOfDeath).toISOString().split("T")[0] : "";
      setEditData({
        firstName: member.firstName,
        lastName: member.lastName,
        gender: member.gender,
        dateOfBirth: dob,
        dateOfDeath: dod,
        isAlive: member.isAlive,
        occupation: member.occupation || "",
        birthPlace: member.birthPlace || "",
        currentLocation: member.currentLocation || "",
        biography: member.biography || "",
        generation: member.generation,
        branchId: member.branch?.id || "",
        avatar: member.avatar || "",
      });
    }
  }, [member]);

  const handleClose = useCallback(() => {
    setIsAnimating(false);
    setTimeout(onClose, 350);
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, handleClose]);

  if (!isOpen || !member) return null;

  const isMale = (isEditing ? editData.gender : member.gender) === "MALE";
  const displayDob = isEditing ? editData.dateOfBirth : member.dateOfBirth;
  const displayDod = isEditing ? editData.dateOfDeath : member.dateOfDeath;
  const birthYear = displayDob ? new Date(displayDob).getFullYear() : null;
  const age = calculateAge(
    displayDob ? String(displayDob) : undefined,
    displayDod ? String(displayDod) : undefined
  );
  const zodiac = birthYear ? getZodiacAnimal(birthYear) : null;

  // Build relationships from raw data
  const relationships: { type: string; name: string; id: string; gender: string; isAlive: boolean }[] = [];
  member.sourceRels?.forEach((rel: any) => {
    relationships.push({
      type: rel.type === "SPOUSE" ? "spouse" : rel.type === "PARENT_CHILD" ? "child" : "other",
      name: rel.targetMember.fullName,
      id: rel.targetMember.id,
      gender: rel.targetMember.gender,
      isAlive: rel.targetMember.isAlive,
    });
  });
  member.targetRels?.forEach((rel: any) => {
    relationships.push({
      type: rel.type === "SPOUSE" ? "spouse" : rel.type === "PARENT_CHILD" ? "parent" : "other",
      name: rel.sourceMember.fullName,
      id: rel.sourceMember.id,
      gender: rel.sourceMember.gender,
      isAlive: rel.sourceMember.isAlive,
    });
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(member.id, editData);
      setIsEditing(false);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) setEditData((prev: any) => ({ ...prev, avatar: data.url }));
    } catch (err) {
      console.error("Avatar upload failed:", err);
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "info", label: "Thông tin", icon: <User className="w-3.5 h-3.5" /> },
    { key: "relations", label: `Quan hệ (${relationships.length})`, icon: <Users className="w-3.5 h-3.5" /> },
    { key: "events", label: "Sự kiện", icon: <Clock className="w-3.5 h-3.5" /> },
  ];

  const relTypeLabels: Record<string, string> = {
    parent: "Cha/Mẹ", spouse: "Vợ/Chồng", child: "Con", sibling: "Anh/Chị/Em", other: "Khác",
  };

  const eventTypeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    BIRTH: { icon: <Baby className="w-4 h-4" />, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    MARRIAGE: { icon: <Heart className="w-4 h-4" />, color: "text-rose-600 bg-rose-50 border-rose-200" },
    DEATH: { icon: <Skull className="w-4 h-4" />, color: "text-slate-600 bg-slate-50 border-slate-200" },
    CUSTOM: { icon: <Star className="w-4 h-4" />, color: "text-amber-600 bg-amber-50 border-amber-200" },
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] transition-all duration-350 ${
          isAnimating ? "bg-foreground/20 backdrop-blur-[2px]" : "bg-transparent backdrop-blur-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-[440px] max-w-[90vw] z-[70] bg-white shadow-2xl
          transition-transform duration-350 ease-out
          ${isAnimating ? "translate-x-0" : "translate-x-full"}
          flex flex-col overflow-hidden
        `}
      >
        {/* Header */}
        <div
          className={`relative overflow-hidden ${
            isMale
              ? "bg-gradient-to-br from-primary/90 via-primary to-primary/95"
              : "bg-gradient-to-br from-rose-800/90 via-rose-900 to-rose-800/95"
          }`}
        >
          <div className="absolute inset-0 opacity-5 bg-parchment" />
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-secondary/10 blur-2xl" />

          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="relative z-10 p-6 pb-5">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className={`w-20 h-20 rounded-2xl border-2 border-secondary/60 overflow-hidden shadow-xl ${
                  isMale ? "bg-primary/30" : "bg-rose-700/30"
                }`}>
                  {(isEditing ? editData.avatar : member.avatar) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={isEditing ? editData.avatar : member.avatar!} alt={member.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white/60" />
                    </div>
                  )}
                  {isEditing && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                      <ImageIcon className="w-5 h-5 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }} />
                    </label>
                  )}
                </div>
                {!(isEditing ? editData.isAlive : member.isAlive) && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-foreground/80 border-2 border-white flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">†</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-xl font-serif font-bold text-white truncate leading-tight">
                  {isEditing ? `${editData.lastName} ${editData.firstName}`.trim() : member.fullName}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-secondary">
                    <Sparkles className="w-3 h-3" />
                    Đời thứ {isEditing ? editData.generation : member.generation}
                  </span>
                  {(isEditing ? editData.isAlive : member.isAlive) ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">Còn sống</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px] font-bold border border-white/10">Đã khuất</span>
                  )}
                </div>
                {age && <p className="mt-1 text-[11px] text-white/60">{age}</p>}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(isEditing ? editData.occupation : member.occupation) && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-white/90 text-[11px] font-medium border border-white/5">
                  <Briefcase className="w-3 h-3 text-secondary" />
                  {isEditing ? editData.occupation : member.occupation}
                </span>
              )}
              {zodiac && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/20 text-secondary text-[11px] font-bold border border-secondary/20">
                  🐾 Tuổi {zodiac}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border bg-white sticky top-0 z-20">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all relative ${
                activeTab === tab.key ? "text-primary" : "text-foreground/40 hover:text-foreground/70"
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.key && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {activeTab === "info" && (
            <div className="p-5 space-y-5">
              {isEditing ? (
                /* ─── Edit Mode ─── */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">Họ</label>
                      <input type="text" value={editData.lastName} onChange={(e) => setEditData((p: any) => ({ ...p, lastName: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">Tên</label>
                      <input type="text" value={editData.firstName} onChange={(e) => setEditData((p: any) => ({ ...p, firstName: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">Giới tính</label>
                      <div className="flex gap-2">
                        {(["MALE", "FEMALE"] as Gender[]).map((g) => (
                          <button key={g} type="button" onClick={() => setEditData((p: any) => ({ ...p, gender: g }))}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${editData.gender === g
                              ? g === "MALE" ? "bg-primary text-secondary border-primary" : "bg-rose-600 text-white border-rose-600"
                              : "bg-white text-foreground/60 border-border"}`}>
                            {g === "MALE" ? "Nam" : "Nữ"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">Đời thứ</label>
                      <select value={editData.generation} onChange={(e) => setEditData((p: any) => ({ ...p, generation: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-xl border border-border text-sm appearance-none focus:outline-none focus:border-secondary">
                        {Array.from({ length: Math.max(maxGeneration + 2, 15) }, (_, i) => (
                          <option key={i + 1} value={i + 1}>Đời {i + 1}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">Ngày sinh</label>
                      <input type="date" value={editData.dateOfBirth} onChange={(e) => setEditData((p: any) => ({ ...p, dateOfBirth: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-secondary" />
                    </div>
                    {!editData.isAlive && (
                      <div>
                        <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">Ngày mất</label>
                        <input type="date" value={editData.dateOfDeath} onChange={(e) => setEditData((p: any) => ({ ...p, dateOfDeath: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-secondary" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">Tình trạng</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEditData((p: any) => ({ ...p, isAlive: true, dateOfDeath: "" }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border ${editData.isAlive ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-foreground/60 border-border"}`}>
                        Còn sống
                      </button>
                      <button type="button" onClick={() => setEditData((p: any) => ({ ...p, isAlive: false }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border ${!editData.isAlive ? "bg-foreground/80 text-white border-foreground/80" : "bg-white text-foreground/60 border-border"}`}>
                        Đã khuất
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">Nghề nghiệp</label>
                    <input type="text" value={editData.occupation} onChange={(e) => setEditData((p: any) => ({ ...p, occupation: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-secondary" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">Nơi sinh</label>
                      <input type="text" value={editData.birthPlace} onChange={(e) => setEditData((p: any) => ({ ...p, birthPlace: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-secondary" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">Nơi ở hiện tại</label>
                      <input type="text" value={editData.currentLocation} onChange={(e) => setEditData((p: any) => ({ ...p, currentLocation: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-secondary" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">Nhánh</label>
                    <select value={editData.branchId} onChange={(e) => setEditData((p: any) => ({ ...p, branchId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm appearance-none focus:outline-none focus:border-secondary">
                      <option value="">— Không chọn —</option>
                      {branches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">Tiểu sử</label>
                    <textarea value={editData.biography} onChange={(e) => setEditData((p: any) => ({ ...p, biography: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-secondary resize-none" />
                  </div>
                </div>
              ) : (
                /* ─── View Mode ─── */
                <>
                  {/* Dates */}
                  {(member.dateOfBirth || member.dateOfDeath) && (
                    <div className="space-y-3">
                      <h3 className="text-[11px] font-bold text-foreground/40 uppercase tracking-widest">Ngày tháng</h3>
                      <div className="space-y-2">
                        {member.dateOfBirth && (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><Cake className="w-4 h-4 text-emerald-600" /></div>
                            <div>
                              <p className="text-[10px] text-foreground/40 font-bold uppercase">Ngày sinh</p>
                              <p className="text-sm font-bold text-foreground">{formatWithCanChi(String(member.dateOfBirth).split("T")[0])}</p>
                            </div>
                          </div>
                        )}
                        {member.dateOfDeath && (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><Skull className="w-4 h-4 text-slate-500" /></div>
                            <div>
                              <p className="text-[10px] text-foreground/40 font-bold uppercase">Ngày mất</p>
                              <p className="text-sm font-bold text-foreground">{formatWithCanChi(String(member.dateOfDeath).split("T")[0])}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {(member.birthPlace || member.currentLocation) && (
                    <div className="space-y-3">
                      <h3 className="text-[11px] font-bold text-foreground/40 uppercase tracking-widest">Quê quán</h3>
                      <div className="space-y-2">
                        {member.birthPlace && (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><MapPin className="w-4 h-4 text-blue-600" /></div>
                            <div>
                              <p className="text-[10px] text-foreground/40 font-bold uppercase">Nơi sinh</p>
                              <p className="text-sm font-medium text-foreground">{member.birthPlace}</p>
                            </div>
                          </div>
                        )}
                        {member.currentLocation && (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center"><MapPin className="w-4 h-4 text-indigo-600" /></div>
                            <div>
                              <p className="text-[10px] text-foreground/40 font-bold uppercase">Nơi ở hiện tại</p>
                              <p className="text-sm font-medium text-foreground">{member.currentLocation}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Biography */}
                  {member.biography && (
                    <div className="space-y-3">
                      <h3 className="text-[11px] font-bold text-foreground/40 uppercase tracking-widest flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" /> Tiểu sử
                      </h3>
                      <div className="p-4 rounded-xl bg-parchment border border-secondary/20 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-secondary/40 rounded-full" />
                        <p className="text-sm leading-relaxed text-foreground/80 italic pl-3">{member.biography}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "relations" && (
            <div className="p-5 space-y-5">
              {(["parent", "spouse", "child", "sibling"] as const).map((relType) => {
                const rels = relationships.filter((r) => r.type === relType);
                if (rels.length === 0) return null;
                return (
                  <div key={relType} className="space-y-2">
                    <h3 className="text-[11px] font-bold text-foreground/40 uppercase tracking-widest">
                      {relTypeLabels[relType]} ({rels.length})
                    </h3>
                    <div className="space-y-1.5">
                      {rels.map((rel) => (
                        <button
                          key={rel.id}
                          onClick={() => onNavigateToMember?.(rel.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-secondary/40 hover:bg-parchment/30 transition-all group"
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                            rel.gender === "MALE" ? "bg-primary/5 border-primary/20 text-primary" : "bg-rose-50 border-rose-200 text-rose-700"
                          }`}>
                            <User className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-bold text-foreground truncate">{rel.name}</p>
                            <p className="text-[10px] text-foreground/40">{rel.isAlive ? "Còn sống" : "Đã khuất"}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-foreground/20 group-hover:text-secondary transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {relationships.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-10 h-10 text-foreground/10 mx-auto mb-3" />
                  <p className="text-sm text-foreground/40 italic">Chưa có thông tin quan hệ</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "events" && (
            <div className="p-5">
              {member.events && member.events.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />
                  <div className="space-y-4">
                    {member.events.map((event: any, i: number) => {
                      const config = eventTypeConfig[event.type] || eventTypeConfig.CUSTOM;
                      return (
                        <div key={i} className="flex gap-4 relative">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 z-10 ${config.color}`}>
                            {config.icon}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="text-sm font-bold text-foreground">{event.title}</p>
                            {event.eventDate && (
                              <p className="text-[11px] text-foreground/50 mt-0.5">
                                {formatWithCanChi(new Date(event.eventDate).toISOString().split("T")[0])}
                              </p>
                            )}
                            {event.description && (
                              <p className="text-xs text-foreground/60 mt-1.5 leading-relaxed">{event.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-10 h-10 text-foreground/10 mx-auto mb-3" />
                  <p className="text-sm text-foreground/40 italic">Chưa có sự kiện nào</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-border bg-white/80 backdrop-blur-sm flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-foreground/60 font-bold text-sm hover:bg-foreground/5 transition-all"
              >
                <X className="w-4 h-4" /> Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-secondary font-bold text-sm border border-secondary hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isSaving ? <div className="w-4 h-4 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-secondary font-bold text-sm border border-secondary hover:shadow-lg transition-all"
              >
                <Edit3 className="w-4 h-4" /> Chỉnh sửa
              </button>
              <button
                onClick={() => onDelete(member.id)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-red-50 text-red-600 font-bold text-sm border border-red-200 hover:bg-red-100 transition-all"
              >
                <Trash2 className="w-4 h-4" /> Xóa
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
