import { Gender, RelationshipType } from "@prisma/client";

export interface Branch {
  id: string;
  name: string;
  description?: string | null;
  order: number;
}

export interface Relationship {
  id: string;
  familyId: string;
  sourceMemberId: string;
  targetMemberId: string;
  type: RelationshipType;
  sourceMember?: Member;
  targetMember?: Member;
}

export interface Member {
  id: string;
  familyId: string;
  branchId?: string | null;
  branch?: Branch | null;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: Gender;
  dateOfBirth?: Date | string | null;
  birthDay?: number | null;
  birthMonth?: number | null;
  birthYear?: number | null;
  isBirthDateLunar?: boolean;
  
  dateOfDeath?: Date | string | null;
  deathDay?: number | null;
  deathMonth?: number | null;
  deathYear?: number | null;
  isDeathDateLunar?: boolean;
  isAlive: boolean;
  occupation?: string | null;
  birthPlace?: string | null;
  currentLocation?: string | null;
  biography?: string | null;
  avatar?: string | null;
  generation: number;
  birthOrder: number;
  honorific?: string | null;
  alias?: string | null;
  title?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  metadata?: any;
  residencePlace?: string | null;
  branchName?: string | null;
  
  // Relations
  sourceRels?: Relationship[];
  targetRels?: Relationship[];
  
  // UI Helpers
  spouses?: SpouseInfo[];
  childIds?: string[];
  __hasNextPage?: boolean;
}

export interface SpouseInfo {
  id: string;
  fullName: string;
  isAlive: boolean;
  rank: string;
  childCount: number;
}

export interface MemberStats {
  total: number;
  male: number;
  female: number;
  alive: number;
  deceased: number;
  generations: number;
  maxGeneration: number;
}

export interface SimpleMember {
  id: string;
  fullName: string;
  gender: Gender;
  generation: number;
}

export interface MemberFilters {
  search?: string;
  generation?: number;
  gender?: Gender;
  isAlive?: boolean;
  branchId?: string;
  sortBy?: "name" | "generation" | "dateOfBirth" | "createdAt" | "fullName";
  sortOrder?: "asc" | "desc";
}

export interface NewSpouseData {
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth?: string;
  birthPlace?: string;
}

export interface MemberFormData {
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth?: string;
  birthDay?: number;
  birthMonth?: number;
  birthYear?: number;
  isBirthDateLunar?: boolean;
  
  dateOfDeath?: string;
  deathDay?: number;
  deathMonth?: number;
  deathYear?: number;
  isDeathDateLunar?: boolean;
  isAlive: boolean;
  occupation?: string;
  birthPlace?: string;
  currentLocation?: string;
  biography?: string;
  avatar?: string;
  branchId?: string;
  honorific?: string;
  alias?: string;
  title?: string;
  relationshipType?: RelationshipType;
  relatedMemberId?: string;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  newSpouse?: NewSpouseData;
  generation?: number;
  birthOrder?: number;
  branchName?: string;
  metadata?: any;
}

export interface TreeDisplaySettings {
  showAvatar: boolean;
  showDates: boolean;
  showGeneration: boolean;
  showHonorifics: boolean;  // Hiệu/Tự
  showOccupation: boolean;  // Nghề nghiệp/Chức vị
  showSpouses: boolean;
  showBranch: boolean;
}

export interface RelChanges {
  toAdd: Array<{ type: "PARENT_CHILD" | "SPOUSE"; relatedMemberId: string; role: "source" | "target" }>;
  toRemove: string[];
  newSpouse: NewSpouseData | null;
}

