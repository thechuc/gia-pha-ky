"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  UserPlus,
  Calendar,
  MapPin,
  Briefcase,
  BookOpen,
  ChevronDown,
  Link2,
  ImageIcon,
  Search,
  UserCheck,
  Plus,
  Users,
  Heart,
} from "lucide-react";
import type { Gender } from "@prisma/client";
import { SimpleMember, Branch } from "@/types/member";
import { FlexibleDateInput } from "./FlexibleDateInput";



interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => Promise<void>;
  branches: Branch[];
  existingMembers: SimpleMember[];
  maxGeneration: number;
  initialFatherId?: string;
  initialGeneration?: number;
  initialRelType?: "" | "PARENT_CHILD" | "SPOUSE";
  initialMotherId?: string;
  initialSpouseId?: string;
  initialBranchName?: string;
  initialGender?: Gender;
  initialLastName?: string;
}

// ─── Shared Dark Input Styles ───────────────────────────────────────────────
const INPUT_CLASS =
  "w-full px-3 py-2.5 rounded-xl border border-white/10 bg-[#140C0C] text-[#E2D1B0] text-sm placeholder-white/20 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all";

const LABEL_CLASS =
  "text-[10px] font-black text-secondary/50 uppercase tracking-[0.18em] mb-1.5 flex items-center gap-1";

const SELECT_CLASS =
  "w-full appearance-none px-3 py-2.5 pr-9 rounded-xl border border-white/10 bg-[#140C0C] text-[#E2D1B0] text-sm focus:outline-none focus:border-secondary cursor-pointer transition-all";

// ─── Inline spouse mini-form fields ─────────────────────────────────────────
interface NewSpouseFormData {
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

// ─── Main Component ──────────────────────────────────────────────────────────
export function AddMemberModal({
  isOpen,
  onClose,
  onAdd,
  branches,
  existingMembers,
  maxGeneration,
  initialFatherId,
  initialGeneration,
  initialRelType,
  initialMotherId,
  initialSpouseId,
  initialBranchName,
  initialGender,
  initialLastName,
}: AddMemberModalProps) {
  // ── Basic Info ──
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState(initialLastName || "Ngô");
  const [gender, setGender] = useState<Gender>(initialGender || "MALE");
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
  const [honorific, setHonorific] = useState("");
  const [alias, setAlias] = useState("");
  const [title, setTitle] = useState("");
  const [generation, setGeneration] = useState<number>(initialGeneration || 1);

  // ── Relationship ──
  const [relType, setRelType] = useState<"" | "PARENT_CHILD" | "SPOUSE">("");
  // Parent links
  const [fatherId, setFatherId] = useState(initialFatherId || "");
  const [motherId, setMotherId] = useState(initialMotherId || "");
  // Spouse
  const [spouseMode, setSpouseMode] = useState<"select" | "create">("select");
  const [spouseSearch, setSpouseSearch] = useState("");
  const [spouseId, setSpouseId] = useState("");
  const [newSpouse, setNewSpouse] = useState<NewSpouseFormData>({
    firstName: "", lastName: "", gender: gender === "MALE" ? "FEMALE" : "MALE",
    dateOfBirth: "", birthPlace: "", isBirthDateLunar: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // All members for parent filter (any generation older than this member — server auto-calcs)
  const males = useMemo(() => existingMembers.filter(m => m.gender === "MALE"), [existingMembers]);
  const females = useMemo(() => existingMembers.filter(m => m.gender === "FEMALE"), [existingMembers]);
  const spouseCandidates = useMemo(() => {
    const expectedGender = gender === "MALE" ? "FEMALE" : "MALE";
    const filtered = existingMembers.filter(m =>
      m.gender === expectedGender &&
      (spouseSearch === "" || m.fullName.toLowerCase().includes(spouseSearch.toLowerCase()))
    );

    // Sort: if person is the selected spouseId, move to top
    if (spouseId) {
      return [...filtered].sort((a, b) => {
        if (a.id === spouseId) return -1;
        if (b.id === spouseId) return 1;
        return 0;
      });
    }
    return filtered;
  }, [existingMembers, gender, spouseSearch, spouseId]);

  React.useEffect(() => {
    if (isOpen) {
      // Reset or set based on initial props
      setRelType(initialRelType || (initialFatherId || initialMotherId ? "PARENT_CHILD" : ""));
      setFatherId(initialFatherId || "");
      setMotherId(initialMotherId || "");
      setSpouseId(initialSpouseId || "");
      setBranchName(initialBranchName || "");
      setGender(initialGender || "MALE");
      setLastName(initialLastName || "Ngô");
      setGeneration(initialGeneration || 1);
      
      // Reset other states that might persist
      setFirstName("");
      setSpouseSearch("");
    }
  }, [
    isOpen, 
    initialFatherId, 
    initialRelType, 
    initialMotherId, 
    initialSpouseId, 
    initialBranchName, 
    initialGender, 
    initialLastName,
    initialGeneration
  ]);

  // Auto-update generation when relationships change
  React.useEffect(() => {
    if (relType === "PARENT_CHILD") {
      const pId = fatherId || motherId;
      if (pId) {
        const parent = existingMembers.find(m => m.id === pId);
        if (parent) setGeneration(parent.generation + 1);
      }
    } else if (relType === "SPOUSE") {
      if (spouseId) {
        const spouse = existingMembers.find(m => m.id === spouseId);
        if (spouse) setGeneration(spouse.generation);
      }
    }
  }, [relType, fatherId, motherId, spouseId, existingMembers]);

  if (!isOpen) return null;

  const resetForm = () => {
    setFirstName(""); setLastName(""); setGender("MALE");
    setDateOfBirth(""); setBirthDay(undefined); setBirthMonth(undefined); setBirthYear(undefined); setIsBirthDateLunar(false);
    setDateOfDeath(""); setDeathDay(undefined); setDeathMonth(undefined); setDeathYear(undefined); setIsDeathDateLunar(false);
    setIsAlive(true);
    setOccupation(""); setBirthPlace(""); setCurrentLocation(""); setBiography("");
    setBranchName(""); setAvatar("");
    setHonorific(""); setAlias(""); setTitle("");
    setRelType(""); setFatherId(""); setMotherId("");
    setSpouseMode("select"); setSpouseSearch(""); setSpouseId("");
    setNewSpouse({ firstName: "", lastName: "", gender: "FEMALE", dateOfBirth: "", birthPlace: "", isBirthDateLunar: false });
  };

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
    if (!firstName.trim() || !lastName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload: any = {
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
      };

      if (relType === "PARENT_CHILD") {
        if (fatherId) payload.fatherId = fatherId;
        if (motherId) payload.motherId = motherId;
      } else if (relType === "SPOUSE") {
        if (spouseMode === "select" && spouseId) {
          payload.spouseId = spouseId;
        } else if (spouseMode === "create" && newSpouse.firstName && newSpouse.lastName) {
          payload.newSpouse = {
            firstName: newSpouse.firstName.trim(),
            lastName: newSpouse.lastName.trim(),
            gender: newSpouse.gender,
            dateOfBirth: newSpouse.dateOfBirth || undefined,
            birthDay: newSpouse.birthDay,
            birthMonth: newSpouse.birthMonth,
            birthYear: newSpouse.birthYear,
            isBirthDateLunar: newSpouse.isBirthDateLunar,
            birthPlace: newSpouse.birthPlace || undefined,
          };
        }
      }

      await onAdd(payload);
      resetForm();
      onClose();
    } catch (err) { console.error("Failed to add member:", err); }
    finally { setIsSubmitting(false); }
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
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-secondary text-lg">Thêm Thành Viên</h3>
              <p className="text-[11px] text-secondary/40">Ghi nhận thêm một người vào gia phả</p>
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
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }}
                  className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Họ *</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                  placeholder="Ngô" className={INPUT_CLASS} required />
              </div>
              <div>
                <label className={LABEL_CLASS}>Tên đệm & Tên *</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                  placeholder="Văn Hải" className={INPUT_CLASS} required />
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

          {/* ── Gender & Alive ── */}
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
            <p className="text-[10px] text-white/20 mt-1 italic">Tự động tính toán dựa trên quan hệ nếu có</p>
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
          {/* ── Relationship Section (Smart) ── */}
          {/* ════════════════════════════════════════════════ */}
          <div className="border-t border-secondary/10 pt-5 space-y-4">
            <label className="text-[10px] font-black text-secondary/50 uppercase tracking-[0.18em] flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5 text-secondary/40" />
              Liên kết quan hệ
              <span className="text-white/15 font-normal normal-case tracking-normal">(tuỳ chọn)</span>
            </label>

            {/* Type selector */}
            <div className="flex gap-2">
              {[
                { val: "", label: "Không liên kết", icon: null },
                { val: "PARENT_CHILD", label: "Con của...", icon: <Users className="w-3.5 h-3.5" /> },
                { val: "SPOUSE", label: "Vợ / Chồng của...", icon: <Heart className="w-3.5 h-3.5" /> },
              ].map(opt => (
                <button key={opt.val} type="button"
                  onClick={() => { setRelType(opt.val as any); }}
                  className={`flex-1 py-2 px-2 rounded-xl text-[11px] font-bold border transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${relType === opt.val
                    ? "bg-secondary/20 text-secondary border-secondary/40"
                    : "bg-white/5 text-white/40 border-white/10 hover:border-white/20 hover:text-white/60"
                    }`}>
                  {opt.icon}{opt.label}
                </button>
              ))}
            </div>

            {/* ── PARENT_CHILD: Father + Mother ── */}
            {relType === "PARENT_CHILD" && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-[#140C0C]/60 rounded-2xl border border-white/5">
                {/* Father */}
                <div>
                  <label className={LABEL_CLASS}>
                    <span className="text-sky-400">♂</span> Cha (Bố)
                  </label>
                  <div className="relative">
                    <select value={fatherId} onChange={e => setFatherId(e.target.value)} className={SELECT_CLASS}>
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

                {/* Mother */}
                <div>
                  <label className={LABEL_CLASS}>
                    <span className="text-rose-400">♀</span> Mẹ
                  </label>
                  <div className="relative">
                    <select value={motherId} onChange={e => setMotherId(e.target.value)} className={SELECT_CLASS}>
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

                {(fatherId || motherId) && (
                  <p className="col-span-2 text-[10px] text-secondary/50 italic flex items-center gap-1.5">
                    <UserCheck className="w-3 h-3 text-secondary/40" />
                    Thành viên mới sẽ được liên kết là con của người được chọn
                  </p>
                )}
              </div>
            )}

            {/* ── SPOUSE: Select existing OR create new ── */}
            {relType === "SPOUSE" && (
              <div className="p-4 bg-[#140C0C]/60 rounded-2xl border border-white/5 space-y-3">
                {/* Mode toggle */}
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setSpouseMode("select"); setSpouseId(""); }}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${spouseMode === "select"
                      ? "bg-secondary/15 text-secondary border-secondary/30"
                      : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"
                      }`}>
                    <UserCheck className="w-3.5 h-3.5" />
                    Chọn từ danh sách
                  </button>
                  <button type="button" onClick={() => { setSpouseMode("create"); setSpouseId(""); }}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${spouseMode === "create"
                      ? "bg-secondary/15 text-secondary border-secondary/30"
                      : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"
                      }`}>
                    <Plus className="w-3.5 h-3.5" />
                    Thêm vợ/chồng mới
                  </button>
                </div>

                {/* Select from existing */}
                {spouseMode === "select" && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none" />
                      <input type="text" value={spouseSearch} onChange={e => setSpouseSearch(e.target.value)}
                        placeholder={`Tìm ${gender === "MALE" ? "vợ" : "chồng"} trong danh sách...`}
                        className={`${INPUT_CLASS} pl-9`} />
                    </div>

                    {spouseCandidates.length === 0 ? (
                      <div className="text-center py-4 space-y-2">
                        <p className="text-[11px] text-white/30 italic">
                          {spouseSearch ? `Không tìm thấy "${spouseSearch}"` : `Chưa có ${gender === "MALE" ? "thành viên nữ" : "thành viên nam"} trong hệ thống`}
                        </p>
                        <button type="button" onClick={() => { setSpouseMode("create"); setNewSpouse(p => ({ ...p, firstName: spouseSearch, gender: gender === "MALE" ? "FEMALE" : "MALE", isBirthDateLunar: false })); }}
                          className="text-[11px] text-secondary/60 hover:text-secondary underline underline-offset-2 cursor-pointer transition-colors">
                          + Thêm {gender === "MALE" ? "vợ" : "chồng"} mới
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                        {spouseCandidates.map(m => (
                          <button key={m.id} type="button" onClick={() => setSpouseId(m.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer text-left ${spouseId === m.id
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
                            {spouseId === m.id && <UserCheck className="w-3.5 h-3.5 text-secondary shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Create new spouse inline */}
                {spouseMode === "create" && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-secondary/50 italic">
                      Điền thông tin {gender === "MALE" ? "vợ" : "chồng"} — sẽ được thêm vào gia phả đồng thời
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={LABEL_CLASS}>Họ *</label>
                        <input type="text" value={newSpouse.lastName} onChange={e => setNewSpouse(p => ({ ...p, lastName: e.target.value }))}
                          placeholder="Ngô" className={INPUT_CLASS} />
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>Tên đệm & Tên *</label>
                        <input type="text" value={newSpouse.firstName} onChange={e => setNewSpouse(p => ({ ...p, firstName: e.target.value }))}
                          placeholder="Thị Hoa" className={INPUT_CLASS} />
                      </div>
                    </div>
                    <div className="col-span-2">
                       <FlexibleDateInput
                        label="Ngày sinh"
                        standardDate={newSpouse.dateOfBirth}
                        day={newSpouse.birthDay}
                        month={newSpouse.birthMonth}
                        year={newSpouse.birthYear}
                        isLunar={newSpouse.isBirthDateLunar}
                        onChange={(d) => setNewSpouse(p => ({ 
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
                      <input type="text" value={newSpouse.birthPlace} onChange={e => setNewSpouse(p => ({ ...p, birthPlace: e.target.value }))}
                        placeholder="VD: Nam Định" className={INPUT_CLASS} />
                    </div>
                    {/* Gender of spouse */}
                    <div>
                      <label className={LABEL_CLASS}>Giới tính</label>
                      <div className="flex gap-2">
                        {(["MALE", "FEMALE"] as Gender[]).map(g => (
                          <button key={g} type="button" onClick={() => setNewSpouse(p => ({ ...p, gender: g }))}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${newSpouse.gender === g
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
          
          {/* ── Actions (Fixed Footer) ── */}
          <div className="shrink-0 flex justify-end gap-3 py-3.5 px-6 border-t border-white/5 bg-[#140C0C]/40">
            <button type="button" onClick={onClose} disabled={isSubmitting}
              className="px-8 py-2.5 rounded-xl border border-white/10 text-white/50 font-bold text-sm hover:bg-white/5 hover:text-white/70 transition-all duration-200 disabled:opacity-50 cursor-pointer">
              Hủy
            </button>
            <button type="submit"
              disabled={!firstName.trim() || !lastName.trim() || isSubmitting}
              className="px-8 py-2.5 rounded-xl bg-primary text-secondary font-bold text-sm border border-secondary/40 hover:shadow-[0_8px_24px_rgba(92,30,30,0.5)] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer">
              {isSubmitting ? (
                <><div className="w-4 h-4 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin" /> Lưu...</>
              ) : (
                <><UserPlus className="w-4 h-4" /> Thêm mới</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
