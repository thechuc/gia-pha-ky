"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Edit3,
  Calendar,
  MapPin,
  Briefcase,
  BookOpen,
  ChevronDown,
  ImageIcon,
  Save,
  Link2,
  Users,
  Heart,
  UserCheck,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import type { Gender } from "@prisma/client";
import { Member, Branch, SimpleMember } from "@/types/member";
import { FlexibleDateInput } from "./FlexibleDateInput";

// ─── Interfaces ───────────────────────────────────────────────────────────────


interface RelationshipEntry {
  id: string;
  type: "PARENT_CHILD" | "SPOUSE";
  // The OTHER member in the relationship
  member: SimpleMember;
  // Our role: 'source' = we are parent/spouse-initiator, 'target' = we are child/linked
  role: "source" | "target";
}



interface NewSpouseForm {
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  birthDay?: number;
  birthMonth?: number;
  birthYear?: number;
  isBirthDateLunar: boolean;
  birthPlace: string;
}

interface RelChanges {
  toAdd: Array<{ type: "PARENT_CHILD" | "SPOUSE"; relatedMemberId: string; role: "source" | "target" }>;
  toRemove: string[]; // relationship IDs
  newSpouse: NewSpouseForm | null;
}

interface EditMemberModalProps {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
  onSave: (id: string, data: any, relChanges?: RelChanges) => Promise<void>;
  branches: Branch[];
  maxGeneration: number;
  existingMembers: SimpleMember[];
}

// ─── Shared Dark Styles ───────────────────────────────────────────────────────
const INPUT_CLASS =
  "w-full px-3 py-2.5 rounded-xl border border-white/10 bg-[#140C0C] text-[#E2D1B0] text-sm placeholder-white/20 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all";

const LABEL_CLASS =
  "text-[10px] font-black text-secondary/50 uppercase tracking-[0.18em] mb-1.5 flex items-center gap-1";

const SELECT_CLASS =
  "w-full appearance-none px-3 py-2.5 pr-9 rounded-xl border border-white/10 bg-[#140C0C] text-[#E2D1B0] text-sm focus:outline-none focus:border-secondary cursor-pointer transition-all";

// ─── Helper: derive existing relationships for this member ───────────────────
function deriveRelationships(member: Member): RelationshipEntry[] {
  const rels: RelationshipEntry[] = [];

  // sourceRels: member is source (parent or spouse-initiator)
  for (const r of member.sourceRels || []) {
    if (r.targetMember) {
      rels.push({
        id: r.id,
        type: r.type as "PARENT_CHILD" | "SPOUSE",
        member: r.targetMember as SimpleMember,
        role: "source",
      });
    }
  }

  // targetRels: member is target (child or spouse-linked)
  for (const r of member.targetRels || []) {
    if (r.sourceMember) {
      rels.push({
        id: r.id,
        type: r.type as "PARENT_CHILD" | "SPOUSE",
        member: r.sourceMember as SimpleMember,
        role: "target",
      });
    }
  }

  return rels;
}

// ─── Relationship Label ───────────────────────────────────────────────────────
function relLabel(rel: RelationshipEntry, myGender: Gender): string {
  if (rel.type === "PARENT_CHILD") {
    if (rel.role === "source") {
      // We are parent → other is child
      return myGender === "MALE" ? "Con trai/gái" : "Con";
    } else {
      // We are child → other is parent
      return rel.member.gender === "MALE" ? "Cha" : "Mẹ";
    }
  }
  if (rel.type === "SPOUSE") {
    return rel.member.gender === "MALE" ? "Chồng" : "Vợ";
  }
  return "Liên kết";
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function EditMemberModal({
  isOpen, member, onClose, onSave, branches, maxGeneration, existingMembers,
}: EditMemberModalProps) {
  // ── Basic Info ──
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<Gender>("MALE");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [birthDay, setBirthDay] = useState<number | undefined>();
  const [birthMonth, setBirthMonth] = useState<number | undefined>();
  const [birthYear, setBirthYear] = useState<number | undefined>();
  const [isBirthDateLunar, setIsBirthDateLunar] = useState(false);

  const [dateOfDeath, setDateOfDeath] = useState("");
  const [deathDay, setDeathDay] = useState<number | undefined>();
  const [deathMonth, setDeathMonth] = useState<number | undefined>();
  const [deathYear, setDeathYear] = useState<number | undefined>();
  const [isDeathDateLunar, setIsDeathDateLunar] = useState(false);
  const [isAlive, setIsAlive] = useState(true);
  const [occupation, setOccupation] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [biography, setBiography] = useState("");
  const [branchName, setBranchName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [honorific, setHonorific] = useState("");
  const [alias, setAlias] = useState("");
  const [title, setTitle] = useState("");
  const [generation, setGeneration] = useState<number>(1);

  // ── Relationship State ──
  // Existing rels derived from member (tracked for pending removal)
  const [pendingRemove, setPendingRemove] = useState<string[]>([]); // rel IDs to delete
  // New rels to add
  const [addRelType, setAddRelType] = useState<"" | "PARENT_CHILD" | "SPOUSE">("");
  const [newFatherId, setNewFatherId] = useState("");
  const [newMotherId, setNewMotherId] = useState("");
  const [spouseMode, setSpouseMode] = useState<"select" | "create">("select");
  const [spouseSearch, setSpouseSearch] = useState("");
  const [newSpouseId, setNewSpouseId] = useState("");
  const [newSpouseForm, setNewSpouseForm] = useState<NewSpouseForm>({
    firstName: "", lastName: "", gender: "FEMALE", dateOfBirth: "", birthPlace: "", isBirthDateLunar: false,
  });

  // ── Derived ──
  const existingRels = useMemo(() => member ? deriveRelationships(member) : [], [member]);
  const visibleRels = useMemo(
    () => existingRels.filter(r => !pendingRemove.includes(r.id)),
    [existingRels, pendingRemove]
  );

  const males = useMemo(() =>
    (existingMembers || []).filter(m => m.gender === "MALE" && m.id !== member?.id),
    [existingMembers, member?.id]
  );
  const females = useMemo(() =>
    (existingMembers || []).filter(m => m.gender === "FEMALE" && m.id !== member?.id),
    [existingMembers, member?.id]
  );
  const spouseCandidates = useMemo(() => {
    const expectedGender = gender === "MALE" ? "FEMALE" : "MALE";
    return (existingMembers || []).filter(m =>
      m.gender === expectedGender &&
      m.id !== member?.id &&
      !visibleRels.some(r => r.type === "SPOUSE" && r.member.id === m.id) &&
      (spouseSearch === "" || m.fullName.toLowerCase().includes(spouseSearch.toLowerCase()))
    );
  }, [existingMembers, gender, member?.id, visibleRels, spouseSearch]);

  // ── Sync member data ──
  useEffect(() => {
    if (member) {
      setFirstName(member.firstName || "");
      setLastName(member.lastName || "");
      setGender(member.gender);
      setDateOfBirth(member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split("T")[0] : "");
      setDateOfDeath(member.dateOfDeath ? new Date(member.dateOfDeath).toISOString().split("T")[0] : "");
      setIsAlive(member.isAlive);
      setOccupation(member.occupation || "");
      setBirthPlace(member.birthPlace || "");
      setCurrentLocation(member.currentLocation || "");
      setBiography(member.biography || "");
      setBranchName(member.branch?.name || "");
      setAvatar(member.avatar || "");
      setHonorific(member.honorific || "");
      setAlias(member.alias || "");
      setTitle(member.title || "");
      setGeneration(member.generation || 1);
      setIsHidden(member.metadata?.isHidden || false);
      
      setBirthDay(member.birthDay ?? undefined);
      setBirthMonth(member.birthMonth ?? undefined);
      setBirthYear(member.birthYear ?? undefined);
      setIsBirthDateLunar(member.isBirthDateLunar || false);
      
      setDeathDay(member.deathDay ?? undefined);
      setDeathMonth(member.deathMonth ?? undefined);
      setDeathYear(member.deathYear ?? undefined);
      setIsDeathDateLunar(member.isDeathDateLunar || false);

      // Reset relationship edit state
      setPendingRemove([]);
      setAddRelType("");
      setNewFatherId(""); setNewMotherId("");
      setSpouseMode("select"); setSpouseSearch(""); setNewSpouseId("");
      setNewSpouseForm({ 
        firstName: "", lastName: "", gender: member.gender === "MALE" ? "FEMALE" : "MALE", 
        dateOfBirth: "", birthPlace: "", isBirthDateLunar: false 
      });
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) setAvatar(data.url);
    } catch (err) { console.error("Avatar upload failed:", err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || isSaving) return;
    setIsSaving(true);
    try {
      // Build relationship changes
      const toAdd: RelChanges["toAdd"] = [];
      if (addRelType === "PARENT_CHILD") {
        if (newFatherId) toAdd.push({ type: "PARENT_CHILD", relatedMemberId: newFatherId, role: "target" });
        if (newMotherId) toAdd.push({ type: "PARENT_CHILD", relatedMemberId: newMotherId, role: "target" });
      } else if (addRelType === "SPOUSE" && spouseMode === "select" && newSpouseId) {
        toAdd.push({ type: "SPOUSE", relatedMemberId: newSpouseId, role: "source" });
      }

      const relChanges: RelChanges = {
        toAdd,
        toRemove: pendingRemove,
        newSpouse: addRelType === "SPOUSE" && spouseMode === "create" && newSpouseForm.firstName && newSpouseForm.lastName
          ? newSpouseForm : null,
      };

      await onSave(member.id, {
        firstName: firstName.trim(), lastName: lastName.trim(), gender,
        dateOfBirth: dateOfBirth || undefined, 
        birthDay, birthMonth, birthYear, isBirthDateLunar,
        dateOfDeath: dateOfDeath || undefined,
        deathDay, deathMonth, deathYear, isDeathDateLunar,
        isAlive, occupation: occupation || undefined, birthPlace: birthPlace || undefined,
        currentLocation: currentLocation || undefined, biography: biography || undefined,
        avatar: avatar || undefined, branchName: branchName || undefined,
        honorific: honorific || undefined, alias: alias || undefined, title: title || undefined,
        generation: Number(generation),
        metadata: {
          ...(member.metadata || {}),
          isHidden,
        },
      }, relChanges);
      onClose();
    } catch (err) { console.error("Failed to update member:", err); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[4px]" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#1A0F0F] border border-secondary/20 rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.8)] w-[660px] max-w-[95vw] max-h-[92vh] flex flex-col overflow-hidden animate-fade-slide-up">

        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-secondary/8 blur-3xl pointer-events-none" />

        {/* ── Header ── */}
        <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#140C0C]/60 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary border border-secondary/30 flex items-center justify-center text-secondary shadow-lg">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-secondary text-lg">Chỉnh Sửa Thành Viên</h3>
              <p className="text-[11px] text-secondary/40">Cập nhật thông tin {member.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center cursor-pointer transition-colors">
            <X className="w-4 h-4 text-white/30 hover:text-white/60" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

          {/* ── Avatar + Name ── */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className={`w-20 h-20 rounded-2xl border-2 border-dashed overflow-hidden flex items-center justify-center ${avatar ? "border-secondary" : "border-white/15 hover:border-secondary/40"
                } bg-[#140C0C] transition-all cursor-pointer group`}>
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <ImageIcon className="w-6 h-6 text-white/20 group-hover:text-secondary/60 transition-colors" />
                    <span className="text-[8px] text-white/25 font-bold uppercase">Avatar</span>
                  </div>
                )}
                <input type="file" accept="image/*"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }}
                  className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Họ *</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                  className={INPUT_CLASS} required />
              </div>
              <div>
                <label className={LABEL_CLASS}>Tên đệm & Tên *</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                  className={INPUT_CLASS} required />
              </div>
            </div>
          </div>

          {/* ── Historical Titles ── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Tên Tự (Alias)", value: alias, set: setAlias, ph: "VD: Khang Dũng" },
              { label: "Tên Hiệu", value: honorific, set: setHonorific, ph: "VD: Từ Ái" },
              { label: "Tên Húy", value: title, set: setTitle, ph: "VD: Trình" },
            ].map(f => (
              <div key={f.label}>
                <label className={LABEL_CLASS}>{f.label}</label>
                <input type="text" value={f.value} onChange={e => f.set(e.target.value)}
                  placeholder={f.ph} className={INPUT_CLASS} />
              </div>
            ))}
          </div>

          {/* ── Gender & Alive & Visibility ── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}>Giới tính</label>
              <div className="flex gap-2">
                {(["MALE", "FEMALE"] as Gender[]).map(g => (
                  <button key={g} type="button" onClick={() => setGender(g)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer ${gender === g
                        ? g === "MALE" ? "bg-primary text-secondary border-primary shadow-lg" : "bg-rose-700 text-white border-rose-700"
                        : "bg-white/5 text-white/50 border-white/10 hover:border-white/20"
                      }`}>
                    {g === "MALE" ? "Nam" : "Nữ"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS}>Tình trạng</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setIsAlive(true); setDateOfDeath(""); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer ${isAlive ? "bg-emerald-700 text-white border-emerald-700" : "bg-white/5 text-white/50 border-white/10 hover:border-white/20"
                    }`}>Còn sống</button>
                <button type="button" onClick={() => setIsAlive(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer ${!isAlive ? "bg-[#2C2020] text-white/80 border-white/20" : "bg-white/5 text-white/50 border-white/10 hover:border-white/20"
                    }`}>Đã khuất</button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-900/10 border border-amber-900/20 rounded-2xl flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isHidden ? "bg-amber-900/40 text-amber-500" : "bg-white/5 text-white/20"}`}>
                <X className="w-4 h-4" />
              </div>
              <div>
                <p className="text-secondary text-xs font-bold">Ẩn khỏi cây gia phả (Vĩnh viễn)</p>
                <p className="text-[10px] text-secondary/40">Người này và hậu duệ sẽ không xuất hiện trên cây</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setIsHidden(!isHidden)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isHidden ? "bg-amber-600" : "bg-white/10"}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isHidden ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          {/* ── Dates ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FlexibleDateInput
              label="Ngày sinh"
              standardDate={dateOfBirth}
              day={birthDay}
              month={birthMonth}
              year={birthYear}
              isLunar={isBirthDateLunar}
              onChange={(d) => {
                setDateOfBirth(d.standardDate || "");
                setBirthDay(d.day);
                setBirthMonth(d.month);
                setBirthYear(d.year);
                setIsBirthDateLunar(d.isLunar);
              }}
              INPUT_CLASS={INPUT_CLASS}
              LABEL_CLASS={LABEL_CLASS}
            />
            {!isAlive && (
              <FlexibleDateInput
                label="Ngày mất"
                standardDate={dateOfDeath}
                day={deathDay}
                month={deathMonth}
                year={deathYear}
                isLunar={isDeathDateLunar}
                onChange={(d) => {
                  setDateOfDeath(d.standardDate || "");
                  setDeathDay(d.day);
                  setDeathMonth(d.month);
                  setDeathYear(d.year);
                  setIsDeathDateLunar(d.isLunar);
                }}
                INPUT_CLASS={INPUT_CLASS}
                LABEL_CLASS={LABEL_CLASS}
              />
            )}
          </div>


          {/* ── Branch ── */}
          <div>
            <label className={LABEL_CLASS}>Nhánh (chi)</label>
            <div className="relative">
              <select value={branchName} onChange={e => setBranchName(e.target.value)} className={SELECT_CLASS}>
                <option value="" className="bg-[#1A0F0F]">— Không chọn —</option>
                {["Thủy tổ", "Chi nhất", "Chi hai", "Chi ba", "Chi tư", "Chi năm", "Chi sáu", "Chi bảy"].map(name => (
                  <option key={name} value={name} className="bg-[#1A0F0F]">{name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            </div>
          </div>

          {/* ── Generation ── */}
          <div>
            <label className={LABEL_CLASS}>Thế hệ (Đời thứ)</label>
            <div className="relative">
              <select 
                value={generation} 
                onChange={e => setGeneration(Number(e.target.value))} 
                className={SELECT_CLASS}
              >
                {Array.from({ length: Math.max(maxGeneration + 1, generation) }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num} className="bg-[#1A0F0F]">
                    Đời thứ {num} {num > maxGeneration ? "(Đời mới)" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            </div>
          </div>

          {/* ── Occupation & Birth Place ── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}><Briefcase className="w-3 h-3" /> Nghề nghiệp</label>
              <input type="text" value={occupation} onChange={e => setOccupation(e.target.value)}
                placeholder="VD: Kỹ sư, Giáo viên..." className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}><MapPin className="w-3 h-3" /> Nơi sinh</label>
              <input type="text" value={birthPlace} onChange={e => setBirthPlace(e.target.value)}
                placeholder="VD: Hà Đông, Hà Nội" className={INPUT_CLASS} />
            </div>
          </div>

          {/* ── Current Location ── */}
          <div>
            <label className={LABEL_CLASS}><MapPin className="w-3 h-3" /> Nơi ở hiện tại</label>
            <input type="text" value={currentLocation} onChange={e => setCurrentLocation(e.target.value)}
              placeholder="VD: TP. Hồ Chí Minh" className={INPUT_CLASS} />
          </div>

          {/* ── Biography ── */}
          <div>
            <label className={LABEL_CLASS}><BookOpen className="w-3 h-3" /> Tiểu sử</label>
            <textarea value={biography} onChange={e => setBiography(e.target.value)}
              placeholder="Viết đôi dòng về cuộc đời, sự nghiệp, đóng góp..." rows={3}
              className={`${INPUT_CLASS} resize-none`} />
          </div>

          {/* ════════════════════════════════════════════════ */}
          {/* ── Relationship Section ── */}
          {/* ════════════════════════════════════════════════ */}
          <div className="border-t border-secondary/10 pt-5 space-y-4">
            <label className="text-[10px] font-black text-secondary/50 uppercase tracking-[0.18em] flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5 text-secondary/40" />
              Liên kết quan hệ
            </label>

            {/* ── Existing Relationships ── */}
            {visibleRels.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-white/25 uppercase tracking-widest font-bold">Quan hệ hiện có</p>
                {visibleRels.map(rel => (
                  <div key={rel.id}
                    className="flex items-center gap-3 px-3 py-2.5 bg-[#140C0C]/80 rounded-xl border border-white/5">
                    {/* Badge */}
                    <div className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${rel.type === "SPOUSE"
                        ? "bg-rose-900/60 text-rose-400/80 border border-rose-700/30"
                        : rel.role === "target"
                          ? "bg-sky-900/50 text-sky-400/70 border border-sky-700/20"
                          : "bg-amber-900/50 text-amber-400/70 border border-amber-700/20"
                      }`}>
                      {relLabel(rel, gender)}
                    </div>
                    {/* Avatar initial */}
                    <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${rel.member.gender === "FEMALE" ? "bg-rose-800/40 text-rose-300" : "bg-sky-800/40 text-sky-300"
                      }`}>
                      {rel.member.fullName.charAt(rel.member.fullName.lastIndexOf(" ") + 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#E2D1B0] text-xs font-semibold truncate">{rel.member.fullName}</p>
                      <p className="text-white/25 text-[10px]">Đời {rel.member.generation}</p>
                    </div>
                    {/* Remove button (pending) */}
                    <button type="button"
                      onClick={() => setPendingRemove(p => [...p, rel.id])}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white/20 hover:text-rose-400 hover:bg-rose-900/30 transition-all cursor-pointer shrink-0"
                      title="Xóa liên kết này">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Show if any pending removal */}
            {pendingRemove.length > 0 && (
              <p className="text-[10px] text-rose-400/60 italic flex items-center gap-1.5">
                <Trash2 className="w-3 h-3" />
                {pendingRemove.length} liên kết sẽ bị xóa khi lưu —{" "}
                <button type="button" onClick={() => setPendingRemove([])}
                  className="underline underline-offset-2 hover:text-rose-300 cursor-pointer transition-colors">
                  Hoàn tác
                </button>
              </p>
            )}

            {/* ── Add New Relationship ── */}
            <div>
              <p className="text-[10px] text-white/25 uppercase tracking-widest font-bold mb-2">Thêm liên kết mới</p>

              {/* Type selector */}
              <div className="flex gap-2 mb-3">
                {[
                  { val: "", label: "Không thêm", icon: null },
                  { val: "PARENT_CHILD", label: "Con của...", icon: <Users className="w-3.5 h-3.5" /> },
                  { val: "SPOUSE", label: "Vợ / Chồng", icon: <Heart className="w-3.5 h-3.5" /> },
                ].map(opt => (
                  <button key={opt.val} type="button"
                    onClick={() => setAddRelType(opt.val as any)}
                    className={`flex-1 py-2 px-2 rounded-xl text-[11px] font-bold border transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${addRelType === opt.val
                        ? "bg-secondary/20 text-secondary border-secondary/40"
                        : "bg-white/5 text-white/40 border-white/10 hover:border-white/20 hover:text-white/60"
                      }`}>
                    {opt.icon}{opt.label}
                  </button>
                ))}
              </div>

              {/* PARENT_CHILD: Father + Mother dropdowns */}
              {addRelType === "PARENT_CHILD" && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-[#140C0C]/60 rounded-2xl border border-white/5">
                  <div>
                    <label className={LABEL_CLASS}><span className="text-sky-400">♂</span> Cha (Bố)</label>
                    <div className="relative">
                      <select value={newFatherId} onChange={e => setNewFatherId(e.target.value)} className={SELECT_CLASS}>
                        <option value="" className="bg-[#1A0F0F]">— Chưa xác định —</option>
                        {males.map(m => (
                          <option key={m.id} value={m.id} className="bg-[#1A0F0F]">
                            {m.fullName} (Đời {m.generation})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                    </div>
                    {males.length === 0 && (
                      <p className="text-[10px] text-white/20 mt-1 italic">Không có thành viên nam ở đời trước</p>
                    )}
                  </div>
                  <div>
                    <label className={LABEL_CLASS}><span className="text-rose-400">♀</span> Mẹ</label>
                    <div className="relative">
                      <select value={newMotherId} onChange={e => setNewMotherId(e.target.value)} className={SELECT_CLASS}>
                        <option value="" className="bg-[#1A0F0F]">— Chưa xác định —</option>
                        {females.map(m => (
                          <option key={m.id} value={m.id} className="bg-[#1A0F0F]">
                            {m.fullName} (Đời {m.generation})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                    </div>
                    {females.length === 0 && (
                      <p className="text-[10px] text-white/20 mt-1 italic">Không có thành viên nữ ở đời trước</p>
                    )}
                  </div>
                  {(newFatherId || newMotherId) && (
                    <p className="col-span-2 text-[10px] text-secondary/50 italic flex items-center gap-1.5">
                      <UserCheck className="w-3 h-3 text-secondary/40" />
                      Liên kết cha/mẹ sẽ được lưu khi nhấn "Lưu thay đổi"
                    </p>
                  )}
                </div>
              )}

              {/* SPOUSE */}
              {addRelType === "SPOUSE" && (
                <div className="p-4 bg-[#140C0C]/60 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setSpouseMode("select"); setNewSpouseId(""); }}
                      className={`flex-1 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${spouseMode === "select"
                          ? "bg-secondary/15 text-secondary border-secondary/30"
                          : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"
                        }`}>
                      <UserCheck className="w-3.5 h-3.5" />
                      Chọn từ danh sách
                    </button>
                    <button type="button" onClick={() => { setSpouseMode("create"); setNewSpouseId(""); }}
                      className={`flex-1 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${spouseMode === "create"
                          ? "bg-secondary/15 text-secondary border-secondary/30"
                          : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"
                        }`}>
                      <Plus className="w-3.5 h-3.5" />
                      Thêm vợ/chồng mới
                    </button>
                  </div>

                  {/* Select existing */}
                  {spouseMode === "select" && (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none" />
                        <input type="text" value={spouseSearch} onChange={e => setSpouseSearch(e.target.value)}
                          placeholder={`Tìm ${gender === "MALE" ? "vợ" : "chồng"} trong danh sách...`}
                          className={`${INPUT_CLASS} pl-9`} />
                      </div>
                      {spouseCandidates.length === 0 ? (
                        <div className="text-center py-4 space-y-1.5">
                          <p className="text-[11px] text-white/30 italic">
                            {spouseSearch ? `Không tìm thấy "${spouseSearch}"` : `Chưa có ${gender === "MALE" ? "thành viên nữ" : "thành viên nam"} phù hợp`}
                          </p>
                          <button type="button" onClick={() => { setSpouseMode("create"); setNewSpouseForm(p => ({ ...p, firstName: spouseSearch, gender: gender === "MALE" ? "FEMALE" : "MALE", isBirthDateLunar: false })); }}
                            className="text-[11px] text-secondary/60 hover:text-secondary underline underline-offset-2 cursor-pointer transition-colors">
                            + Thêm {gender === "MALE" ? "vợ" : "chồng"} mới
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
                          {spouseCandidates.map(m => (
                            <button key={m.id} type="button" onClick={() => setNewSpouseId(m.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer text-left ${newSpouseId === m.id
                                  ? "bg-secondary/20 border-secondary/40 text-secondary"
                                  : "bg-white/3 border-white/5 text-white/60 hover:bg-white/8 hover:border-white/15"
                                }`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${m.gender === "FEMALE" ? "bg-rose-700/30 text-rose-400" : "bg-sky-700/30 text-sky-400"
                                }`}>
                                {m.fullName.charAt(m.fullName.lastIndexOf(" ") + 1)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-xs truncate">{m.fullName}</p>
                                <p className="text-[10px] opacity-50">Đời {m.generation}</p>
                              </div>
                              {newSpouseId === m.id && <UserCheck className="w-3.5 h-3.5 text-secondary shrink-0" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Create new spouse */}
                  {spouseMode === "create" && (
                    <div className="space-y-3">
                      <p className="text-[11px] text-secondary/50 italic">
                        Điền thông tin {gender === "MALE" ? "vợ" : "chồng"} — sẽ được thêm vào gia phả khi lưu
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={LABEL_CLASS}>Họ *</label>
                          <input type="text" value={newSpouseForm.lastName}
                            onChange={e => setNewSpouseForm(p => ({ ...p, lastName: e.target.value }))}
                            placeholder="Ngô" className={INPUT_CLASS} />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Tên đệm & Tên *</label>
                          <input type="text" value={newSpouseForm.firstName}
                            onChange={e => setNewSpouseForm(p => ({ ...p, firstName: e.target.value }))}
                            placeholder="Thị Hoa" className={INPUT_CLASS} />
                        </div>
                      </div>
                      <div className="col-span-2">
                         <FlexibleDateInput
                          label="Ngày sinh"
                          standardDate={newSpouseForm.dateOfBirth}
                          day={newSpouseForm.birthDay}
                          month={newSpouseForm.birthMonth}
                          year={newSpouseForm.birthYear}
                          isLunar={newSpouseForm.isBirthDateLunar}
                          onChange={(d) => setNewSpouseForm(p => ({ 
                            ...p, 
                            dateOfBirth: d.standardDate || "",
                            birthDay: d.day,
                            birthMonth: d.month,
                            birthYear: d.year,
                            isBirthDateLunar: d.isLunar
                          }))}
                          INPUT_CLASS={INPUT_CLASS}
                          LABEL_CLASS={LABEL_CLASS}
                        />
                      </div>
                      <div>
                        <label className={LABEL_CLASS}><MapPin className="w-3 h-3" /> Nơi sinh</label>
                        <input type="text" value={newSpouseForm.birthPlace}
                          onChange={e => setNewSpouseForm(p => ({ ...p, birthPlace: e.target.value }))}
                          placeholder="VD: Nam Định" className={INPUT_CLASS} />
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>Giới tính</label>
                        <div className="flex gap-2">
                          {(["MALE", "FEMALE"] as Gender[]).map(g => (
                            <button key={g} type="button"
                              onClick={() => setNewSpouseForm(p => ({ ...p, gender: g }))}
                              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${newSpouseForm.gender === g
                                  ? g === "MALE" ? "bg-primary text-secondary border-primary" : "bg-rose-700 text-white border-rose-700"
                                  : "bg-white/5 text-white/50 border-white/10 hover:border-white/20"
                                }`}>{g === "MALE" ? "Nam" : "Nữ"}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          </div>

          {/* ── Actions (Fixed Footer) ── */}
          <div className="shrink-0 flex justify-end gap-3 py-3.5 px-6 border-t border-white/5 bg-[#140C0C]/40">
            <button type="button" onClick={onClose} disabled={isSaving}
              className="px-8 py-2.5 rounded-xl border border-white/10 text-white/50 font-bold text-sm hover:bg-white/5 hover:text-white/70 transition-all duration-200 disabled:opacity-50 cursor-pointer">
              Hủy
            </button>
            <button type="submit"
              disabled={!firstName.trim() || !lastName.trim() || isSaving}
              className="px-8 py-2.5 rounded-xl bg-primary text-secondary font-bold text-sm border border-secondary/40 hover:shadow-[0_8px_24px_rgba(92,30,30,0.5)] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer">
              {isSaving ? (
                <><div className="w-4 h-4 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin" /> Lưu...</>
              ) : (
                <><Save className="w-4 h-4" /> Lưu thay đổi</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
