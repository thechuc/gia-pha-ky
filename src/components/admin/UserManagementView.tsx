"use client";

import { useState } from "react";
import { Search, Filter, UserPlus } from "lucide-react";
import AdminUserTable from "./AdminUserTable";
import UserDetailDrawer from "./UserDetailDrawer";

interface UserManagementViewProps {
  users: any[];
  branches: any[];
  familyId: string;
}

export default function UserManagementView({ users, branches, familyId }: UserManagementViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved">("all");

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "pending") return matchesSearch && !user.isApproved;
    if (filterStatus === "approved") return matchesSearch && user.isApproved;
    return matchesSearch;
  });

  const pendingCount = users.filter(u => !u.isApproved).length;

  return (
    <div className="space-y-6">
      {/* Top Bar / Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm flex flex-col justify-center">
          <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Tổng thành viên</span>
          <div className="text-3xl font-serif font-black text-white">{users.length}</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 backdrop-blur-sm flex flex-col justify-center">
          <span className="text-[10px] uppercase font-black text-amber-500/60 tracking-widest mb-1">Đang chờ duyệt</span>
          <div className="text-3xl font-serif font-black text-amber-400">{pendingCount}</div>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 backdrop-blur-sm flex flex-col justify-center">
          <span className="text-[10px] uppercase font-black text-primary/60 tracking-widest mb-1">Chi / Nhánh</span>
          <div className="text-3xl font-serif font-black text-primary">{branches.length}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tên hoặc email..." 
            className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === "all" ? "bg-primary text-secondary shadow-lg" : "text-slate-500 hover:text-white"}`}
            >
              Tất cả
            </button>
            <button 
              onClick={() => setFilterStatus("pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${filterStatus === "pending" ? "bg-primary text-secondary shadow-lg" : "text-slate-500 hover:text-white"}`}
            >
              Chờ duyệt
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border border-[#0E0808]" />
              )}
            </button>
            <button 
              onClick={() => setFilterStatus("approved")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === "approved" ? "bg-primary text-secondary shadow-lg" : "text-slate-500 hover:text-white"}`}
            >
              Đã duyệt
            </button>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-slate-300 transition-all border border-white/5">
            <Filter className="w-4 h-4" />
            <span>Lọc nâng cao</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <AdminUserTable 
        users={filteredUsers} 
        onSelectUser={handleSelectUser} 
      />

      {/* Drawer */}
      <UserDetailDrawer 
        user={selectedUser}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        branches={branches}
        familyId={familyId}
      />
    </div>
  );
}
