# Kế Hoạch Tổ Chức Lại Danh Sách Thành Viên (Group by Gen & Branch)

Hệ thống hiện tại trên màn hình "Quản Lý Thành Viên" đang nhóm (grouping) dữ liệu duy nhất dựa trên **Đời (Generation)**. Yêu cầu của người dùng là nhóm dữ liệu thành hai cấp độ:
1. **Cấp 1: Nhóm theo Đời (Generation)** (Ví dụ: "Đời thứ 1", "Đời thứ 2").
2. **Cấp 2: Nhóm theo Chi/Nhánh (Branch)** (Ví dụ: "Nhánh Trưởng", "Chi 2"). Các thành viên không có nhánh sẽ vào nhóm "Chưa phân nhánh".

---

## Các thay đổi dự kiến (Proposed Changes)

Dưới đây là kế hoạch chi tiết cần thực hiện:

### 1. `src/components/members/MembersPage.tsx`
Khối dữ liệu cần được reduce lại thành dạng nested dcit: `Record<number, Record<string, any[]>>` (nhóm theo Gen, sau đó nhóm theo Branch ID).

- **Tái cấu trúc vòng lặp render ở View Mode "grid":**
  1. Giữ nguyên vòng lặp ngoài cùng map lặp theo `generation`.
  2. Bên trong mỗi `generation`, ta tiến hành **reduce tiếp** danh sách member theo thuộc tính `branchId`.
  3. Sử dụng state `branches` (đã fetch sẵn) để tham chiếu `branchId` thành tên thật của Cành/Nhánh (ví dụ: `branches.find(b => b.id === id)?.name || "Chưa phân Chi/Nhánh"`).
  4. Lặp render các Sub-header cho mỗi Chi/Nhánh (VD chữ nhỏ mờ hơn: `⮑ Nhánh Trưởng`).
  5. Đưa component `<MemberCard />` vào trong đúng vòng lặp subgroup.

- **Tái cấu trúc ở View Mode "list":**
  1. (Tùy chọn) Hiện tại List view chỉ render dàn phẳng. Nếu muốn đồng bộ, ta có thể áp dụng tương tự logic lồng nhau hoặc chèn thêm header giữa các phần tử list. Ở đây ta ưu tiên làm mạnh ở Grid View trước.

### 2. Về mặt UI/UX Design Mới
- **Generation Header:** Giữ nguyên line chia cắt mạnh và to (ví dụ: **Đời thứ 2**)
- **Branch Sub-Header:** Một thẻ tiêu đề phụ mỏng hơn, có icon góc cây hoặc đường dẫn (ví dụ: `<TreeDeciduous /> Chi 2`) nằm dưới Generation Header một chút để tạo thị giác Master-Detail phân cấp.

---

## 🔴 User Review Required

> [!IMPORTANT]  
> Xin bạn hãy xác nhận một số vấn đề rẽ nhánh sau:
> 1. Ở góc nhìn Dạng Danh Sách (`List view`), bạn có muốn áp dụng cơ chế phân nhóm 2 cấp này luôn không, hay chỉ cần sắp xếp theo Đời và Cành là đủ?
> 2. Với cụm từ "Chưa phân Chi/Nhánh", bạn có muốn đặt nó nằm cuối cùng trong từng Đời thứ X không?

---

## Checklist Triển Khai (Verification Plan)
- [ ] Logic reduce mảng thành lưới 2 chiều hoạt động không lỗi.
- [ ] Map đúng tên nhánh từ biến `branches`.
- [ ] Giao diện (UI) phân bổ khoảng cách spacing giữa các nhánh và các đời không bị rối mắt.
- [ ] Tính năng Search & Filter vẫn hoạt động khớp với data đã map.
