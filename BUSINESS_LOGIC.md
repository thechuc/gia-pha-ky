# Quy tắc Nghiệp vụ (Business Logic) - Gia Phả Ký

Tài liệu này giải thích các quy tắc logic cốt lõi được áp dụng trong hệ thống để quản lý các mối quan hệ gia phả một cách chính xác.

## 1. Hệ thống Quan hệ (Relationship System)

Hệ thống sử dụng hai loại quan hệ cơ bản để xây dựng toàn bộ cây gia phả:

- **PARENT_CHILD (Cha-Con)**:
  - Source: Cha hoặc Mẹ.
  - Target: Con cái.
  - Quy tắc: Một người có thể có nhiều con, nhưng mỗi "mối nối" trên cây chỉ đại diện cho một cặp cha-con cụ thể. Đời của con = Đời của cha/mẹ + 1.
- **SPOUSE (Vợ-Chồng)**:
  - Source: Thành viên chính trong dòng họ.
  - Target: Người phối ngẫu (vợ/chồng).
  - Quy tắc: Quan hệ này không làm tăng số đời (Generation). Trên giao diện, người phối ngẫu được hiển thị ngay bên cạnh hoặc dưới thành viên chính tùy theo chế độ xem.

## 2. Quản lý Đời (Generation Management)

- **Thủy Tổ (Ancestor)**: Là người thuộc Đời 1.
- **Tính toán tự động**: Khi thêm một người con, hệ thống tự động gán Đời dựa trên đời của cha/mẹ.
- **Tính toán thủ công**: Cho phép quản trị viên điều chỉnh số đời trong các trường hợp đặc biệt (ví dụ: nhập dữ liệu từ giữa cây).

## 3. Thứ tự Sinh (Birth Order) & Hoán đổi Sắp xếp

- Mỗi thành viên trong cùng một gia đình (cùng cha mẹ) có một thuộc tính `birthOrder`.
- Hệ thống hỗ trợ tính năng **Swap Order**: Cho phép hoán đổi vị trí của các anh chị em trên cây để phản ánh đúng thực tế lịch sử (anh cả, em út) mà không làm ảnh hưởng đến các mối quan hệ của họ.

## 4. Cách tính Cách xưng hô (Vietnamese Kinship Calculation)

Dự án có một module riêng (`src/components/tree/Flow/kinshipUtils.ts`) để tính toán tên gọi họ hàng theo truyền thống Việt Nam dựa trên:
- Khoảng cách đời (Generation Distance).
- Nhánh (Branch) là trực hệ hay bàng hệ.
- Giới tính (Gender).
- Ví dụ: Tính toán xem một người là "Chú", "Bác", "O", "Dì" hay "Cụ cố" đối với người đang được chọn.

## 5. Xử lý Thời gian & Âm lịch

- **Ngày sinh/mất**: Lưu trữ dưới dạng `DateTime` tiêu chuẩn cho các mục đích tính toán tuổi và nhắc nhở.
- **Âm lịch (Lunar Calendar)**: Hỗ trợ flag `isBirthDateLunar` / `isDeathDateLunar`. Logic hiển thị sẽ ưu tiên chuyển đổi hoặc định dạng theo nhu cầu của lễ cúng, giỗ truyền thống.

## 6. Ràng buộc Dữ liệu & An toàn (Data Integrity)

- **Ngăn chặn vòng lặp**: Không cho phép một người là cha/mẹ của chính mình hoặc của tổ tiên mình (Cycle Detection).
- **Xóa thành viên**: Khi xóa một thành viên, hệ thống sẽ yêu cầu xác nhận và xử lý các mối quan hệ liên quan để tránh tạo ra các "node mồ côi" (orphan nodes) không có kết nối.

---
© 2026 Gia Phả Ký Business Logic Guide.
