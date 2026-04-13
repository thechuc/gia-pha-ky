import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { flextree } from "d3-flextree";
import { Node, Edge } from "@xyflow/react";
import { Member, SpouseInfo, TreeDisplaySettings } from "@/types/member";

// -------------------------------------------------------------
// Interfaces
// -------------------------------------------------------------
export interface TreeMember {
  id: string;
  fullName: string;
  gender: "MALE" | "FEMALE";
  generation: number;
  isAlive: boolean;
  dateOfBirth?: string | null;
  dateOfDeath?: string | null;
  spouses: SpouseInfo[];
  childIds: string[];
  __hasNextPage?: boolean;
  honorific?: string | null;
  alias?: string | null;
  occupation?: string | null;
  title?: string | null;
  birthPlace?: string | null;
  residencePlace?: string | null;
  branch?: string | null;
  birthOrder?: number | null;
  lastName?: string | null;
  metadata?: any;
}



export interface FlexNode {
  id: string;
  member: TreeMember;
  width: number;
  height: number;
  children?: FlexNode[];  // Expanded children
  _children?: FlexNode[]; // Hidden children
  isExpanded: boolean;
}

interface NodePositionInfo {
  x: number;
  width: number;
  absoluteY: number;
  gen: number;
}

// -------------------------------------------------------------
// Utilities
// -------------------------------------------------------------
export const calculateNodeSize = (member: TreeMember, isExportMode: boolean, settings?: TreeDisplaySettings) => {
  const gen = member.generation || 1;
  const spousesCount = (member.spouses && member.spouses.length > 0) ? member.spouses.length : 0;
  
  if (isExportMode) {
    if (gen >= 7) return { width: 125, height: 45 }; // MINI
    if (gen >= 4) {
      // COMPACT
      const height = spousesCount > 0 ? 95 : 75; 
      return { width: 175, height };
    }
  }

  // FULL Mode - Dynamic Calculation
  const s = settings || {
    showAvatar: true,
    showDates: true,
    showGeneration: true,
    showHonorifics: true,
    showOccupation: true,
    showSpouses: true,
    showBranch: true
  };

  let height = 80; // Minimum base height (Name padding)
  if (s.showGeneration) height += 15; // Badge offset buffer
  if (s.showHonorifics && (member.honorific || member.alias)) height += 20;
  if (s.showDates) height += 35; // Dates line + Age line
  if (s.showOccupation && (member.occupation || member.title)) height += 25;
  
  if (s.showSpouses && spousesCount > 0) {
    height += 15; // border-t + padding-t
    // Multi-row horizontal chips: assume ~30px per row of chips
    const rows = Math.ceil(spousesCount / 2); // Roughly 2 chips per row in 240px
    height += rows * 28;
  }
  
  return { width: 240, height: Math.max(height, 100) };
};

export function parseMembers(raw: Member[]): TreeMember[] {
  return raw.map(m => {
    const sourceRels = m.sourceRels || [];
    const targetRels = m.targetRels || [];

    const getWifeInfo = (memberId: string, rankIndex: number, rankOffset: number = 0) => {
      const fullWife = raw.find(row => row.id === memberId);
      const childCount = (fullWife?.sourceRels || []).filter(rel => rel.type === "PARENT_CHILD").length;
      const rankName = ["Chính thất", "Ả thất", "Trắc thất", "Thiếp thứ tư", "Thiếp thứ năm"][rankIndex + rankOffset] 
                       ?? `Thiếp thứ ${rankIndex + rankOffset + 1}`;
      return {
        id: memberId,
        fullName: fullWife?.fullName || "Không tên",
        isAlive: fullWife?.isAlive ?? true,
        rank: rankName,
        childCount
      };
    };

    const wivesFromSource = sourceRels
      .filter(r => r.type === "SPOUSE" && r.targetMember?.gender === "FEMALE")
      .map((r, i) => getWifeInfo(r.targetMemberId, i));

    const wivesFromTarget = targetRels
      .filter(r => r.type === "SPOUSE" && r.sourceMember?.gender === "FEMALE")
      .map((r, i) => getWifeInfo(r.sourceMemberId, i, wivesFromSource.length));

    const spouses = m.gender === "MALE" ? [...wivesFromSource, ...wivesFromTarget] : [];
    
    // Sort and Ensure uniqueness for children
    const uniqueChildIds = new Set<string>();
    const childIds = sourceRels
      .filter(r => r.type === "PARENT_CHILD" && r.targetMember)
      .sort((a, b) => {
        const fullA = raw.find(row => row.id === (a.targetMemberId));
        const fullB = raw.find(row => row.id === (b.targetMemberId));

        const orderA = fullA?.birthOrder || 0;
        const orderB = fullB?.birthOrder || 0;
        
        if (orderA !== 0 || orderB !== 0) {
            const aVal = orderA === 0 ? 9999 : orderA;
            const bVal = orderB === 0 ? 9999 : orderB;
            if (aVal !== bVal) return aVal - bVal;
        }

        const dateA = fullA?.dateOfBirth;
        const dateB = fullB?.dateOfBirth;
        const timeA = dateA ? new Date(dateA).getTime() : NaN;
        const timeB = dateB ? new Date(dateB).getTime() : NaN;
        
        const validA = !isNaN(timeA);
        const validB = !isNaN(timeB);

        if (validA && validB) {
            if (timeA !== timeB) return timeA - timeB;
        }
        if (validA) return -1;
        if (validB) return 1;
        
        const cA = new Date((fullA?.createdAt as string) || "").getTime() || 0;
        const cB = new Date((fullB?.createdAt as string) || "").getTime() || 0;
        return cA - cB;
      })
      .map(r => r.targetMemberId)
      .filter((id: string) => {
          if (uniqueChildIds.has(id)) return false;
          uniqueChildIds.add(id);
          return true;
      });

    return {
      id: m.id,
      fullName: m.fullName || "Ẩn Danh",
      gender: m.gender as "MALE" | "FEMALE",
      generation: m.generation || 1,
      isAlive: m.isAlive as boolean,
      dateOfBirth: m.dateOfBirth as string | null | undefined,
      dateOfDeath: m.dateOfDeath as string | null | undefined,
      occupation: m.occupation,
      birthPlace: m.birthPlace,
      residencePlace: m.residencePlace,
      branch: m.branch?.name || m.branchName,
      honorific: m.honorific,
      alias: m.alias,
      title: m.title,
      birthOrder: m.birthOrder,
      spouses,
      childIds,
      lastName: m.lastName,
      metadata: m.metadata,
      __hasNextPage: m.__hasNextPage || false,
    };
  });
}

// -------------------------------------------------------------
// Core Hook: useFamilyTreeLayout
// -------------------------------------------------------------
export function useFamilyTreeLayout(
  rawDbMembers: Member[], 
  highlightedEdgesRaw?: Set<string>, 
  highlightedNodesRaw?: Set<string>, 
  forceExpandAll: boolean = false, 
  isExportMode: boolean = false,
  direction: 'TB' | 'LR' = 'TB',
  onSwapOrder?: (memberId: string, direction: 'left' | 'right') => void,
  onAfterExpand?: (nodeId: string) => void,
  onEdit?: (m: TreeMember) => void,
  onAddSpouse?: (m: TreeMember) => void,
  onAddChild?: (m: TreeMember) => void,
  onHide?: (m: TreeMember) => void,
  onDelete?: (m: TreeMember) => void,
  activeMenuId?: string | null,
  onMenuToggle?: (id: string | null) => void,
  sessionHiddenIds: Set<string> = new Set(),
  displaySettings?: TreeDisplaySettings
) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const initialized = useRef(false);

  // Initialize expanded nodes up to generation 5
  useEffect(() => {
    if (rawDbMembers && rawDbMembers.length > 0 && !initialized.current) {
      const initialExpanded = new Set<string>();
      rawDbMembers.forEach(m => {
        const generation = m.generation as number;
        if (generation && generation < 6) { 
          initialExpanded.add(m.id as string);
        }
      });
      // Defer state update to avoid synchronous cascading render warning
      Promise.resolve().then(() => {
        setExpandedIds(prev => {
          const next = new Set(prev);
          initialExpanded.forEach(id => next.add(id));
          return next;
        });
        initialized.current = true;
      });
    }
  }, [rawDbMembers]);
  
  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId); 
      } else {
        next.add(nodeId);
        // Notify parent to pan viewport to this node
        if (onAfterExpand) {
          setTimeout(() => onAfterExpand(nodeId), 50);
        }
      }
      return next;
    });
  }, [onAfterExpand]);
  
  const expandNodes = useCallback((ids: string[]) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  }, []);

  const { nodes, edges } = useMemo(() => {
    if (!rawDbMembers || rawDbMembers.length === 0) return { nodes: [], edges: [] };
    
    // Resolve props inside Memo to satisfy dependency rules
    const activeEdges = highlightedEdgesRaw || new Set<string>();
    const activeNodes = highlightedNodesRaw || new Set<string>();

    // 1. Deduplicate & Parse all
    const uniqueDbMembers = Array.from(new Map(rawDbMembers.map(m => [m.id as string, m])).values());
    const treeMembersAllParsed = parseMembers(uniqueDbMembers);

    // 2. Identify and prune forbidden branches (Recursive)
    const forbiddenIds = new Set<string>();
    
    // Initial seeds for forbidden IDs: metadata.isHidden OR sessionHiddenIds
    treeMembersAllParsed.forEach(m => {
      if (m.metadata?.isHidden || sessionHiddenIds.has(m.id)) {
        forbiddenIds.add(m.id);
      }
    });

    // Expand forbidden IDs to all descendants
    const collectForbidden = (id: string) => {
      const m = treeMembersAllParsed.find(x => x.id === id);
      if (!m) return;
      m.childIds.forEach(cid => {
        if (!forbiddenIds.has(cid)) {
          forbiddenIds.add(cid);
          collectForbidden(cid);
        }
      });
    };

    // We must iterate over a snapshot of the current forbidden list to expand it
    Array.from(forbiddenIds).forEach(id => collectForbidden(id));

    // 3. Final visible list
    const treeMembersAll = treeMembersAllParsed.filter(m => !forbiddenIds.has(m.id));

    // 4. Filter out wives from root tree logic (Same as before)
    const wifeIds = new Set<string>();
    treeMembersAll.forEach(m => {
      if (m.gender === "MALE") {
        m.spouses?.forEach(s => wifeIds.add(s.id));
      } else if (m.gender === "FEMALE") {
        const isWife = treeMembersAll.some(other => 
           other.gender === "MALE" && other.spouses?.some(s => s.id === m.id)
        );
        if (isWife) wifeIds.add(m.id);
      }
    });

    const rootMembers = treeMembersAll.filter(m => !wifeIds.has(m.id));

    // Calculate Grid Height requirements
    const genMaxHeight = new Map<number, number>();
    const genMaxWidth = new Map<number, number>();
    let maxGen = 1;

    rootMembers.forEach(m => {
        const gen = m.generation || 1;
        if (gen > maxGen) maxGen = gen;
        const size = calculateNodeSize(m, isExportMode, displaySettings);
        genMaxHeight.set(gen, Math.max(genMaxHeight.get(gen) || 0, size.height));
        genMaxWidth.set(gen, Math.max(genMaxWidth.get(gen) || 0, size.width));
    });

    const genAbsolutePos = new Map<number, number>();
    let currentPos = 0;
    for (let g = 1; g <= maxGen; g++) {
       genAbsolutePos.set(g, currentPos);
       const breadth = direction === 'LR' ? (genMaxWidth.get(g) || 0) : (genMaxHeight.get(g) || 0);
       // Dãn cách thế hệ vừa phải
       const margin = isExportMode ? (g >= 7 ? 40 : g >= 4 ? 60 : 80) : 80;
       currentPos += breadth + margin;
    }

    // Build FlexNodes Structure
    const nodeMap = new Map<string, FlexNode>();
    rootMembers.forEach(m => {
      const size = calculateNodeSize(m, isExportMode, displaySettings);
      nodeMap.set(m.id, {
        id: m.id,
        member: m,
        width: size.width,
        height: size.height,
        isExpanded: false
      });
    });

    const roots: FlexNode[] = [];
    rootMembers.forEach(m => {
      const node = nodeMap.get(m.id)!;
      const childNodes = m.childIds
        .map(cid => nodeMap.get(cid))
        .filter((c): c is FlexNode => !!c);

      const isManualExpanded = forceExpandAll || expandedIds.has(m.id);

      if (childNodes.length > 0) {
        if (isManualExpanded) {
          node.children = childNodes;
          node.isExpanded = true;
        } else {
          node._children = childNodes;
          node.isExpanded = false;
        }
      }

      const hasParent = rootMembers.some(p => p.childIds.includes(m.id));
      if (!hasParent) {
          roots.push(node);
      }
    });

    const virtualRootId = "VIRTUAL_ROOT";
    const graphRoot = {
      id: virtualRootId,
      width: 0,
      height: 0,
      children: roots
    };

    // D3 Flextree Layout Computation
    const layout = flextree({
      nodeSize: (node: { data: FlexNode }) => {
         const d = node.data;
         if (d.id === virtualRootId) return [0, 0];
         const gen = d.member.generation || 1;
         
         const margin = isExportMode ? (gen >= 7 ? 30 : gen >= 4 ? 40 : 50) : 60;
         const breadth = direction === 'LR' ? (genMaxWidth.get(gen) || d.width) : (genMaxHeight.get(gen) || d.height);
         
         // If horizontal, 'x' in flextree will be our 'y' (breadth axis)
         // So flextree's primary axis should be height in LR, width in TB
         return [direction === 'LR' ? d.height : d.width, breadth + margin];
      },
      spacing: (a: { parent: unknown }, b: { parent: unknown }) => {
         // Dãn cách 25px để huy hiệu (15px) không chạm vào thẻ trên, tạo khe hở 10px
         return isExportMode ? 25 : 30; 
      }
    });

    const hierarchy = layout.hierarchy(graphRoot, (n: { children: FlexNode[] }) => n.children);
    layout(hierarchy);

    const outNodes: Node[] = [];
    const outEdges: Edge[] = [];
    const nodeInfoMap = new Map<string, NodePositionInfo>();
    const childrenByParent = new Map<string, string[]>();

    // Pre-compute sibling position info for reorder buttons
    const siblingInfo = new Map<string, { isFirst: boolean; isLast: boolean }>();
    rootMembers.forEach(m => {
      if (m.childIds && m.childIds.length > 0) {
        const visibleChildren = m.childIds.filter(cid => {
          const childNode = nodeMap.get(cid);
          return !!childNode;
        });
        visibleChildren.forEach((cid, idx) => {
          siblingInfo.set(cid, {
            isFirst: idx === 0,
            isLast: idx === visibleChildren.length - 1,
          });
        });
      }
    });

    // Pass 1: Setup ReactFlow Nodes and record positions
    hierarchy.each((node: { data: FlexNode; x: number; y: number; parent?: { data: FlexNode } }) => {
      if (node.data.id === virtualRootId) return;
  
      const d = node.data as FlexNode;
      const gen = d.member.generation || 1;
      const absolutePos = genAbsolutePos.get(gen) ?? node.y;
  
      // Position calculation based on direction
      // IMPORTANT: flextree calculates 'node.x' and 'node.y' as CENTERS.
      // React Flow uses them as TOP-LEFT. We must offset to avoid overlap.
      let finalX = (node.x || 0) - (d.width || 0) / 2;
      let finalY = absolutePos || 0;
  
      if (direction === 'LR') {
        finalX = absolutePos || 0;
        finalY = (node.x || 0) - (d.height || 0) / 2;
      }
  
      // Clamp to ensure no NaNs reach React Flow
      finalX = Number.isNaN(finalX) ? 0 : finalX;
      finalY = Number.isNaN(finalY) ? 0 : finalY;
  
      nodeInfoMap.set(d.id, { x: finalX, width: d.width, absoluteY: finalY, gen });
  
      if (node.parent && node.parent.data.id !== virtualRootId) {
        const parentId = node.parent.data.id;
        if (!childrenByParent.has(parentId)) {
            childrenByParent.set(parentId, []);
        }
        childrenByParent.get(parentId)!.push(d.id);
      }
  
      const sInfo = siblingInfo.get(d.id);

      outNodes.push({
        id: d.id,
        type: "familyNode",
        data: {
          member: d.member,
          isExportMode,
          direction,
          maxHeight: genMaxHeight.get(gen) || d.height,
          hasHiddenChildren: !!(d._children && d._children.length > 0),
          isExpanded: d.isExpanded,
          isHighlighted: activeNodes.has(d.id),
          onToggle: () => toggleExpand(d.id),
          isFirstSibling: sInfo?.isFirst ?? true,
          isLastSibling: sInfo?.isLast ?? true,
          onMoveLeft: onSwapOrder ? () => onSwapOrder(d.id, 'left') : undefined,
          onMoveRight: onSwapOrder ? () => onSwapOrder(d.id, 'right') : undefined,
          maxWidth: genMaxWidth.get(gen) || d.width,
          onEdit: onEdit ? () => onEdit(d.member) : undefined,
          onAddSpouse: onAddSpouse ? () => onAddSpouse(d.member) : undefined,
          onAddChild: onAddChild ? () => onAddChild(d.member) : undefined,
          onHide: onHide ? () => onHide(d.member) : undefined,
          onDelete: onDelete ? () => onDelete(d.member) : undefined,
          isMenuOpen: activeMenuId === d.id,
          onMenuToggle,
          displaySettings,
        },
        position: { x: finalX, y: finalY },
        width: d.width,
        height: d.height,
        zIndex: activeMenuId === d.id ? 1000 : 20,
      });
    });

    // Pass 2: Setup Special 'busEdge' connecting siblings on the same level correctly
    childrenByParent.forEach((childIds, parentId) => {
      const parentInfo = nodeInfoMap.get(parentId);
      if (!parentInfo) return;

      childIds.forEach((childId) => {
        const edgeId = `e-${parentId}-${childId}`;
        const isHighlighted = activeEdges.has(edgeId);

        outEdges.push({
          id: edgeId,
          source: parentId,
          target: childId,
          type: "busEdge",
          animated: false,
          zIndex: isHighlighted ? 10 : 1,
          data: {
            isHighlighted,
            direction,
          } as Record<string, unknown>,
        });
      });
    });

    return { nodes: outNodes, edges: outEdges };
  }, [
    rawDbMembers, expandedIds, highlightedEdgesRaw, highlightedNodesRaw, forceExpandAll, 
    onHide, onDelete, activeMenuId, onMenuToggle, sessionHiddenIds, 
    displaySettings, direction, isExportMode
  ]);
  
  return { nodes, edges, toggleExpand, expandNodes };
}
