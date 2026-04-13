import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    console.log("Bat dau cap nhat thu tu con cai (birthOrder)...");
    
    // Lấy mọi quan hệ Cha-Con
    const parentChildRels = await prisma.relationship.findMany({
        where: { type: "PARENT_CHILD" },
        include: { targetMember: true, sourceMember: true }
    });
    
    // Nhóm con cái theo ID của Cha (hoặc Mẹ nếu không có cha)
    const childrenGroups = new Map<string, typeof parentChildRels>();
    
    // Ưu tiên nhóm theo Cha (MALE)
    for (const rel of parentChildRels) {
        if (rel.sourceMember.gender === "MALE") {
            const group = childrenGroups.get(rel.sourceMemberId) || [];
            group.push(rel);
            childrenGroups.set(rel.sourceMemberId, group);
        }
    }
    
    // Bổ sung những người mẹ đơn thân (chưa được gán vào parent nào)
    for (const rel of parentChildRels) {
        if (rel.sourceMember.gender === "FEMALE") {
            // Kiem tra xem dua tre nay da duoc gan vao nguoi Cha nao chua
            let hasFather = false;
            for (const [fatherId, group] of childrenGroups.entries()) {
                if (group.some(g => g.targetMemberId === rel.targetMemberId)) {
                    hasFather = true;
                    break;
                }
            }
            if (!hasFather) {
                const group = childrenGroups.get(rel.sourceMemberId) || [];
                group.push(rel);
                childrenGroups.set(rel.sourceMemberId, group);
            }
        }
    }
    
    // Quét từng nhóm và đánh số thứ tự
    let counter = 0;
    for (const [parentId, group] of childrenGroups.entries()) {
        const uniqueChildrenMap = new Map();
        for (const g of group) uniqueChildrenMap.set(g.targetMemberId, g); // Loại bỏ trùng lặp nếu lỡ có
        
        const uniqueChildren = Array.from(uniqueChildrenMap.values());
        
        uniqueChildren.sort((a, b) => {
            const tA = new Date(a.targetMember.dateOfBirth || 0).getTime();
            const tB = new Date(b.targetMember.dateOfBirth || 0).getTime();
            if (tA && tB) return tA - tB;
            if (tA) return -1;
            if (tB) return 1;
            
            const cA = new Date(a.targetMember.createdAt).getTime();
            const cB = new Date(b.targetMember.createdAt).getTime();
            return cA - cB;
        });
        
        for (let i = 0; i < uniqueChildren.length; i++) {
            await prisma.familyMember.update({
                where: { id: uniqueChildren[i].targetMemberId },
                data: { birthOrder: i + 1 }
            });
            counter++;
            console.log(`> Dang xu ly: ${uniqueChildren[i].targetMember.fullName} -> Chi so Thu tu: ${i + 1}`);
        }
    }
    
    console.log(`✓ Hoan thanh! Da danh so thu tu cho ${counter} thanh vien.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
