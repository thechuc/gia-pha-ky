"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Crown,
  TreeDeciduous,
  Plus,
  Database,
  UserPlus,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import {
  getMembers,
  getMemberStats,
  getBranches,
  getAllMembersSimple,
  addMember,
  updateMember,
  deleteMember,
  getMemberById,
  addMemberRelationship,
  removeRelationship,
  addNewSpouseAndLink,
} from "@/app/actions/members";
import { MemberFilters, type FilterState } from "./MemberFilters";
import { MemberCard } from "./MemberCard";
import { MemberListItem } from "./MemberListItem";
import { AddMemberModal } from "./AddMemberModal";
import { EditMemberModal } from "./EditMemberModal";
import { DeleteMemberDialog } from "./DeleteMemberDialog";
import { Member, Branch, SimpleMember, MemberStats } from "@/types/member";
import { DashboardHeader } from "@/components/dashboard/DashboardLayout";

interface Stats {
  total: number;
  male: number;
  female: number;
  alive: number;
  deceased: number;
  generations: number;
  maxGeneration: number;
}

export function MembersPage() {
  const router = useRouter();
  const { canEditGlobal, userRoles } = useUserPermissions();

  // Data state
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [simpleMembersList, setSimpleMembersList] = useState<SimpleMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    gender: null,
    isAlive: null,
    branchId: null,
    generation: null,
    sortBy: "generation",
    sortOrder: "asc",
  });

  // Modal/Panel state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);

  // ─── Data Fetching ───
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [membersData, statsData, branchesData, simpleMembers] = await Promise.all([
        getMembers(),
        getMemberStats(),
        getBranches(),
        getAllMembersSimple(),
      ]);
      setAllMembers(membersData as Member[]);
      setStats(statsData as MemberStats);
      setBranches(branchesData as Branch[]);
      setSimpleMembersList(simpleMembers as SimpleMember[]);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ─── Client-side Filtering ───
  const filteredMembers = useMemo(() => {
    let result = [...allMembers];

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.occupation?.toLowerCase().includes(q) ||
          m.birthPlace?.toLowerCase().includes(q)
      );
    }

    // Filters
    if (filters.gender !== null) {
      result = result.filter((m) => m.gender === filters.gender);
    }
    if (filters.isAlive !== null) {
      result = result.filter((m) => m.isAlive === filters.isAlive);
    }
    if (filters.branchId !== null) {
      result = result.filter((m) => m.branchId === filters.branchId);
    }
    if (filters.generation !== null) {
      result = result.filter((m) => m.generation === filters.generation);
    }

    // Sort
    const sortKey = (filters.sortBy === "name" ? "fullName" : filters.sortBy) as keyof Member;
    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        const cmp = aVal.localeCompare(bVal);
        return filters.sortOrder === "asc" ? cmp : -cmp;
      }
      
      const numA = Number(aVal) || 0;
      const numB = Number(bVal) || 0;
      const cmp = numA - numB;
      return filters.sortOrder === "asc" ? cmp : -cmp;
    });

    return result;
  }, [allMembers, filters]);

  // ─── Permission Checks ───
  const checkCanEdit = useCallback((member: Member) => {
    if (canEditGlobal) return true;
    return userRoles.some((r: any) => {
      if (r.role === Role.BRANCH_MANAGER && r.branchId === member.branchId) return true;
      if (r.role === Role.MEMBER && r.branchId === member.branchId) return true;
      return false;
    });
  }, [canEditGlobal, userRoles]);

  const canAddGlobally = useMemo(() => {
    return canEditGlobal || userRoles.some((r: any) => 
      r.role === Role.BRANCH_MANAGER || r.role === Role.MEMBER
    );
  }, [canEditGlobal, userRoles]);

  // ─── Handlers ───
  const handleAddMember = async (data: any) => {
    await addMember(data);
    await fetchAll();
  };

  const handleEditClick = async (id: string) => {
    const member = await getMemberById(id);
    if (member) {
      setEditMember(member as Member);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveMember = async (id: string, data: any, relChanges?: any) => {
    await updateMember(id, data);
    if (relChanges) {
      // Add new relationships
      for (const rel of (relChanges.toAdd || [])) {
        await addMemberRelationship(id, rel.relatedMemberId, rel.type, rel.role);
      }
      // Remove relationships
      for (const relId of (relChanges.toRemove || [])) {
        await removeRelationship(relId);
      }
      // Create new spouse and link
      if (relChanges.newSpouse) {
        await addNewSpouseAndLink(id, relChanges.newSpouse);
      }
    }
    await fetchAll();
  };

  const handleDeleteClick = (id: string) => {
    const member = allMembers.find((m) => m.id === id);
    if (member) setDeletingMember(member);
  };

  const handleDeleteConfirm = async (id: string) => {
    await deleteMember(id);
    setIsEditModalOpen(false);
    setEditMember(null);
    await fetchAll();
  };

  const handleViewTree = (id: string) => {
    const member = allMembers.find((m) => m.id === id);
    if (member) {
      // Navigate to the main tree dashboard with a memberId param for focusing/highlighting
      router.push(`/dashboard/tree?memberId=${member.id}`);
    } else {
      router.push("/dashboard/tree");
    }
  };

  // ─── Main Render ───
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50/30 overflow-hidden">
      <DashboardHeader title="Quản Lý Thành Viên" />

      {/* Dynamic Content */}
      <div className="flex-1 overflow-y-auto pb-12">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <span className="text-sm text-foreground/40 font-medium font-serif italic tracking-wide">Đang tải di sản dòng tộc...</span>
            </div>
          </div>
        ) : allMembers.length === 0 ? (
          <div className="h-full flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white p-10 rounded-3xl border border-border shadow-2xl text-center">
              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 text-primary border border-primary/10">
                <Users className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-foreground mb-4">Chưa có thành viên</h2>
              <p className="text-foreground/60 mb-8 leading-relaxed italic">
                Hệ thống chưa có dữ liệu. Hãy bắt đầu xây dựng gia phả bằng cách thêm thành viên đầu tiên.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="w-full bg-primary text-secondary font-bold py-4 rounded-2xl hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-[0.98] flex items-center justify-center gap-3 border border-secondary/20 shadow-lg"
              >
                <UserPlus className="w-5 h-5" />
                Thêm thành viên đầu tiên
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
            {/* Statistics Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: "Tổng thành viên", value: stats.total, suffix: "người", icon: <Users className="w-5 h-5" />,
                    gradient: "from-primary to-primary/80", textColor: "text-secondary", subTextColor: "text-secondary/50",
                  },
                  {
                    label: "Số thế hệ", value: stats.maxGeneration, suffix: "đời", icon: <Crown className="w-5 h-5" />,
                    gradient: "from-amber-600 to-amber-700", textColor: "text-amber-100", subTextColor: "text-amber-200/50",
                  },
                  {
                    label: "Còn sống", value: stats.alive, suffix: "người", icon: <UserCheck className="w-5 h-5" />,
                    gradient: "from-emerald-600 to-emerald-700", textColor: "text-emerald-100", subTextColor: "text-emerald-200/50",
                  },
                  {
                    label: "Đã khuất", value: stats.deceased, suffix: "người", icon: <UserX className="w-5 h-5" />,
                    gradient: "from-slate-600 to-slate-700", textColor: "text-slate-200", subTextColor: "text-slate-300/50",
                  },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className={`bg-gradient-to-br ${stat.gradient} py-3 px-5 rounded-2xl shadow-lg hover:-translate-y-1 transition-transform duration-300`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${stat.subTextColor}`}>{stat.label}</p>
                      <div className={`${stat.textColor} opacity-70`}>{stat.icon}</div>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className={`text-2xl font-serif font-bold ${stat.textColor}`}>{stat.value}</span>
                      <span className={`text-[10px] pb-1 ${stat.subTextColor}`}>{stat.suffix}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Filters (Sticky) */}
            <div className="sticky top-0 z-20 -mx-6 px-6 py-2 bg-gray-50/80 backdrop-blur-md transition-all duration-300">
              <div className="bg-white py-3 px-5 rounded-2xl border border-border shadow-md">
                <MemberFilters
                  filters={filters} onFiltersChange={setFilters} viewMode={viewMode} onViewModeChange={setViewMode}
                  maxGeneration={stats?.maxGeneration || 11} branches={branches} totalResults={filteredMembers.length}
                  onAddClick={canAddGlobally ? () => setIsAddModalOpen(true) : undefined}
                />
              </div>
            </div>

            {/* Members Grid/List */}
            {filteredMembers.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-border">
                <Database className="w-10 h-10 text-foreground/10 mx-auto mb-4" />
                <p className="text-foreground/40 font-medium">Không tìm thấy thành viên nào phù hợp</p>
                <p className="text-foreground/30 text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="space-y-12">
                {Object.entries(
                  filteredMembers.reduce((group, member) => {
                    const gen = member.generation || 1;
                    const bId = member.branchId || "unassigned";
                    if (!group[gen]) group[gen] = {};
                    if (!group[gen][bId]) group[gen][bId] = [];
                    group[gen][bId].push(member);
                    return group;
                  }, {} as Record<number, Record<string, Member[]>>)
                )
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([gen, branchesDict]) => (
                    <div key={gen} className="space-y-6">
                      {/* Generation Header */}
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-border/60" />
                        <h3 className="text-xl font-serif font-bold text-foreground/80 whitespace-nowrap">
                          Đời thứ {gen}
                        </h3>
                        <div className="h-px flex-1 bg-border/60" />
                      </div>
                      
                      {/* Nhóm theo Branch */}
                      <div className="space-y-8">
                        {Object.entries(branchesDict as Record<string, Member[]>).map(([bId, members]) => {
                          const isUnassigned = bId === "unassigned";
                          const branchName = isUnassigned
                            ? ""
                            : branches.find((b) => b.id === bId)?.name || "Nhánh nội bộ";

                          return (
                            <div key={bId} className="space-y-4 relative">
                              {/* Branch Header - ONLY SHOW IF ASSIGNED */}
                              {!isUnassigned && (
                                <div className="flex items-center gap-2 pl-1 mb-2">
                                  <TreeDeciduous className="w-4 h-4 text-primary/60" />
                                  <h4 className="text-[13px] font-bold uppercase tracking-wider text-primary/70">
                                    {branchName}
                                  </h4>
                                  <div className="ml-2 h-px flex-1 bg-border/40 border-dashed border-b" />
                                </div>
                              )}

                              {/* Grid for this branch */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {members.map((member, index) => (
                                  <MemberCard
                                    key={member.id} member={member} index={index} 
                                    onEdit={handleEditClick}
                                    onDelete={handleDeleteClick} 
                                    onViewTree={handleViewTree}
                                    branchName={branchName}
                                    canEdit={checkCanEdit(member)}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="space-y-12">
                {Object.entries(
                  filteredMembers.reduce((group, member) => {
                    const gen = member.generation || 1;
                    const bId = member.branchId || "unassigned";
                    if (!group[gen]) group[gen] = {};
                    if (!group[gen][bId]) group[gen][bId] = [];
                    group[gen][bId].push(member);
                    return group;
                  }, {} as Record<number, Record<string, Member[]>>)
                )
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([gen, branchesDict]) => (
                    <div key={gen} className="space-y-6">
                      {/* Generation Header */}
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-border/60" />
                        <h3 className="text-xl font-serif font-bold text-foreground/80 whitespace-nowrap">
                          Đời thứ {gen}
                        </h3>
                        <div className="h-px flex-1 bg-border/60" />
                      </div>

                      {/* Nhóm theo Branch */}
                      <div className="space-y-6">
                        {Object.entries(branchesDict as Record<string, Member[]>).map(([bId, members]) => {
                          const isUnassigned = bId === "unassigned";
                          const branchName = isUnassigned
                            ? ""
                            : branches.find((b) => b.id === bId)?.name || "Nhánh nội bộ";

                          return (
                            <div key={bId} className="space-y-3">
                              {/* Branch Header - ONLY SHOW IF ASSIGNED */}
                              {!isUnassigned && (
                                <div className="flex items-center gap-2 pl-2 mb-2">
                                  <TreeDeciduous className="w-4 h-4 text-primary/60" />
                                  <h4 className="text-[13px] font-bold uppercase tracking-wider text-primary/70">
                                    {branchName}
                                  </h4>
                                </div>
                              )}

                              {/* List for this branch */}
                              <div className="space-y-2">
                                {members.map((member, index) => (
                                  <MemberListItem
                                    key={member.id} member={member} index={index} 
                                    onEdit={handleEditClick}
                                    onDelete={handleDeleteClick} 
                                    onViewTree={handleViewTree}
                                    branchName={branchName}
                                    canEdit={checkCanEdit(member)}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddMember}
        branches={branches}
        existingMembers={simpleMembersList}
        maxGeneration={stats?.maxGeneration || 11}
      />

      <EditMemberModal
        member={editMember}
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditMember(null); }}
        onSave={handleSaveMember}
        branches={branches}
        maxGeneration={stats?.maxGeneration || 11}
        existingMembers={simpleMembersList}
      />

      <DeleteMemberDialog
        isOpen={!!deletingMember}
        member={deletingMember}
        onClose={() => setDeletingMember(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
