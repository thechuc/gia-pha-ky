---
trigger: always_on
---

# 🧬 GEMINI.md - PROTOCOL GIA PHẢ KÝ

> **MANDATORY**: Tệp này định nghĩa quy trình vận hành cho AI trong workspace này. Tuyệt đối tuân thủ để bảo vệ di sản dữ liệu.

---

## 🚀 QUY TRÌNH KHỞI TẠO (BOOT SEQUENCE)

**TRƯỚC KHI** thực hiện bất kỳ thay đổi nào, AI bắt buộc phải đọc các nguồn tri thức sau theo thứ tự:

1.  **[ARCHITECTURE.md](file:///d:/MyWorks/gia-pha-ky/ARCHITECTURE.md)**: Để hiểu cấu trúc và dòng chảy dữ liệu.
2.  **[BUSINESS_LOGIC.md](file:///d:/MyWorks/gia-pha-ky/BUSINESS_LOGIC.md)**: Để hiểu các quy tắc về quan hệ gia phả và đời/chi.
3.  **Toàn bộ thư mục [.agent/guidelines/](file:///d:/MyWorks/gia-pha-ky/.agent/guidelines/)**: Bao gồm các quy tắc riêng cho Tree Engine, Member Logic và UI Design.

---

## 🛠 QUY TẮC CỐT LÕI (TIER 0)

### 1. Bảo vệ Chính trực Dữ liệu (Genealogical Integrity)
- Không bao giờ tạo ra các mối quan hệ gây vòng lặp vô hạn (Vd: Con là cha của chính mình).
- Khi sửa đổi logic quan hệ, phải kiểm tra tính nhất quán trên toàn bộ cây.

### 2. Tiêu chuẩn Hiển thị (Visual Standard)
- Luôn giữ phong cách **Glassmorphism** cao cấp.
- Mọi thay đổi về Node/Edge phải được kiểm tra (Verify) để không làm vỡ thuật toán Layout tự động.
- Xem chi tiết tại: `[.agent/guidelines/UI_DESIGN_SYSTEM.md]`

### 3. Quy trình Cập nhật
- Luôn ưu tiên sử dụng **Server Actions** thay vì Route API thủ công.
- Sau khi mutate dữ liệu, PHẢI kích hoạt `onRefresh` tại Client để đồng bộ hóa Cây.
- Xem chi tiết tại: `[.agent/guidelines/MEMBER_MANAGEMENT.md]`

---

## 📁 DANH MỤC TRA CỨU NHANH

- **Tree Layout & Rendering**: `[.agent/guidelines/TREE_ENGINE.md]`
- **Cấu trúc DB & Models**: `[prisma/schema.prisma]` & `[src/types/member.ts]`
- **Logic họ hàng**: `[src/utils/kinshipUtils.ts]`

---
*Ghi chú: Nhiệm vụ chỉ được coi là hoàn thành khi nó không vi phạm bất kỳ quy tắc nào trong các tài liệu trên.*
