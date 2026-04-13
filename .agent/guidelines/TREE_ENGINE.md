# AI Guideline: Cây Gia Phả (Tree Engine)

Tài liệu này định nghĩa các quy thiết kế và lập trình cho hệ thống Visualization của dự án Gia Phả Ký. AI cần tuân thủ nghiêm ngặt để tránh làm vỡ layout hoặc crash ứng dụng.

## 1. Hệ thống Phân lớp (Z-Index Rules)

Để tránh hiện tượng các phần tử đè lên nhau không mong muốn, hãy tuân thủ thang Z-index:
- **Mặc định Node**: `zIndex: 20`.
- **Active Node (Khi mở Menu)**: `zIndex: 1000`.
- **Edge (Đường nối)**: Mặc định `zIndex: 1`, nếu đang highlight `zIndex: 10`.
- **Radar (MiniMap)**: Nằm trong `Panel` của React Flow, có lớp vỏ bọc riêng.
- **Tooltips/Modals**: `zIndex: 100` trở lên (từ thư viện UI).

## 2. Quy tắc Layout Engine (`useFamilyTreeLayout.ts`)

- **Kích thước Node**: Luôn tính toán thông qua hàm `calculateNodeSize`. Không gán cứng (hardcode) kích thước trừ khi ở chế độ `isExportMode`.
- **Hướng Layout**:
  - `TB` (Top-to-Bottom): Mặc định. Anh chị em nằm ngang, con cái nằm dưới.
  - `LR` (Left-to-Right): Anh chị em nằm dọc, con cái từ trái sang phải.
- **Phép bù tọa độ (Offsetting)**: `d3-flextree` tính toán tọa độ dựa trên TÂM (Center), trong khi React Flow dùng GÓC TRÁI TRÊN (Top-Left). Mọi thay đổi về tọa độ node phải trừ đi một nửa chiều rộng/cao tương ứng.
- **An toàn dữ liệu**: Luôn bọc các giá trị tọa độ trong `Number.isFinite()` hoặc kiểm tra `NaN` trước khi đẩy vào React Flow state.

## 3. Quy tắc cho Đường nối (BusEdge)

- **Nguyên lý**: BusEdge sử dụng logic tính toán đường đi vuông góc (orthogonal paths).
- **Tránh chồng che**: Khi bổ sung node mới, cần kiểm tra xem đường nối có đè lên các node hiện có không thông qua `spacing` trong Flextree.

## 4. Tương tác Viewport (Auto-centering)

- **Lưu ý quan trọng**: Không được gọi `useReactFlow()` bên trong asynchronous callbacks (như `setTimeout` hoặc `Promise`). Hãy lấy helper (như `getViewport`, `setCenter`) ở cấp cao nhất của component.
- **Điều kiện căn giữa**: Chỉ chạy hiệu ứng Pan/Zoom khi một nhánh mới được mở rộng (expand) và mục tiêu nằm ngoài khung hình hiện tại.

## 5. Quy tắc cho MiniMap (Radar)

- Mirror toàn bộ viewport hiện tại.
- Kích thước chuẩn: `160x130px`.
- Thuộc tính bắt buộc: `pannable`, `zoomable` phải bằng `true`.

---
*AI chú ý: Mọi thay đổi phá vỡ quy trình Layout cần phải được kiểm tra (Verify) bằng cách mở Cây Gia Phả và thực hiện hành động Zoom/Pan/Expand trước khi hoàn tất task.*
