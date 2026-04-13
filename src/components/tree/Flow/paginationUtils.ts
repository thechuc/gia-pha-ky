import { Member } from "@/types/member";

export function splitTreeForPagination(rawMembers: Member[]): Member[][] {
  const pages: Member[][] = [];
  if (!rawMembers || rawMembers.length === 0) return pages;

  // Helper function: Lấy tất cả vợ/chồng cho một danh sách thành viên cốt lõi
  const getWivesForMembers = (husbands: Member[]): Member[] => {
    const wIds = new Set<string>();
    husbands.forEach((h) => {
      const sourceRels = h.sourceRels || [];
      const targetRels = h.targetRels || [];
      
      sourceRels.forEach((r) => { if (r.type === "SPOUSE") wIds.add(r.targetMemberId); });
      targetRels.forEach((r) => { if (r.type === "SPOUSE") wIds.add(r.sourceMemberId); });
    });
    // Lọc từ rawMembers để lấy full object
    return rawMembers.filter(m => wIds.has(m.id));
  };

  // Thuật toán Đệ quy tách Nhánh thành từng Trang
  // baseGen: Thế hệ bắt đầu của Trang này
  const processBranch = (rootIds: Set<string>, baseGen: number) => {
    // Độ sâu tối đa trong 1 Trang = Gốc + 5 (Tổng cộng 6 đời 1 trang)
    const maxGen = baseGen + 5;
    
    // Breadth-First Search (Duyệt theo chiều rộng) để thu thập thành viên
    const coreMembers = new Map<string, Member>();
    const queue = Array.from(rootIds);
    
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (coreMembers.has(id)) continue;
      
      const m = rawMembers.find(x => x.id === id);
      if (!m) continue;
      
      let shouldHaveNextPage = false;
      let childrenIds: string[] = [];
      
      const sourceRels = m.sourceRels || [];
      childrenIds = sourceRels
        .filter((rel) => rel.type === "PARENT_CHILD" && rel.targetMember)
        .map((rel) => rel.targetMemberId);
      
      // Chặn đường tại maxGen
      if (m.generation === maxGen && childrenIds.length > 0) {
        // Node này là Đáy của Trang hiện tại và TỒN TẠI con -> Cắm cờ "Xem tiếp trang sau"
        shouldHaveNextPage = true;
        // KHÔNG queue children vì chúng thuộc trang sau 
      } else if (m.generation < maxGen) {
        // Tiep tuc duyet xuong con cai
        queue.push(...childrenIds);
      }
      
      // Clone m member và gắn thêm cờ UI đặc biệt __hasNextPage
      coreMembers.set(id, { ...m, __hasNextPage: shouldHaveNextPage } as Member);
    }
    
    // Thêm Node Đáy vào Map
    const coreArray = Array.from(coreMembers.values());
    const wives = getWivesForMembers(coreArray);
    
    // Đảm bảo Wives không mang cờ Next Page
    wives.forEach(w => {
      if (!coreMembers.has(w.id as string)) {
        coreMembers.set(w.id as string, { ...w, __hasNextPage: false });
      }
    });
    
    // Đóng gói Data của 1 Trang (Đã được hợp nhất và Không Trùng Lặp)
    const pageData = Array.from(coreMembers.values());
    pages.push(pageData);
    
    // Thu thập các Node Đáy (Đời maxGen) có cờ __hasNextPage
    const nextRoots = coreArray.filter(m => m.generation === maxGen && m.__hasNextPage);
    
    if (nextRoots.length > 0) {
      // Mỗi Node Đáy sẽ trở thành 1 ROOT Cụ Tổ mới cho 1 Trang in Độc Lập tiếp theo
      nextRoots.forEach(nr => {
        processBranch(new Set([nr.id as string]), nr.generation as number);
      });
    }
  };

  // Khởi chạy quá trình quét
  const startingRoots = rawMembers.filter(m => m.generation === 1);
  if (startingRoots.length > 0) {
    processBranch(new Set(startingRoots.map(r => r.id as string)), 1);
  } else {
    // Fallback an toàn nếu hệ thống chưa có Đời 1
    pages.push(rawMembers);
  }

  return pages;
}
