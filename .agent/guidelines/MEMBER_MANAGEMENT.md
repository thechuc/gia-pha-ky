# AI Guideline: Quản lý Thành viên (Member Management)

Tài liệu này định nghĩa các quy tắc khi thao tác với dữ liệu thành viên và các mối quan hệ gia phả trong DB và UI.

## 1. Ràng buộc Quan hệ (Relationship Constraints)

Khi thực hiện các Server Actions liên quan đến quan hệ, AI phải kiểm tra:
- **Cha/Mẹ - Con (`PARENT_CHILD`)**:
  - Không cho phép gán một người làm cha/mẹ của chính mình.
  - Phải tự động tăng `generation` cho node Target.
  - Khi thêm con, nếu đã chọn Cha, hãy kiểm tra xem có Vợ (Spouse) hiện tại không để gợi ý Mother ID.
- **Vợ/Chồng (`SPOUSE`)**:
  - `generation` của hai người phải bằng nhau.
  - Quan hệ `SPOUSE` là quan hệ đối xứng trong DB nhưng được biểu diễn qua `sourceMemberId` và `targetMemberId`.

## 2. Quy trình Cập nhật Dữ liệu (Data Update Flow)

Mọi thao tác thay đổi dữ liệu thành viên PHẢI tuân thủ:
1. Thực hiện qua Server Action tại `src/app/actions/members.ts`.
2. Sử dụng `revalidatePath('/dashboard/tree')` hoặc các path liên quan để làm mới cache dữ liệu.
3. Trong UI Cây, phải gọi `onRefresh` (callback từ `FamilyTreeNew`) để fetch lại dữ liệu mới nhất sau khi đóng Modal thành công.

## 3. Quản lý Đời & Chi (Generation & Branch)

- **Đời**: Luôn là số nguyên dương >= 1.
- **Chi**: Khi thêm thành viên mới, mặc định kế thừa `branch` từ cha/mẹ nếu có. Quản trị viên có quyền ghi đè (override) giá trị này.
- **Thứ tự anh em**: Khi thêm con mới, `birthOrder` mặc định là `count(siblings) + 1`.

## 4. Xử lý Trình trạng Sống/Mất

- Nếu `isAlive = false`:
  - Yêu cầu nhập ngày mất (`dateOfDeath`).
  - Giao diện thẻ thành viên phải hiển thị dải băng đen và biểu tượng `†`.
  - Logic tính tuổi phải sử dụng `deathDate - birthDate` thay vì `now - birthDate`.

## 5. Đồng bộ hóa Media

- Hình ảnh thành viên (Avatar) và tài liệu đính kèm phải được quản lý qua `src/app/actions/documents.ts`.
- Không xóa file vật lý trên server nếu chưa xóa bản ghi tương ứng trong Database.

---
*AI chú ý: Các nghiệp vụ về quan hệ họ hàng rất nhạy cảm. Luôn kiểm tra kỹ các ID đầu vào (FatherId, MotherId, SpouseId) để tránh tạo ra dữ liệu rác hoặc vòng lặp quan hệ vô hạn.*
