# Kiến trúc Hệ thống Gia Phả Ký

Tài liệu này mô tả chi tiết các tầng kiến trúc, cấu trúc thư mục và cách thức vận hành của ứng dụng.

## 1. Cấu trúc Thư mục (Directory Structure)

```bash
src/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Logic Đăng nhập/Đăng ký (nếu có)
│   ├── actions/          # Server Actions (Logic nghiệp vụ chính)
│   ├── api/              # API Routes (Dành cho media/upload)
│   ├── dashboard/        # Giao diện quản trị chính
│   └── tree/             # Giao diện xem cây gia phả độc lập
├── components/           # UI Components
│   ├── tree/             # Core Visualization (React Flow, Nodes, Edges)
│   ├── members/          # Quản lý thành viên (Forms, Modals)
│   ├── ui/               # Base components (Toast, Button, etc.)
│   └── anniversary/      # Module ngày giỗ & Kỷ niệm
├── lib/                  # Cấu hình Shared Libraries (Prisma Client)
├── types/                # TypeScript Interfaces & Domain Models
└── utils/                # Các hàm tiện ích (Date formatter, Kinship logic)
```

## 2. Dòng dữ liệu (Data Flow)

Hệ thống tuân thủ mô hình **Server-First** của Next.js:
1. **Database Layer**: Prisma ORM tương tác với SQLite.
2. **Business Logic Layer**: Các Server Actions (`src/app/actions`) thực hiện các thao tác nguyên tử (atomic operations) và cập nhật cache của Next.js thông qua `revalidatePath`.
3. **UI Layer**:
   - **Main Layout**: Server Components lấy dữ liệu ban đầu.
   - **Interactive Tree**: Client Components sử dụng dữ liệu từ Server để render đồ họa thông qua React Flow.

## 3. Core Engine: Visualization

Thành phần quan trọng nhất của dự án là **Cây Gia Phả**:
- **Layout Algorithm**: Sử dụng `d3-flextree` để tính toán vị trí các node dựa trên kích thước động của chúng, hỗ trợ cả hai hướng: Dọc (Top-Bottom) và Ngang (Left-Right).
- **Communication Style**: Các quan hệ được vẽ bằng `BusEdge` - một loại đường nối tùy chỉnh giúp tối ưu hóa không gian cho các gia đình đông con.
- **State Sync**: Viewport và vị trí node được đồng bộ hóa giữa Main View và MiniMap để đảm bảo tính nhất quán khi điều hướng.

## 4. Quản lý State

- **Server State**: Được quản lý bởi Next.js (Server Actions + Revalidation).
- **Local UI State**: Sử dụng React Hooks (`useState`, `useMemo`, `useCallback`) cho các tương tác tức thời như Zoom, Pan, hoặc trạng thái đóng mở Modal.
- **Persistence**: Một số thiết lập hiển thị (hiện avatar, hiện ngày tháng) được lưu trữ tại `localStorage` để duy trì trải nghiệm người dùng qua các phiên làm việc.

## 5. Bảo mật & Xác thực

- Sử dụng **Auth.js (NextAuth)** để quản lý phiên đăng nhập và phân quyền (Admin, Member, Guest).
- Truy vấn dữ liệu được bảo vệ ở cấp Server thông qua các kiểm tra quyền trong Server Actions.

---
© 2026 Gia Phả Ký Architecture Guide.
