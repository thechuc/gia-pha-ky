"use client";

import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import { useMemo } from "react";

const EMPTY_ROLES: any[] = [];

export interface UserPermissions {
  canApprove: boolean;       
  canEditGlobal: boolean;    
  canEditFamily: boolean;    
  canEditEvents: boolean;    
  canEditDocuments: boolean; 
  isBranchManager: boolean;  
  userRoles: any[];          
  isLoading: boolean;
}

export function useUserPermissions(): UserPermissions {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  return useMemo(() => {
    if (!session?.user) {
      return {
        canApprove: false,
        canEditGlobal: false,
        canEditFamily: false,
        canEditEvents: false,
        canEditDocuments: false,
        isBranchManager: false,
        userRoles: EMPTY_ROLES,
        isLoading,
      };
    }

    // @ts-ignore
    const userRoles = session.user.roles || EMPTY_ROLES;
    
    const isSuperAdmin = userRoles.some((r: any) => r.role === Role.SUPER_ADMIN);
    const isFamilyAdmin = userRoles.some((r: any) => r.role === Role.FAMILY_ADMIN);
    const isEditor = userRoles.some((r: any) => r.role === Role.EDITOR);
    const hasBranchRole = userRoles.some((r: any) => r.branchId !== null);

    const canEditGlobal = isSuperAdmin || isFamilyAdmin || isEditor;

    return {
      canApprove: isSuperAdmin || isFamilyAdmin,
      canEditGlobal,
      canEditFamily: canEditGlobal,
      canEditEvents: canEditGlobal,
      canEditDocuments: canEditGlobal,
      isBranchManager: hasBranchRole,
      userRoles,
      isLoading,
    };
  }, [session, isLoading]);
}

export function useCanEditMember(memberBranchId: string | null) {
  const perms = useUserPermissions();
  if (perms.isLoading) return false;
  if (perms.canEditGlobal) return true;

  if (memberBranchId) {
    return perms.userRoles.some((r: any) => r.branchId === memberBranchId);
  }

  return false;
}
