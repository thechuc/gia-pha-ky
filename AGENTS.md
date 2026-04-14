<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## 🧬 Project Protocol
Before modifying this project, you **MUST** read:
1. `GEMINI.md` (Root Protocol)
2. `ARCHITECTURE.md` & `BUSINESS_LOGIC.md`
3. `.agent/guidelines/*.md` (Specific module rules)
## 🎨 UI/UX Protocol
- **TUYỆT ĐỐI KHÔNG** sử dụng `alert()` hay `confirm()` bản địa của trình duyệt. 
- Luôn sử dụng `ConfirmModal` cho các xác nhận quan trọng và `showToast` cho các thông báo nhanh.
- Xem chi tiết tại: `[.agent/guidelines/UI_DESIGN_SYSTEM.md]`
<!-- END:nextjs-agent-rules -->
