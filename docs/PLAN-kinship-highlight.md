# PLAN: Nâng cấp Tương Tác Cây Gia Phả (Kinship & Highlights)

**Constraint:** Do not mutate existing D3 flex tree layout algorithm or the expand/collapse increment logic.

## 1. Feature: Split Spouse Card (FamilyNode)
- **Goal:** Dual-color split vertically.
- **Implementation:** Rewrite the Tailwind classes in `<FamilyNode />`. Use flex row structure. Left col = Husband (blue-100/30). Right col = Wives (pink-100/30). Handle singles gracefully.

## 2. Feature: Ancestor & Descendant Highlight (Single Click)
- **Goal:** Single click isolates the bloodline branch dynamically.
- **Algorithm Strategy (`useFindKinshipNodes`):**
  - Upward: Traversal using `fatherId` and `motherId` fields.
  - Downward: Traversal using `childIds`.
  - Aggregate ids to `highlightedNodes` and `highlightedEdges`.
- **UI Mechanism:**
  - Pass the subset sets to ReactFlow. 
  - Apply `stroke-dasharray` and CSS animation offset on matching edges. Keep nodes normal or dim non-matching nodes.

## 3. Feature: Kinship Title on Hover
- **Goal:** Predict Vietnamese calling title (e.g., Cố, Kỵ, Ông, Bà) from selected Node A to hovered Node B.
- **Algorithm Strategy (`calculateVietnameseKinship`):**
  - Must ensure Node B is directly an ancestor of A (verify path exists).
  - Calculate `Δ = Node A.generation - Node B.generation`.
  - Δ = 1: Bố/Mẹ. Δ = 2: Ông/Bà. Δ = 3: Cụ/Cố. Δ = 4: Kỵ. 
  - Differentiate gender of Node B.
- **UI Mechanism:**
  - Standard absolutely positioned `<KinshipTooltip />` floating anchored to the mouse position or above hovered node.

## 4. Feature: Detailed Profile Modal (Double-Click)
- **Goal:** Full deep profile inspection.
- **UI:** A standard right-side panel (Sidebar/Drawer) containing birth, death, biography, wives, and branches.

## Architectural Additions
- `src/components/tree/Flow/useFindKinshipNodes.ts` (Utility)
- `src/components/tree/Flow/KinshipTooltip.tsx` (Component)
- `src/components/tree/PersonDetailsModal.tsx` (Component)

*All changes will be completely modular to avoid side effects on React Flow XY Engine.*
