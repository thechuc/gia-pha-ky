import { TreeMember } from "./useFamilyTreeLayout";

export interface KinshipData {
  highlightedNodes: Set<string>;
  highlightedEdges: Set<string>;
}

// ----------------------------------------------------
// Thuật toán: Tìm Nhánh Tổ Tiên & Hậu Duệ (Bi-directional BFS)
// ----------------------------------------------------
export function findKinshipNodes(selectedId: string | null, rawMembers: TreeMember[]): KinshipData {
  if (!selectedId || !rawMembers || rawMembers.length === 0) {
    return { highlightedNodes: new Set(), highlightedEdges: new Set() };
  }

  const nodes = new Set<string>();
  const edges = new Set<string>();
  
  const map = new Map<string, TreeMember>();
  rawMembers.forEach(m => map.set(m.id, m));

  let anchorId = selectedId;
  const startNode = map.get(selectedId);
  
  if (!startNode) {
    // Nếu không tìm thấy node chính, kiểm tra xem ID này có phải là phu nhân của node nào đó không
    const husband = rawMembers.find(m => m.spouses?.some(s => s.id === selectedId));
    if (husband) {
      nodes.add(husband.id);
      anchorId = husband.id;
    } else {
      return { highlightedNodes: nodes, highlightedEdges: edges };
    }
  } else {
    nodes.add(selectedId);
  }

  // 1. Quét Hậu Duệ (Downward BFS) - Giữ nguyên logic hiện tại
  const queueDown = [anchorId];
  while (queueDown.length > 0) {
    const curId = queueDown.shift()!;
    const curMember = map.get(curId);
    
    if (curMember && curMember.childIds) {
      curMember.childIds.forEach(childId => {
         const edgeId = `e-${curId}-${childId}`;
         if (!edges.has(edgeId)) {
            edges.add(edgeId);
            if (!nodes.has(childId)) {
               nodes.add(childId);
               queueDown.push(childId);
            }
         }
      });
    }
  }

  // 2. Quét Tổ Tiên (Upward Path) - Truy vết trực hệ từng cấp để làm sáng nhánh
  let cursorId: string | null = anchorId;
  const visitedAncestors = new Set<string>();
  
  while (cursorId && !visitedAncestors.has(cursorId)) {
    visitedAncestors.add(cursorId);
    nodes.add(cursorId);
    
    const parent = rawMembers.find(m => m.childIds && m.childIds.includes(cursorId!));
    if (parent) {
      edges.add(`e-${parent.id}-${cursorId}`);
      cursorId = parent.id;
    } else {
      cursorId = null;
    }
  }

  return { highlightedNodes: nodes, highlightedEdges: edges };
}

// ----------------------------------------------------
// Thuật toán: Phân định Xưng Hô Dòng Họ Việt Nam (Toàn Bộ Sơ Đồ)
// Phân biệt mạch Trực hệ (Cha Cụ Ngoại) và Bàng hệ (Bác, Chú, Cô, Dì)
// Target: Người bị Hover | Origin: Người đang được Chọn
// ----------------------------------------------------
export function calculateVietnameseKinship(target: TreeMember, origin: TreeMember, allMembers: TreeMember[]): string {
  if (target.id === origin.id) return "";

  const depthDiff = origin.generation - target.generation;
  const targetIsMale = target.gender === "MALE";

  // Helper tìm Cha (Người có childIds chứa ID của mình)
  const getParent = (memberId: string) => allMembers.find(m => m.childIds?.includes(memberId));

  // Kiểm tra Target có phải là Tổ Tiên Trực Hệ của Origin không?
  let isDirectAncestor = false;
  let cursor = origin;
  const lineagePath: TreeMember[] = [origin];
  
  while (true) {
     const parentMember = getParent(cursor.id);
     if (!parentMember) {
        break;
     }
     
     lineagePath.push(parentMember);
     if (parentMember.id === target.id) {
       isDirectAncestor = true;
       break;
     }
     
     cursor = parentMember;
  }

  // --- TUYẾN BỀ TRÊN (Target sinh ra trước, đời bé hơn) ---
  if (depthDiff > 0) {
    if (isDirectAncestor) {
      switch (depthDiff) {
        case 1: return targetIsMale ? "Cha" : "Mẹ";
        case 2: return targetIsMale ? "Ông Nội" : "Bà Nội";
        case 3: return targetIsMale ? "Ông Cố" : "Bà Cố";
        case 4: return targetIsMale ? "Ông Cụ" : "Bà Cụ";
        case 5: return targetIsMale ? "Ông Kỵ" : "Bà Kỵ";
        case 6: return targetIsMale ? "Viễn Tổ (6 đời)" : "Viễn Tổ (6 đời)";
        case 7: return targetIsMale ? "Thái Tổ (7 đời)" : "Thái Tổ (7 đời)";
        case 8: return targetIsMale ? "Liệt Tổ (8 đời)" : "Liệt Tổ (8 đời)";
        case 9: return targetIsMale ? "Thủy Tổ (Cụ tổ đầu tiên)" : "Thủy Tổ";
        default: return targetIsMale ? "Tiền Nhân / Tổ Tiên" : "Tổ Tiên";
      }
    } else {
      // Bàng hệ (Bậc cha chú, nhưng không có mạch máu trực hệ đẻ ra mình)
      if (depthDiff === 1) {
        // Target is relative of Origin's parent
        const originParent = lineagePath[1]; 
        if (!originParent) {
            return targetIsMale ? "Bác / Chú" : "Bác / Cô"; 
        }
        
        const grandParent = getParent(originParent.id);
        let isTargetOlder = false;
        
        // Cùng tra cha chung (Ông Nội Origin) để xem Target lớn hay nhỏ tuổi hơn Cha Origin
        if (grandParent) {
            const indexTarget = grandParent.childIds.indexOf(target.id);
            const indexParent = grandParent.childIds.indexOf(originParent.id);
            if (indexTarget >= 0 && indexParent >= 0) {
                isTargetOlder = indexTarget < indexParent; // Dữ liệu con đã sort theo tuổi
            } else {
                const targetDate = new Date(target.dateOfBirth || '').getTime();
                const parentDate = new Date(originParent.dateOfBirth || '').getTime();
                if (targetDate && parentDate) {
                    isTargetOlder = targetDate < parentDate;
                }
            }
        }
        
        if (isTargetOlder) {
            return targetIsMale ? "Bác Trai (Anh của Cha)" : "Bác Gái (Chị của Cha)";
        } else {
            return targetIsMale ? "Chú (Em của Cha)" : "Cô (Em của Cha)";
        }
      }
      
      if (depthDiff === 2) {
         // Cùng thế hệ với Ông Nội
         const originGrandparent = lineagePath[2];
         let isTargetOlder = false;
         
         if (originGrandparent) {
             const greatGrand = getParent(originGrandparent.id);
             if (greatGrand) {
                 const indexTarget = greatGrand.childIds.indexOf(target.id);
                 const indexGrandParent = greatGrand.childIds.indexOf(originGrandparent.id);
                 if (indexTarget >= 0 && indexGrandParent >= 0) {
                     isTargetOlder = indexTarget < indexGrandParent;
                 }
             }
         }
         
         if (isTargetOlder) {
             return targetIsMale ? "Ông Bác" : "Bà Bác";
         }
         return targetIsMale ? "Ông Chú / Ông Trẻ" : "Bà Cô / Bà Trẻ";
      }

      if (depthDiff === 3) {
          return targetIsMale ? "Cố Bác / Cố Chú (Bàng Hệ)" : "Cố Bà (Bàng Hệ)";
      }

      if (depthDiff === 4) {
          return targetIsMale ? "Cụ Bác / Cụ Chú (Bàng Hệ)" : "Cụ Bà (Bàng Hệ)";
      }
      
      return "Bậc Tiên Tổ (Chi họ hàng)";
    }
  }

  // --- TUYẾN BỀ DƯỚI (Target sinh ra sau, đời lớn hơn) ---
  if (depthDiff < 0) {
    return ""; // Dừng hiển thị cách xưng hô đối với hậu duệ (vì không cần thiết theo yêu cầu)
  }

  // --- CÙNG ĐỜI (Chênh lệch = 0) ---
  const parentOrigin = getParent(origin.id);
  const parentTarget = getParent(target.id);
  const isSibling = parentOrigin && parentTarget && parentOrigin.id === parentTarget.id;
  
  if (isSibling) {
      let isTargetOlder = false;
      const indexTarget = parentOrigin.childIds.indexOf(target.id);
      const indexOrigin = parentOrigin.childIds.indexOf(origin.id);
      
      if (indexTarget >= 0 && indexOrigin >= 0) {
          isTargetOlder = indexTarget < indexOrigin;
      } else {
          const targetDate = new Date(target.dateOfBirth || '').getTime();
          const originDate = new Date(origin.dateOfBirth || '').getTime();
          if (targetDate && originDate) {
              isTargetOlder = targetDate < originDate;
          }
      }
      
      if (isTargetOlder) {
          return targetIsMale ? "Anh trai" : "Chị gái";
      }
      return targetIsMale ? "Em trai" : "Em gái";
  } else {
      return targetIsMale ? "Anh / Em họ (Bàng hệ)" : "Chị / Em họ (Bàng hệ)";
  }
}
