# Gia Phả Ký (Genealogy Heritage)

**Gia Phả Ký** là một ứng dụng web hiện đại được thiết kế để lưu trữ, số hóa và trực quan hóa cây gia phả dòng họ. Ứng dụng kết hợp giữa truyền thống di sản và công nghệ hiển thị tiên tiến, giúp các thế hệ kết nối và gìn giữ cội nguồn một cách trực quan và bền vững.

## 🚀 Tính năng chính

### 1. Trực quan hóa Cây Gia Phả (Genealogy Tree)
- **Công cụ hiển thị**: Sử dụng React Flow với các node tùy chỉnh để biểu diễn các thế hệ.
- **Tính năng Radar (MiniMap)**: Điều hướng nhanh trong các cây gia phả khổng lồ.
- **Tương tác**: Click-to-focus, kéo thả, và zoom thông minh.
- **Xuất bản**: Hỗ trợ xuất cây gia phả ra định dạng **PDF** và **SVG** chất lượng cao.

### 2. Quản lý Thành viên & Quan hệ
- **Thông tin chi tiết**: Lưu trữ đầy đủ tiểu sử, ngày sinh, ngày mất (hỗ trợ cả âm lịch), nghề nghiệp, nơi sinh.
- **Hệ thống quan hệ**: Xử lý logic phức tạp giữa Cha-Con, Vợ-Chồng, và các Chi/Nhánh trong dòng họ.
- **Sắp xếp thứ bậc**: Tự động tính toán Đời (Generation) và cho phép đổi thứ tự anh em trong nhà.

### 3. Di sản & Sự kiện
- **Dòng sự kiện (Life Events)**: Ghi lại các mốc thời gian quan trọng: Sinh ra, Kết hôn, Qua đời, Di cư.
- **Kho tư liệu**: Lưu trữ hình ảnh, tài liệu liên quan đến từng thành viên hoặc sự kiện.
- **Thông báo ngày giỗ (Anniversaries)**: Hệ thống nhắc nhở các ngày kỷ niệm, ngày giỗ sắp tới dựa trên dữ liệu thời gian thực.

## 🛠 Stack Công nghệ

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS.
- **Visualization**: @xyflow/react (React Flow), D3-Flextree, Framer Motion.
- **Database & ORM**: SQLite (Development), Prisma ORM.
- **UI/UX**: Lucide Icons, Glassmorphism Design System.
- **Tiện ích**: Date-fns, JSPDF (Export).

## 📦 Cài đặt & Vận hành

1. **Cài đặt dependencies**:
   ```bash
   npm install
   ```

2. **Thiết lập cơ sở dữ liệu**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Chạy môi trường phát triển**:
   ```bash
   npm run dev
   ```

4. **Truy cập**:
   Mở trình duyệt tại [http://localhost:3000](http://localhost:3000)

---
© 2026 Gia Phả Ký - Lưu giữ di sản dòng tộc.
