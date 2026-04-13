import { type Node, type Edge, MarkerType } from "@xyflow/react";

export interface TreeData {
  nodes: Node[];
  edges: Edge[];
}

const GEN_Y_SPACING = 350;
const NODE_W = 230;
const NODE_H = 100;
const CENTER_X = 1000;
const HORIZONTAL_SPACING = 300;

export function buildTreeFromMembers(members: any[]): TreeData {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  if (!members || members.length === 0) return { nodes, edges };

  // 1. Group by generation
  const genMap: Record<number, any[]> = {};
  members.forEach(m => {
    const gen = m.generation || 1;
    if (!genMap[gen]) genMap[gen] = [];
    genMap[gen].push(m);
  });

  // 2. Position nodes
  Object.entries(genMap).forEach(([genStr, genMembers]) => {
    const gen = parseInt(genStr);
    const y = (gen - 1) * GEN_Y_SPACING;
    const totalW = genMembers.length * HORIZONTAL_SPACING;
    const startX = CENTER_X - totalW / 2;

    genMembers.forEach((m, idx) => {
      const x = startX + idx * HORIZONTAL_SPACING;
      
      // Determine relationships for spouse display
      const spouses = m.sourceRels
        ?.filter((r: any) => r.type === "SPOUSE")
        .map((r: any) => ({
          id: r.targetMember.id,
          label: r.targetMember.fullName,
          rank: r.metadata?.rank || "Vợ",
          honorific: r.targetMember.honorific,
          isAlive: r.targetMember.isAlive,
        })) || [];

      nodes.push({
        id: m.id,
        type: "memberNode",
        position: { x, y },
        data: {
          label: m.fullName,
          generation: m.generation,
          isAlive: m.isAlive,
          gender: m.gender,
          birthDate: m.dateOfBirth ? new Date(m.dateOfBirth).getFullYear().toString() : "",
          deathDate: m.dateOfDeath ? new Date(m.dateOfDeath).getFullYear().toString() : "",
          avatar: m.avatar,
          occupation: m.occupation,
          honorific: m.honorific,
          alias: m.alias,
          title: m.title,
          spouses: spouses,
          fullDeathDate: m.dateOfDeath,
        }
      });

      // 3. Create Edges (Parent-Child)
      const childrenRels = m.sourceRels?.filter((r: any) => r.type === "PARENT_CHILD") || [];
      childrenRels.forEach((rel: any) => {
        // Find which spouse is the mother (if applicable)
        // This is a simplified check: if relationship metadata points to a specific motherId
        const motherId = rel.metadata?.motherId;
        const spouseIdx = spouses.findIndex((s: any) => s.id === motherId);
        const sourceHandle = spouseIdx !== -1 ? `spouse-${motherId}-out` : "out";

        edges.push({
          id: `e-${m.id}-${rel.targetMember.id}`,
          source: m.id,
          sourceHandle: sourceHandle,
          target: rel.targetMember.id,
          type: "step",
          label: spouses.length > 1 && spouseIdx !== -1 ? `Con bà ${spouses[spouseIdx].label}` : "",
          labelStyle: { fontSize: 8, fill: 'var(--primary)', fontStyle: 'italic', fontWeight: 'bold' },
          style: { stroke: "var(--primary)", strokeWidth: 2.5, opacity: 0.8 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "var(--primary)", width: 14, height: 14 },
        });
      });
    });
  });

  return { nodes, edges };
}
