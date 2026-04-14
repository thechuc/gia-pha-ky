"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { 
  Network, ZoomIn, ZoomOut, Maximize2, Download, Loader2, FileImage, GripHorizontal, Settings2, X, ChevronDown, RotateCw, Move, Layout
} from "lucide-react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  useReactFlow,
  MiniMap,
  useViewport,
  useNodes,
  getViewportForBounds,
  getNodesBounds,
  Panel,
} from "@xyflow/react";
import { motion } from "framer-motion";
import { useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import "@xyflow/react/dist/style.css";
import { useUserPermissions } from "@/hooks/useUserPermissions";

// Tự build: Node & Edge tùy chỉnh
import { FamilyNode } from "./Flow/FamilyNode";
import { BusEdge } from "./Flow/BusEdge";
import { useFamilyTreeLayout, parseMembers, type TreeMember } from "./Flow/useFamilyTreeLayout";
import { type TreeDisplaySettings } from "@/types/member";
import { findKinshipNodes, calculateVietnameseKinship } from "./Flow/kinshipUtils";
import { KinshipTooltip } from "./Flow/KinshipTooltip";
import { PersonDetailsModal } from "./PersonDetailsModal";
import { useToast } from "../ui/Toast";
import { AddMemberModal } from "../members/AddMemberModal";
import { EditMemberModal } from "../members/EditMemberModal";
import { DeleteMemberDialog } from "../members/DeleteMemberDialog";
import { getMembers, getBranches, getAllMembersSimple, addMember, updateMember, deleteMember, swapSiblingOrder } from "@/app/actions/members";
import { getUserPreferencesAction, updateUserPreferencesAction } from "@/app/actions/settings";
import { Member, Branch, SimpleMember } from "@/types/member";

// ----------------------------------------------------------------------------
// React Flow Config
// ----------------------------------------------------------------------------
// nodeTypes and edgeTypes are defined outside for stability
const NODE_TYPES = {
  familyNode: FamilyNode,
};

const EDGE_TYPES = {
  busEdge: BusEdge,
};

// ----------------------------------------------------------------------------
// Custom Controls Overlay
// ----------------------------------------------------------------------------
interface ControlsProps {
  setForceExpandAll: (v: boolean) => void;
  setIsExportMode: (v: boolean) => void;
  toolbarConfig: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; orientation: 'vertical' | 'horizontal' };
  setToolbarConfig: (v: any) => void;
  layoutDirection: 'TB' | 'LR';
  setLayoutDirection: (v: 'TB' | 'LR') => void;
  hasHidden: boolean;
  onResetHidden: () => void;
  displaySettings: TreeDisplaySettings;
  setDisplaySettings: (v: TreeDisplaySettings) => void;
  handleUpdateDisplaySettings: (v: TreeDisplaySettings) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const CustomControls = ({ 
  setForceExpandAll,
  setIsExportMode,
  toolbarConfig,
  setToolbarConfig,
  layoutDirection,
  setLayoutDirection,
  hasHidden,
  onResetHidden,
  displaySettings,
  setDisplaySettings,
  handleUpdateDisplaySettings,
  containerRef
}: ControlsProps) => {
  const { fitView, zoomIn, zoomOut, getNodes } = useReactFlow();
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingSvg, setIsExportingSvg] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // DRAG & SNAP LOGIC
  const [dragPreview, setDragPreview] = useState<any>(null);

  const handleDrag = (e: any, info: any) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Get mouse position relative to tree container
    const x = info.point.x - rect.left;
    const y = info.point.y - rect.top;
    const w = rect.width;
    const h = rect.height;

    const isLeft = x < w * 0.4;
    const isRight = x > w * 0.6;
    const isTop = y < h * 0.4;
    const isBottom = y > h * 0.6;

    let pos: any = toolbarConfig.position;
    let ori: any = toolbarConfig.orientation;

    if (isTop && isLeft) pos = 'top-left';
    else if (isTop && isRight) pos = 'top-right';
    else if (isBottom && isLeft) pos = 'bottom-left';
    else if (isBottom && isRight) pos = 'bottom-right';

    // Auto-Rotate logic
    const distToSide = Math.min(x, w - x);
    const distToTopBottom = Math.min(y, h - y);
    ori = distToSide < distToTopBottom ? 'vertical' : 'horizontal';

    setDragPreview({ position: pos, orientation: ori });
  };

  const handleDragEnd = () => {
    if (dragPreview) {
      setToolbarConfig(dragPreview);
      setDragPreview(null);
    }
  };

  // Definitive Download Helper: Utilizes native Form POST to bypass Blob URL anonymization
  const triggerDownload = (dataUrl: string, fileName: string) => {
    try {
      const contentType = fileName.endsWith('.pdf') ? 'application/pdf' : 'image/svg+xml';
      
      // Creating a hidden form to submit data to the server proxy
      // This is the ONLY 100% robust way to force filename recognition in Windows browsers
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/download';
      form.style.display = 'none';

      const dataInput = document.createElement('input');
      dataInput.type = 'hidden';
      dataInput.name = 'fileData';
      dataInput.value = dataUrl;
      form.appendChild(dataInput);

      const nameInput = document.createElement('input');
      nameInput.type = 'hidden';
      nameInput.name = 'fileName';
      nameInput.value = fileName;
      form.appendChild(nameInput);

      const typeInput = document.createElement('input');
      typeInput.type = 'hidden';
      typeInput.name = 'contentType';
      typeInput.value = contentType;
      form.appendChild(typeInput);

      document.body.appendChild(form);
      form.submit();

      // Cleanup
      setTimeout(() => {
        if (document.body.contains(form)) document.body.removeChild(form);
      }, 500);
    } catch (err) {
      console.error("Form Proxy Fail, falling back to direct link:", err);
      // Fallback
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportSVG = async () => {
    const nodes = getNodes();
    if (!nodes.length) return;
    
    setIsExportingSvg(true);
    setIsExportMode(true);
    setForceExpandAll(true);

    try {
      const { toSvg } = await import('html-to-image');
      
      // Chờ hệ thống tự render layout
      await new Promise(res => setTimeout(res, 1500));
      await new Promise(res => setTimeout(res, 1500));
      fitView({ duration: 0, padding: 0.1 });
      await new Promise(res => setTimeout(res, 600));

      const currentNodes = getNodes();
      const nodesBounds = getNodesBounds(currentNodes);
      
      const width = nodesBounds.width + 500;
      const height = nodesBounds.height + 500;
      
      const transform = getViewportForBounds(
        nodesBounds, width, height, 0.5, 2, 0.1
      );

      const viewportDom = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!viewportDom) throw new Error("Chưa khởi tạo DOM");

      const dataUrl = await toSvg(viewportDom, {
        backgroundColor: '#F1F5F9',
        width, height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
        },
      });

      if (!dataUrl) throw new Error("Không thể tạo dữ liệu Vector");
      
      const fileName = `Gia_Pha_Toan_Canh_${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}.svg`;
      triggerDownload(dataUrl, fileName);
      
    } catch (err: unknown) {
       showToast("Lỗi xuất SVG. Vui lòng thử lại!", "error");
    } finally {
       setIsExportingSvg(false);
       setIsExportMode(false);
       setForceExpandAll(false);
    }
  };

  const handleExportPDF = async () => {
    const nodes = getNodes();
    if (!nodes.length) return;
    
    setIsExporting(true);
    setIsExportMode(true);
    setForceExpandAll(true);

    try {
      const { toJpeg } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');
      
      await new Promise(res => setTimeout(res, 1500));
      await new Promise(res => setTimeout(res, 1500));
      fitView({ duration: 0, padding: 0.1 });
      await new Promise(res => setTimeout(res, 800)); 

      const currentNodes = getNodes();
      const nodesBounds = getNodesBounds(currentNodes);
      
      const width = nodesBounds.width + 100;
      const height = nodesBounds.height + 100;

      const transform = getViewportForBounds(
        nodesBounds, width, height, 0.1, 5, 0.05
      );

      const viewportDom = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!viewportDom) throw new Error("Thiếu Viewport DOM");

      const dataUrl = await toJpeg(viewportDom, {
         backgroundColor: '#F1F5F9',
         width, height,
         style: {
           width: `${width}px`,
           height: `${height}px`,
           transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
         },
         pixelRatio: 1.2,
         quality: 0.95,
         skipFonts: false
      });
      
      const pdf = new jsPDF({ 
          orientation: width > height ? 'landscape' : 'portrait', 
          format: [width, height], 
          unit: 'px' 
      });

      const fileName = `Gia_Pha_Toan_Canh_${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}.pdf`;
      pdf.setProperties({ title: fileName });
      pdf.addImage(dataUrl, 'JPEG', 0, 0, width, height);
      
      const pdfDataUrl = pdf.output('datauristring');
      triggerDownload(pdfDataUrl, fileName);
      
    } catch (err: unknown) {
      showToast("Lỗi xuất PDF. Vui lòng thử lại!", "error");
    } finally {
      setIsExporting(false);
      setIsExportMode(false);
      setForceExpandAll(false);
      setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 500);
    }
  };

  const isHorizontal = toolbarConfig.orientation === 'horizontal';
  const isLeft = toolbarConfig.position.includes('left');
  const isTop = toolbarConfig.position.includes('top');

  return (
    <div className={`absolute z-50 pointer-events-none inset-0 ${isExporting || isExportingSvg ? "hidden" : "block"}`}>
      {/* Snap Preview Ghost */}
      {dragPreview && (
        <div 
           className={`absolute transition-all duration-300 pointer-events-none bg-slate-900/5 backdrop-blur-sm border-2 border-dashed border-slate-300 rounded-2xl
             ${dragPreview.position === 'top-left' ? 'top-4 left-4' : ''}
             ${dragPreview.position === 'top-right' ? 'top-4 right-4' : ''}
             ${dragPreview.position === 'bottom-left' ? 'bottom-4 left-4' : ''}
             ${dragPreview.position === 'bottom-right' ? 'bottom-4 right-4' : ''}
             ${dragPreview.orientation === 'horizontal' ? 'w-64 h-12' : 'w-12 h-64'}
           `}
        />
      )}

      <motion.div 
        key={`${toolbarConfig.position}-${toolbarConfig.orientation}`}
        drag 
        dragMomentum={false}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className={`pointer-events-auto absolute transition-all duration-500 ease-out cursor-grab active:cursor-grabbing
          ${toolbarConfig.position === 'top-left' ? 'top-4 left-4' : ''}
          ${toolbarConfig.position === 'top-right' ? 'top-4 right-4' : ''}
          ${toolbarConfig.position === 'bottom-left' ? 'bottom-4 left-4' : ''}
          ${toolbarConfig.position === 'bottom-right' ? 'bottom-4 right-4' : ''}
        `}
      >
        <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} items-center gap-1 p-1 bg-transparent border border-transparent transition-all duration-300 group hover:bg-white/10 dark:hover:bg-white/5 hover:backdrop-blur-md hover:border-white/10 hover:shadow-lg rounded-[20px]`}>
          {/* Subtle Drag Handle */}
          <div className={`flex items-center justify-center text-slate-400/30 group-hover:text-slate-400/60 transition-colors ${isHorizontal ? 'px-1 cursor-grab' : 'py-1 cursor-grab'}`}>
            <GripHorizontal className={`w-4 h-4 ${isHorizontal ? '' : 'rotate-90'}`} />
          </div>

          <button 
             onClick={() => {
               setLayoutDirection(layoutDirection === 'TB' ? 'LR' : 'TB');
               setTimeout(() => fitView({ duration: 800, padding: 0.1 }), 200);
             }}
             title="Xoay Cây (Ngang/Dọc)" 
             className="p-1.5 text-slate-400 hover:text-primary hover:bg-white/30 transition-all rounded-xl"
          >
             <Network className={`w-4 h-4 transition-transform duration-500 ${layoutDirection === 'LR' ? "-rotate-90" : ""}`} />
          </button>

          <div className={`bg-slate-300/20 ${isHorizontal ? 'w-px h-4 mx-0.5' : 'h-px w-4 my-0.5'}`} />

          <button onClick={() => zoomIn()} title="Phóng to" className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white/30 transition-all rounded-xl">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => zoomOut()} title="Thu nhỏ" className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white/30 transition-all rounded-xl">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={() => fitView({ duration: 800, padding: 0.1 })} title="Căn giữa toàn bộ cây" className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white/30 transition-all rounded-xl">
            <Maximize2 className="w-4 h-4" />
          </button>
          
          <div className={`bg-slate-300/20 ${isHorizontal ? 'w-px h-4 mx-0.5' : 'h-px w-4 my-0.5'}`} />

          {/* Settings */}
          <div className="relative">
            <button 
               onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
               className={`p-1.5 transition-all rounded-xl ${isSettingsOpen ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-600 hover:text-slate-900 hover:bg-white/30'}`}
            >
              <Settings2 className="w-4 h-4" />
            </button>
            {isSettingsOpen && (
               <>
                 <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)} />
                 <div className={`absolute w-56 bg-white/95 backdrop-blur-2xl border border-slate-200/50 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in duration-200
                   ${isTop ? 'top-10' : 'bottom-10'}
                   ${isLeft ? 'left-0' : 'right-0'}
                 `}>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Cấu hình thẻ</p>
                   <div className="space-y-1">
                     {[
                       { key: 'showDates', label: 'Năm sinh/mất', icon: '★' },
                       { key: 'showGeneration', label: 'Đời (Thế hệ)', icon: 'G' },
                       { key: 'showBranch', label: 'Nhánh / Chi', icon: 'B' },
                       { key: 'showHonorifics', label: 'Hiệu / Tự', icon: 'H' },
                       { key: 'showOccupation', label: 'Nghề / Chức', icon: 'O' },
                       { key: 'showSpouses', label: 'Phu nhân', icon: 'S' },
                     ].map((item) => (
                        <button 
                          key={item.key}
                          onClick={() => {
                            const newSettings = { ...displaySettings, [item.key]: !displaySettings[item.key as keyof TreeDisplaySettings] };
                            handleUpdateDisplaySettings(newSettings);
                          }}
                          className="w-full flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg group transition-colors"
                        >
                          <div className="flex items-center gap-2">
                             <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold ${displaySettings[item.key as keyof TreeDisplaySettings] ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400"}`}>
                                {item.icon}
                             </div>
                             <span className={`text-[12px] font-medium transition-colors ${displaySettings[item.key as keyof TreeDisplaySettings] ? "text-slate-900" : "text-slate-400"}`}>{item.label}</span>
                          </div>
                          <div className={`w-7 h-3.5 rounded-full p-0.5 transition-colors ${displaySettings[item.key as keyof TreeDisplaySettings] ? "bg-emerald-500" : "bg-slate-200"}`}>
                             <div className={`w-2.5 h-2.5 bg-white rounded-full transition-transform ${displaySettings[item.key as keyof TreeDisplaySettings] ? "translate-x-3.5" : "translate-x-0"}`} />
                          </div>
                        </button>
                     ))}
                   </div>
                 </div>
               </>
            )}
          </div>

          <div className={`bg-slate-300/20 ${isHorizontal ? 'w-px h-4 mx-0.5' : 'h-px w-4 my-0.5'}`} />

          {hasHidden && (
            <button 
              onClick={onResetHidden} 
              className="p-1.5 text-amber-400 hover:text-amber-600 hover:bg-amber-100/50 transition-all rounded-xl"
            >
              <Network className="w-4 h-4" />
            </button>
          )}

          <button onClick={handleExportPDF} disabled={isExporting} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100/50 transition-all rounded-xl">
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </button>
          <button onClick={handleExportSVG} disabled={isExportingSvg} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100/50 transition-all rounded-xl">
            {isExportingSvg ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileImage className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// Core Visualization Engine
// ----------------------------------------------------------------------------
interface CoreProps {
  rawMembers: Member[];
  onRefresh: () => Promise<void>;
  branches: Branch[];
  simpleMembers: SimpleMember[];
  isUrlFocusHandled: React.MutableRefObject<boolean>;
}

function FamilyTreeCore({ rawMembers, onRefresh, branches, simpleMembers, isUrlFocusHandled }: CoreProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const urlMemberId = searchParams.get("memberId");
  
  const [displaySettings, setDisplaySettings] = useState<TreeDisplaySettings>({
    showAvatar: true,
    showDates: true,
    showGeneration: true,
    showHonorifics: true,
    showOccupation: true,
    showSpouses: true,
    showBranch: true
  });

  // Fetch preferences from DB on mount
  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const prefs = await getUserPreferencesAction();
        if (prefs) {
          setDisplaySettings(prefs);
        }
      } catch (err) {
        // Fallback to localStorage if DB fetch fails
        console.warn("[Tree] DB Prefs fetch failed, using local fallback", err);
        const saved = localStorage.getItem('tree-display-settings-v1');
        if (saved) setDisplaySettings(JSON.parse(saved));
      }
    };
    fetchPrefs();
  }, []);

  // Sync to database and localStorage when changed
  const handleUpdateDisplaySettings = useCallback(async (newSettings: TreeDisplaySettings) => {
    setDisplaySettings(newSettings);
    localStorage.setItem('tree-display-settings-v1', JSON.stringify(newSettings));
    
    // Silence-save to DB
    try {
      await updateUserPreferencesAction(newSettings);
    } catch (err) {
      console.error("[Tree] Failed to save preferences to DB:", err);
    }
  }, []);

  const [toolbarConfig, setToolbarConfig] = useState<{
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    orientation: 'vertical' | 'horizontal';
  }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tree-toolbar-config-v1');
      if (saved) return JSON.parse(saved);
    }
    return {
      position: 'top-left',
      orientation: 'horizontal'
    };
  });

  useEffect(() => {
    localStorage.setItem('tree-toolbar-config-v1', JSON.stringify(toolbarConfig));
  }, [toolbarConfig]);

  // Export Mode Logic
  const [forceExpandAll, setForceExpandAll] = useState(false);
  const [isExportMode, setIsExportMode] = useState(false);
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
  const [sessionHiddenIds, setSessionHiddenIds] = useState<Set<string>>(new Set());

  // Memoized Parsing
  const treeMembersList = useMemo(() => parseMembers(rawMembers), [rawMembers]);

  // Selections
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [detailsSelectedId, setDetailsSelectedId] = useState<string | null>(null);

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitData, setAddModalInitData] = useState<any>({});

  // Edit Member Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);

  // Delete Member Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Active Menu State (QuickActionMenu)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const handleMenuToggle = useCallback((id: string | null) => {
    setActiveMenuId(id);
  }, []);

  // Swap sibling order handler
  const handleSwapOrder = useCallback(async (memberId: string, direction: 'left' | 'right') => {
    try {
      await swapSiblingOrder(memberId, direction);
      await onRefresh();
    } catch (err) {
      console.error('Failed to swap sibling order:', err);
    }
  }, [onRefresh]);

  // Client-side permission check helpers
  const { canEditGlobal, userRoles } = useUserPermissions();
  
  const checkCanEdit = useCallback((member: TreeMember) => {
    if (canEditGlobal) return true;
    return userRoles.some((r: any) => {
      if (r.role === Role.BRANCH_MANAGER && r.branchId === member.branchId) return true;
      if (r.role === Role.MEMBER && r.branchId === member.branchId) return true; // Hỗ trợ MEMBER kèm branchId
      return false;
    });
  }, [canEditGlobal, userRoles]);

  const checkCanAdd = useCallback((branchId?: string) => {
    if (canEditGlobal) return true;
    if (branchId) {
      return userRoles.some((r: any) => 
        (r.role === Role.BRANCH_MANAGER || r.role === Role.MEMBER) && r.branchId === branchId
      );
    }
    return false;
  }, [canEditGlobal, userRoles]);

  // Hover & Tooltip Events
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Path Kinship calculations
  const kinship = useMemo(() => findKinshipNodes(selectedNodeId, treeMembersList), [selectedNodeId, treeMembersList]);
  const { highlightedNodes, highlightedEdges } = kinship;

  const { fitView, getNodesBounds, setCenter, getNode, getViewport, getNodes } = useReactFlow();
  const flowNodes = useNodes();
  const [hasInitializedFit, setHasInitializedFit] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Update isOverflowing check ONLY on move end to avoid performance lag
  const handleMoveEnd = useCallback((_evt: any, viewport: { x: number, y: number, zoom: number }) => {
    if (!containerRef.current || flowNodes.length === 0) return;

    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;
    if (containerWidth === 0 || containerHeight === 0) return;

    const bounds = getNodesBounds(flowNodes);
    const treeWidthOnScreen = bounds.width * viewport.zoom;
    const treeHeightOnScreen = bounds.height * viewport.zoom;

    // Show minimap if tree is bigger than screen area
    const overflowing = treeWidthOnScreen > containerWidth - 40 || treeHeightOnScreen > containerHeight - 40;
    if (overflowing !== isOverflowing) {
      setIsOverflowing(overflowing);
    }
  }, [flowNodes, isOverflowing, getNodesBounds]);

  // Pan viewport to newly expanded node
  const [pendingCenterId, setPendingCenterId] = useState<string | null>(null);

  const handleAfterExpand = useCallback((nodeId: string) => {
    setPendingCenterId(nodeId);
  }, []);

  // -- Handlers for Quick Menu --
  const handleOpenAddSpouse = useCallback((member: any) => {
    setAddModalInitData({
      initialRelType: "SPOUSE",
      initialSpouseId: member.id,
      initialGender: member.gender === "MALE" ? "FEMALE" : "MALE",
      initialBranchName: member.branch,
      initialGeneration: member.generation,
      initialLastName: member.lastName || "Ngô",
    });
    setIsAddModalOpen(true);
  }, []);

  const handleOpenAddChild = useCallback((member: any) => {
    let motherId = "";
    if (member.gender === "MALE" && member.spouses && member.spouses.length > 0) {
      motherId = member.spouses[0].id;
    }
    setAddModalInitData({
      initialRelType: "PARENT_CHILD",
      initialFatherId: member.gender === "MALE" ? member.id : "",
      initialMotherId: member.gender === "FEMALE" ? member.id : motherId,
      initialBranchName: member.branch,
      initialGeneration: (member.generation || 1) + 1,
      initialLastName: member.lastName || "Ngô",
    });
    setIsAddModalOpen(true);
  }, []);

  const handleEditMemberFromNode = useCallback((m: TreeMember) => {
    console.log("[FamilyTreeCore] handleEditMemberFromNode called for member:", m.fullName, m.id);
    setEditTargetId(m.id);
    setIsEditModalOpen(true);
  }, []);

  const handleAddMember = useCallback(async (data: any) => {
    try {
      await addMember(data);
      await onRefresh();
    } catch (err) {
      console.error("Failed to add member from tree:", err);
    }
  }, [onRefresh]);

  // Helper to find which node actually contains the member (for spouses)
  const getTargetNodeId = useCallback((memberId: string | null) => {
    if (!memberId) return null;
    const husband = treeMembersList.find(m => m.spouses?.some(s => s.id === memberId));
    return husband ? husband.id : memberId;
  }, [treeMembersList]);
  

  const handleHideMember = useCallback((m: TreeMember) => {
    const idsToHide = new Set<string>();
    
    // Recursive descendant collector
    const collect = (rootId: string) => {
      idsToHide.add(rootId);
      const member = treeMembersList.find(x => x.id === rootId);
      if (member) {
        member.childIds.forEach(cid => collect(cid));
      }
    };

    collect(m.id);
    
    setSessionHiddenIds(prev => {
      const next = new Set(prev);
      idsToHide.forEach(id => next.add(id));
      return next;
    });

    showToast(`Đã ẩn tạm thời ${m.fullName} và hậu duệ`, "info", {
      label: "Hoàn tác",
      onClick: () => {
        setSessionHiddenIds(prev => {
          const next = new Set(prev);
          idsToHide.forEach(id => next.delete(id));
          return next;
        });
      }
    });
  }, [treeMembersList, showToast]);

  const handleDeleteMember = useCallback(async (m: TreeMember) => {
    setDeleteTargetId(m.id);
    setIsDeleteModalOpen(true);
    setActiveMenuId(null);
  }, []);

  // Directed Layout Hook
  const { nodes, edges, toggleExpand, expandNodes } = useFamilyTreeLayout(
      rawMembers, 
      highlightedEdges, 
      highlightedNodes, 
      forceExpandAll, 
      isExportMode,
      layoutDirection,
      handleSwapOrder,
      handleAfterExpand,
      handleEditMemberFromNode,
      handleOpenAddSpouse,
      handleOpenAddChild,
      handleHideMember,
      handleDeleteMember,
      checkCanEdit,
      checkCanAdd,
      activeMenuId,
      handleMenuToggle,
      sessionHiddenIds,
      displaySettings
  );

  // 1. Handle focusing/highlighting from URL parameter (Triệt để Version)
  useEffect(() => {
    if (urlMemberId && rawMembers.length > 0 && !isUrlFocusHandled.current) {
      const targetNodeId = getTargetNodeId(urlMemberId);
      if (!targetNodeId) return;

      const targetMember = treeMembersList.find(m => m.id === targetNodeId);
      if (!targetMember) return; 

      console.log("[Tree] URL focus triggered for:", targetMember.fullName, targetNodeId);
      
      const lineageIds = new Set<string>();
      let cursor: string | null = targetNodeId;
      let safety = 0;
      
      // TRACE LINEAGE BACKWARDS: Tìm toàn bộ tổ tiên để mở rộng nhánh
      while (cursor && safety < 100) {
        const parent = treeMembersList.find(m => m.childIds.includes(cursor!));
        if (parent && !lineageIds.has(parent.id)) {
          lineageIds.add(parent.id);
          cursor = parent.id;
        } else {
          cursor = null;
        }
        safety++;
      }
      
      const path = Array.from(lineageIds);
      console.log("[Tree] Computed lineage path to expand:", path);

      // KÍCH HOẠT MỞ RỘNG (Mọi cấp độ)
      if (path.length > 0) {
        expandNodes(path);
      }
      
      // TỰ ĐỘNG HIỆN THỊ NẾU ĐANG BỊ ẨN
      if (sessionHiddenIds.has(targetNodeId)) {
        setSessionHiddenIds(prev => {
          const next = new Set(prev);
          next.delete(targetNodeId);
          return next;
        });
      }

      // HIGHLIGHT & QUEUE CENTER
      setSelectedNodeId(urlMemberId);
      // Sử dụng timeout dài hơn để layout engine có thời gian tính toán lại trước khi centering
      setTimeout(() => setPendingCenterId(targetNodeId), 300);
      
      isUrlFocusHandled.current = true;
      setHasInitializedFit(true);
    }
  }, [urlMemberId, rawMembers.length, treeMembersList, expandNodes, getTargetNodeId, sessionHiddenIds]);

  // 2. Auto-fit on initial load (Dành cho truy cập trực tiếp không qua URL)
  useEffect(() => {
    if (nodes.length > 0 && !hasInitializedFit && !urlMemberId) {
      const timer = setTimeout(() => {
        try {
          fitView({ duration: 800, padding: 0.1, maxZoom: 0.75 });
          setHasInitializedFit(true);
        } catch (e) {
          console.warn("[Tree] Initial load fitView failed", e);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [nodes.length, fitView, hasInitializedFit, urlMemberId]);

  // 3. Simple & Robust Center Logic (Cinematic v3)
  useEffect(() => {
    if (pendingCenterId && nodes.length > 0) {
      const targetNode = nodes.find(n => n.id === pendingCenterId);
      if (targetNode) {
        // Lấy tọa độ position. React Flow Nodes update position ngay khi layout tính xong
        const { x, y } = targetNode.position;
        
        // CƠ CHẾ FALLBACK SIZING: Ưu tiên kích thước đo đạc (measured), nếu chưa có dùng fallback 240x150
        const w = targetNode.measured?.width || (targetNode as any).width || 240;
        const h = targetNode.measured?.height || (targetNode as any).height || 150;
        
        console.log("[Tree] Cinematic Center executing to:", (targetNode.data as any).member.fullName, { x, y });
        
        // Thực hiện căn giữa với zoom vừa phải (0.75) và duration điện ảnh (1200ms)
        setCenter(x + w / 2, y + h / 2, { zoom: 0.75, duration: 1200 });
        setPendingCenterId(null);
      }
    }
  }, [pendingCenterId, nodes, setCenter]);


  // Generate Tooltip Kinship Title
  let tooltipText = "";
  if (selectedNodeId && hoveredNodeId && tooltipPos) {
    const origin = treeMembersList.find(m => m.id === selectedNodeId);
    const target = treeMembersList.find(m => m.id === hoveredNodeId);
    if (origin && target) {
      tooltipText = calculateVietnameseKinship(target, origin, treeMembersList);
    }
  }

  // Active Details Payload
  const detailMemberObject = detailsSelectedId 
    ? treeMembersList.find(m => m.id === detailsSelectedId) || null 
    : null;



  return (
    <div ref={containerRef} className="w-full h-full relative">
      <CustomControls 
         setForceExpandAll={setForceExpandAll} 
         setIsExportMode={setIsExportMode}
         layoutDirection={layoutDirection}
         setLayoutDirection={setLayoutDirection}
         hasHidden={sessionHiddenIds.size > 0}
         onResetHidden={() => setSessionHiddenIds(new Set())}
         displaySettings={displaySettings}
         setDisplaySettings={setDisplaySettings}
         handleUpdateDisplaySettings={handleUpdateDisplaySettings}
         toolbarConfig={toolbarConfig}
         setToolbarConfig={setToolbarConfig}
         containerRef={containerRef}
      />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        minZoom={0.1}
        maxZoom={3}
        nodesDraggable={true} 
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}

        // Interactions
        onPaneClick={() => setActiveMenuId(null)}
        onNodeClick={(evt, node) => {
          setSelectedNodeId(node.id);
          if (activeMenuId !== node.id) setActiveMenuId(null);
        }}
        onNodeDoubleClick={(evt, node) => setDetailsSelectedId(node.id)}
        onMove={(evt, viewport) => handleMoveEnd(evt, viewport)}
        onMoveEnd={(evt, viewport) => handleMoveEnd(evt, viewport)}
        onNodeMouseEnter={(evt, node) => {
          setHoveredNodeId(node.id);
          setTooltipPos({ x: evt.clientX, y: evt.clientY });
        }}
        onNodeMouseMove={(evt) => {
          if (hoveredNodeId) setTooltipPos({ x: evt.clientX, y: evt.clientY });
        }}
        onNodeMouseLeave={() => {
          setHoveredNodeId(null);
          setTooltipPos(null);
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={32} size={1.5} color="#CBD5E1" />

        {isOverflowing && (
          <Panel position="bottom-left" className="m-2 shrink-0">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col bg-white/10 dark:bg-slate-900/40 backdrop-blur-md rounded-lg border border-white/20 shadow-2xl ring-1 ring-black/10 overflow-hidden w-[160px] h-[130px]"
            >
              {/* Window Title Bar */}
              <div className="px-2 py-1 border-b border-white/10 flex items-center justify-between bg-white/20 shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)] animate-pulse" />
                  <span className="text-[9px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
                    Bản đồ
                  </span>
                </div>
                <div className="flex gap-1 pointer-events-none opacity-20">
                  <div className="w-1 h-1 rounded-full bg-white" />
                  <div className="w-1 h-1 rounded-full bg-white" />
                </div>
              </div>

              {/* Map Body */}
              <div className="flex-1 relative overflow-hidden bg-transparent">
                <MiniMap
                  pannable
                  zoomable
                  nodeStrokeColor={(n: any) => (n.data?.member?.gender === "MALE" ? "#2563eb" : "#db2777")}
                  nodeColor={(n: any) => (n.data?.member?.gender === "MALE" ? "#3b82f6" : "#ec4899")}
                  nodeBorderRadius={4}
                  maskColor="rgba(15, 23, 42, 0.15)"
                  style={{ 
                    width: 158,
                    height: 104,
                    backgroundColor: 'transparent',
                    margin: 0,
                  }}
                />
              </div>
            </motion.div>
          </Panel>
        )}
      </ReactFlow>

      {/* Overlays / Popups */}
      {tooltipText && tooltipPos && (
        <KinshipTooltip title={tooltipText} x={tooltipPos.x} y={tooltipPos.y} />
      )}

      <PersonDetailsModal 
        member={detailMemberObject} 
        onClose={() => setDetailsSelectedId(null)} 
        onAddSpouse={detailMemberObject && checkCanAdd(detailMemberObject.branchId || undefined) ? handleOpenAddSpouse : undefined}
        onAddChild={detailMemberObject && checkCanAdd(detailMemberObject.branchId || undefined) ? handleOpenAddChild : undefined}
      />

      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddMember}
        branches={branches}
        existingMembers={simpleMembers}
        maxGeneration={treeMembersList.reduce((max, m) => Math.max(max, m.generation || 0), 0)}
        {...addModalInitData}
      />

      {isEditModalOpen && editTargetId && (
        <EditMemberModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditTargetId(null);
          }}
          member={rawMembers.find(m => m.id === editTargetId) || null}
          onSave={async (id, data) => {
            await updateMember(id, data);
            await onRefresh();
          }}
          branches={branches}
          existingMembers={simpleMembers}
          maxGeneration={treeMembersList.reduce((max, m) => Math.max(max, m.generation || 0), 0)}
        />
      )}

      <DeleteMemberDialog 
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteTargetId(null);
        }}
        member={rawMembers.find(m => m.id === deleteTargetId) || null}
        onConfirm={async (id) => {
          await deleteMember(id);
          await onRefresh();
        }}
      />

      {forceExpandAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md transition-all">
           <div className="bg-white rounded-3xl p-8 flex flex-col items-center shadow-2xl max-w-sm text-center animate-in fade-in zoom-in duration-300">
             <div className="w-16 h-16 rounded-full border-[5px] border-emerald-100 border-t-emerald-600 animate-spin mb-6" />
             <h2 className="text-xl font-bold font-serif text-slate-800 mb-2">Đang chế bản Bản đồ Toàn Cảnh...</h2>
             <p className="text-slate-600 text-sm">
               Hệ thống đang nội suy đồ họa Vector của tất cả ngóc ngách các Đời vào 1 bức tranh siêu khổng lồ.
             </p>
             <div className="mt-5 px-6 py-2 bg-emerald-50 text-emerald-800 font-black rounded-full shadow-inner tracking-widest uppercase text-[10px]">
                VUI LÒNG KHÔNG TẮT TRANG NÀY
             </div>
           </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Container Component
// ----------------------------------------------------------------------------
export function FamilyTreeNew({ rootId: propRootId }: { rootId?: string }) {
  const params = useParams();
  const rootId = propRootId || (params?.rootId as string);

  const [rawMembers, setRawMembers] = useState<Member[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [simpleMembers, setSimpleMembers] = useState<SimpleMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [membersData, branchesData, simpleMembersData] = await Promise.all([
        getMembers(),
        getBranches(),
        getAllMembersSimple(),
      ]);
      setRawMembers(membersData);
      setBranches(branchesData as Branch[]);
      setSimpleMembers(simpleMembersData as SimpleMember[]);
    } catch (err) {
      console.error("Failed to fetch tree boundary data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const isUrlFocusHandled = useRef(false);
  const filteredMembers = useMemo(() => {
    if (!rootId || rawMembers.length === 0) return rawMembers;

    const allowedIds = new Set<string>();
    
    // Đệ quy lấy toàn bộ con cháu
    const collectDescendants = (id: string) => {
      if (allowedIds.has(id)) return;
      allowedIds.add(id);

      const node = rawMembers.find(m => m.id === id);
      if (!node) return;

      // 1. Thêm spouses và con cái của spouses (nếu có)
      // Tìm các mối quan hệ SPOUSE liên quan đến node này
      const spouseIds: string[] = [];
      rawMembers.forEach(m => {
        const isSpouse = m.targetRels?.some(r => r.type === "SPOUSE" && r.sourceMemberId === id) ||
                        m.sourceRels?.some(r => r.type === "SPOUSE" && r.targetMemberId === id);
        if (isSpouse) spouseIds.push(m.id);
      });

      spouseIds.forEach(sid => {
        if (!allowedIds.has(sid)) allowedIds.add(sid);
      });

      // 2. Xử lý các con (Bất kỳ ai có node này hoặc spouses làm cha/mẹ)
      const children = rawMembers.filter(m => {
        return m.targetRels?.some(r => 
          r.type === "PARENT_CHILD" && 
          (r.sourceMemberId === id || spouseIds.includes(r.sourceMemberId))
        );
      });

      children.forEach(c => collectDescendants(c.id));
    };

    collectDescendants(rootId);
    
    // Nếu filter ra không thấy ai (Id sai), trả về rỗng để báo lỗi thay vì hiện hết
    const result = rawMembers.filter(m => allowedIds.has(m.id));
    return result.length > 0 ? result : [];
  }, [rawMembers, rootId]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="w-14 h-14 rounded-full border-[3px] border-slate-300 border-t-slate-800 animate-spin shadow-lg" />
        <p className="mt-6 text-slate-600 text-sm font-serif italic tracking-wider">
          Đang xây dựng di sản tộc phả...
        </p>
      </div>
    );
  }



  if (filteredMembers.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center space-y-4">
          <Network className="w-20 h-20 text-slate-300 mx-auto" />
          <p className="text-slate-800 font-serif text-xl font-bold">Chưa có thành viên nào</p>
          <p className="text-slate-500 text-sm italic">Hãy thêm vị thủy tổ đầu tiên hoặc kiểm tra lại đường dẫn</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-screen bg-[#F1F5F9] overflow-hidden select-none">
      <ReactFlowProvider>
        <FamilyTreeCore 
          rawMembers={filteredMembers} 
          onRefresh={fetchAll}
          branches={branches}
          simpleMembers={simpleMembers}
          isUrlFocusHandled={isUrlFocusHandled}
        />
      </ReactFlowProvider>
    </div>
  );
}
