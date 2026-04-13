export interface FamilyEvent {
  id?: string;
  date: string;
  isoDate?: string;
  era: string;
  title: string;
  description: string;
  iconName: string;
  type: string;
  media?: any[];
}

export interface DocumentFile {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface FamilyDocument {
  id?: string;
  name?: string;
  title: string;
  type: string;
  year: number;
  description: string;
  iconName: string;
  color: string;
  createdAt?: string | Date;
  files?: DocumentFile[];
  url?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
}

export interface FamilyInfo {
  id: string;
  name: string;
  motto: string;
  origin: string;
  description: string;
  totalGenerations: number;
  totalMembers: number;
}

export interface OverviewData {
  family: {
    id: string;
    name: string;
    motto: string | null;
    origin: string | null;
    description: string | null;
  };
  events: FamilyEvent[];
  documents: any[];
  totalMembers: number;
  totalGenerations: number;
}
