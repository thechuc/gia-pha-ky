import React from "react";
import {
  TreeDeciduous,
  Baby,
  Star,
  Flag,
  Crown,
  Flame,
  Gem,
  Globe,
  HandHeart,
  Home,
  Library,
  Lightbulb,
  Medal,
  Music,
  Pen,
  Ribbon,
  Shield,
  Sprout,
  Sun,
  Telescope,
  Trophy,
  Wheat,
  Building2,
  BookMarked,
  Camera,
  Feather,
  Map,
  Newspaper,
  PenTool,
  Palette,
  FileText,
  FileArchive,
  Image as ImageIcon,
  AlignLeft,
  Paperclip,
  Calendar,
  Landmark,
  GraduationCap,
  Award,
  Scroll,
  Heart,
  BookOpen,
  Swords,
  type LucideIcon,
} from "lucide-react";

export const ICON_REGISTRY: Record<string, LucideIcon> = {
  Landmark, GraduationCap, Award, Scroll, Heart, BookOpen, Swords,
  TreeDeciduous, Baby, Star, Flag, Crown, Flame, Gem, Globe,
  HandHeart, Home, Library, Lightbulb, Medal, Music, Pen, Ribbon,
  Shield, Sprout, Sun, Telescope, Trophy, Wheat, Building2,
  BookMarked, Camera, Feather, Map, Newspaper, PenTool, Palette,
  FileText, FileArchive, ImageIcon, AlignLeft, Paperclip, Calendar,
};

export const ICON_GRID_ITEMS = Object.keys(ICON_REGISTRY);

export function RenderIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = ICON_REGISTRY[name];
  if (!IconComponent) return <Star className={className} />;
  return <IconComponent className={className} />;
}
