# Tái cấu trúc Gia Phả Ký (React Flow + D3-Flextree)

**Công nghệ sử dụng:** `@xyflow/react`, `d3-hierarchy`, `d3-flextree`.

## Vấn đề Cốt lõi
Thuật toán HTML Tree và Reingold-Tilford cơ bản thường gặp khó khăn ở các node lá có kích thước linh hoạt (Do số lượng Vợ/Chồng thay đổi làm đổi chiều dài/rộng Card). Dẫn đến khoảng cách các cụ trên cùng bị đùn giãn xa nhau.

## Giải pháp:
Áp dụng **d3-flextree**: Phiên bản nâng cấp của hàm `d3.tree()` cho phép cấp phát Box boundary theo từng Node riêng lẻ. Node nào lớn sẽ báo cáo Width/Height chính xác giúp các cụ ở hàng trên được nhét sát vào nhau mà không bao giờ vướng Overlay (Đè nhánh).

## Cấu trúc công việc:

- **1. Component Kế cấu (Custom Node)**
File: `src/components/tree/Flow/FamilyNode.tsx`
- Không sử dụng 2 node Vợ/Chồng riêng, mà lồng ghép Phối ngẫu trực tiếp trong thẻ DIV gốc để xyflow chỉ cần render 1 Node đại diện cho 1 gia đình.
- Hỗ trợ Icon Mở Nhánh (Expand) dưới đáy.

- **2. Lõi Thuật Toán**
File: `src/components/tree/Flow/useFamilyTreeLayout.ts`
- Initial Load giới hạn mở tới `generation === 7`. Cất lớp phía dưới vào `node._children`.
- Hàm `toggleExpand(nodeId)`: Tráo đổi `children` và `_children` cục bộ đúng tại `nodeId` đó, ngăn chặn tràn ngập các đời bên dưới nở bung ra. Sau đó call lại D3.
- Xử lý convert sang XYFlow `nodes` và `edges`.

- **3. Flow Engine**
File: `src/components/tree/Flow/FamilyTreeFlow.tsx`
- Component trùm cuối tích hợp `ReactFlowProvider`
- Trang bị nút Auto Fit-View, Zoom mặc định.
