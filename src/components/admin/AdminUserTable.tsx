"use client";

import { motion } from "framer-motion";
import { UserCheck, Clock, Shield, LayoutPanelLeft, MoreHorizontal, Mail, ChevronRight } from "lucide-react";
import { Role } from "@prisma/client";

interface AdminUserTableProps {
  users: any[];
  onSelectUser: (user: any) => void;
}

export default function AdminUserTable({ users, onSelectUser }: AdminUserTableProps) {
  const getRoleBadge = (roles: any[]) => {
    if (!roles || roles.length === 0) return "GUEST";
    return roles[0].role;
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case Role.SUPER_ADMIN:
      case Role.FAMILY_ADMIN:
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case Role.BRANCH_MANAGER:
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case Role.EDITOR:
      case Role.MEMBER:
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Người dùng</th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Trạng thái</th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Cấp bậc</th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Chi / Nhánh</th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <Clock className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Chưa có người dùng nào trong danh sách</p>
                </td>
              </tr>
            ) : (
              users.map((user, index) => {
                const role = getRoleBadge(user.roles);
                const branch = user.roles?.[0]?.branch?.name || "---";
                
                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onSelectUser(user)}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-white/10 text-primary font-bold shadow-inner group-hover:scale-110 transition-transform overflow-hidden">
                          {user.image && user.image.trim() !== "" ? (
                            <img 
                              src={user.image} 
                              alt={user.name} 
                              className="w-full h-full object-cover rounded-xl" 
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  const span = document.createElement("span");
                                  span.innerText = user.name?.[0]?.toUpperCase() || "U";
                                  parent.appendChild(span);
                                }
                              }}
                            />
                          ) : (
                            <span>{user.name?.[0]?.toUpperCase() || "U"}</span>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">{user.name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.isApproved ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          <UserCheck className="w-3 h-3" />
                          Đã phê duyệt
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                          <Clock className="w-3 h-3" />
                          Chờ duyệt
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${getRoleColor(role)}`}>
                        <Shield className="w-3 h-3" />
                        {role}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        {branch !== "---" && <LayoutPanelLeft className="w-3.5 h-3.5 text-slate-500" />}
                        {branch}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
