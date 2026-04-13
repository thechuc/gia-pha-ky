# PLAN: Quản Trị Sự Kiện & Ngày Giỗ Toàn Diện (Premium Grade)

*Trạng thái: CHỜ PHÊ DUYỆT CỦA USER*

## 1. Phân Tích (Context Check)
Người dùng mong muốn xây dựng Chuyên trang Quản trị Sự kiện & Ngày giỗ (`/dashboard/events`) với độ hoàn thiện thương mại cao (Trị giá $10K). Trang này độc lập với Dashboard Overview và sẽ bao quát toàn bộ tài nguyên Sự Kiện. Tận dụng logic cốt lõi "Âm-Dương lịch tự động" đã xây dựng thành công ở widget Dashboard, giao diện mới cần sự hùng vĩ, dễ nhìn nhưng vô cùng hoành tráng.

---

## 2. Câu hỏi xác định Socratic Gate (User Review Required)

> [!CAUTION]
> Chức năng này cực kì quan trọng. Trước khi bắt tay vào code, xin vui lòng cho tôi xin ý kiến của bạn về 3 khía cạnh sau:

1. **Hiển thị Lịch (Calendar View)**: Bạn muốn Layout hiển thị dưới dạng Danh sách dọc (List/Cards mượt mà) hay mong muốn có hẳn một **Bảng Lịch (Calendar Grid) full-size** như Google Calendar nhưng có note Âm/Dương lịch?
2. **Quản trị Khách mời**: Trang này có cần tính năng "Tạo Giấy Phụ/Thông báo Giỗ" để admin có thể xuất file PDF (Mẫu thiệp mời) và gửi Zalo cho họ hàng không?
3. **Phân loại Sự kiện**: Quản lý sự kiện có nên chia Tab rõ ràng "Sự Kiện Dòng Họ" riêng và "Lịch Ngày Giỗ cá nhân" riêng hay hòa làm 1 dòng thời gian lớn?

---

## 3. Bản thiết kế Kiến trúc Dự kiến (Task Breakdown)

### Phase 1: Bố cục UI Chuyên trang (`/dashboard/events`)
- **Page Layout**: Bố cục 2 phần: 
  - Header Hero: Banner có hiệu ứng Paralax mờ nhẹ, thể hiện tính truyền thống (Tấm liễn, câu đối nhỏ mờ). 
  - Khối Action: Thanh Search Global & Filter nâng cao (Theo năm, phân loại, giai đoạn).
- **Core Components**:
  - `EventGrid.tsx`: Hiển thị dạng Masonry hoặc Grid hệ thống phân tách ngày giỗ và sự kiện chung ấn tượng.
  - `MonthTimeline.tsx`: Khối điều hướng theo tháng 1 -> 12 Âm lịch dọc chiều ngang. 

### Phase 2: Nâng cấp Dữ Liệu (Backend & State)
- Fetch dữ liệu kết hợp giữa `Event` của Prisma và tự động mapping với `FamilyMember (isAlive: false)` theo tháng.
- Viết action xử lý lọc (Filter Server) để trang không bị giật lag nếu gia phả lên tới 10.000 người.

### Phase 3: Premium Functional Forms
- Các Form Add/Edit cực đẹp (Slide over từ bên hông phải kiểu iOS Modal).
- Sử dụng Image uploader (Kéo thả) lưu đính kèm minh chứng cho báo cáo / lễ cúng sự kiện.

### Phase 4: Export tính năng $10K
- Tính năng **Tạo Thiệp Mời Cúng Giỗ Tự Động (PDF Generator)**. Lấy Avatar thành viên, ghép viền mạ vàng, trích xuất text mời tự động!

---

## 4. Tác nhân tham gia (Agent Assignments)
- **`frontend-specialist`**: Chịu trách nhiệm thiết kế bộ Components đẳng cấp, hiệu ứng Framer Motion chuẩn UX Apple.
- **`backend-specialist`**: Tạo API query tối ưu Date-Time Âm Dương cho khối lượng dữ liệu khổng lồ.
