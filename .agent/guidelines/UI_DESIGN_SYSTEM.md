# AI Guideline: Hệ thống Thiết kế (UI Design System)

Tài liệu này định nghĩa ngôn ngữ thiết kế và các token UI đặc thù của dự án Gia Phả Ký để đảm bảo tính nhất quán về thẩm mỹ cao cấp.

## 1. Triết lý Thiết kế: Glassmorphism

Ứng dụng sử dụng phong cách "Kính mờ" hiện đại để tạo cảm giác nhẹ nhàng và sang trọng.
- **Backdrop Blur**: Luôn sử dụng `backdrop-blur-md` hoặc `backdrop-blur-xl` cho các thành phần nổi (Modals, Context Menus, Floating Toolbars).
- **Border**: Sử dụng border mỏng (1px) với độ trong suốt cao (`border-white/20` hoặc `border-slate-200/50`).
- **Nền (Background)**:
  - Light mode: `bg-white/70`, `bg-slate-50/80`.
  - Dark mode: `bg-slate-900/40`, `bg-slate-800/60`.

## 2. Bảng màu Định danh (Semantic Colors)

- **Nam (Male)**: Sử dụng tone màu Blue/Indigo (`text-blue-600`, `bg-blue-50`, `border-blue-200`).
- **Nữ (Female)**: Sử dụng tone màu Pink/Rose (`text-pink-600`, `bg-pink-50`, `border-pink-200`).
- **Trạng thái Mất (Deceased)**: Sử dụng các yếu tố `grayscale` và dải băng đen (`bg-slate-900`).
- **Nhánh (Branch)**: Màu Emerald/Indigo để phân biệt các chi/nhánh khác nhau trên phối cảnh rộng.

## 3. Typography (Phông chữ)

- **Tiêu đề (Headers)**: Sử dụng phông chữ có chân (Serif) như `font-serif` để gợi sự truyền thống, di sản và tôn nghiêm.
- **Nội dung (Body)**: Sử dụng phông Sans-serif (Slate/Inter) để đảm bảo độ rõ nét và hiện đại.
- **Kích thước**:
  - Tên thành viên trên thẻ: `20px` (Full), `15px` (Compact).
  - Badge đời: `11px` font-black, tracking-wider.

## 4. Quy tắc cho Thẻ Thành viên (Member Cards)

- **Bo góc**: Sử dụng `rounded-2xl` cho thẻ chính và `rounded-full` cho các badge/avatar.
- **Shadow**: Sử dụng `shadow-sm` mặc định và `hover:shadow-xl` cùng với hiệu ứng `transition-all` để tạo cảm giác phản hồi khi tương tác.
- **Mật độ thông tin**: Phải tuân thủ `TreeDisplaySettings` để ẩn/hiện thông tin theo nhu cầu người dùng mà không làm vỡ bố cục thẻ.

## 5. Quy tắc Icons & Animation

- **Icons**: Sử dụng duy nhất bộ thư viện `Lucide`. Kích thước chuẩn cho UI điều hướng là `w-4 h-4` hoặc `w-5 h-5`.
- **Animation**: Sử dụng `framer-motion` cho các chuyển động vào/ra (initial/animate) và Transitions 200-300ms cho các thay đổi màu sắc/vị trí.

---
*AI chú ý: Giao diện của Gia Phả Ký ưu tiên sự gọn gàng, thoáng đãng và "premium". Hãy tránh sử dụng các màu sắc nguyên bản (pure red/blue) hoặc các viền dày, đậm làm mất đi vẻ đẹp thanh thoát của hệ thống.*
