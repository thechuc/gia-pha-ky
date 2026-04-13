import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
    try {
        console.log("Bat dau cap nhat thu tu con cai (birthOrder)...");
        
        const parentChildRels = await prisma.relationship.findMany({
            where: { type: "PARENT_CHILD" },
            include: { targetMember: true, sourceMember: true }
        });
        
        const childrenGroups = new Map();
        
        for (const rel of parentChildRels) {
            if (rel.sourceMember.gender === "MALE") {
                const group = childrenGroups.get(rel.sourceMemberId) || [];
                group.push(rel);
                childrenGroups.set(rel.sourceMemberId, group);
            }
        }
        
        for (const rel of parentChildRels) {
            if (rel.sourceMember.gender === "FEMALE") {
                let hasFather = false;
                for (const [fatherId, group] of childrenGroups.entries()) {
                    if (group.some((g: any) => g.targetMemberId === rel.targetMemberId)) {
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
        
        let counter = 0;
        for (const [parentId, group] of childrenGroups.entries()) {
            const uniqueChildrenMap = new Map();
            for (const g of group) uniqueChildrenMap.set(g.targetMemberId, g);
            
            const uniqueChildren = Array.from(uniqueChildrenMap.values());
            
            uniqueChildren.sort((a: any, b: any) => {
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
            }
        }
        return NextResponse.json({ success: true, message: `Da danh so thu tu cho ${counter} thanh vien` });
    } catch(err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
