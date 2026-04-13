# PLAN: Quản Lý Thành Viên — Trang `/dashboard/members`

> **Mục tiêu:** Xây dựng hoàn chỉnh trang quản lý thành viên — chức năng CRUD đầy đủ, tích hợp với database Prisma, giao diện premium hiện đại phù hợp với design system "Modern Heritage" hiện có.

---

## 📊 Phân Tích Hiện Trạng

### Đã hoàn thành ✅
| Module | Trạng thái | Ghi chú |
|--------|-----------|---------|
| Landing Page | ✅ Hoàn thành | Navbar, Hero, Features, Footer |
| Dashboard Layout | ✅ Hoàn thành | Sidebar + Header, routing `/dashboard` |
| Overview Page | ✅ Hoàn thành | Family info, Timeline, Documents, modals CRUD |
| Family Tree (ReactFlow) | ✅ Hoàn thành | 11 thế hệ, MemberNode, UnionNode, MemberDetailPanel, kinship calculator |
| Prisma Schema | ✅ Hoàn thành | Full schema: User, Family, FamilyMember, Relationship, Event, Document, etc. |
| Server Actions | ✅ Hoàn thành | `getOverviewData`, `addEvent`, `addDocument`, `seedDatabase` |
| File Upload API | ✅ Hoàn thành | `/api/upload` endpoint |

### Chưa triển khai ❌
| Module | Sidebar link | Ưu tiên |
|--------|-------------|---------|
| **Trang Thành viên** (`/dashboard/members`) | ✅ Có link | 🔴 **CAO — Triển khai tiếp theo** |
| Trang Sự kiện & Ngày giỗ (`/dashboard/events`) | ✅ Có link | 🟡 Trung bình |
| Trang Tài liệu số (`/dashboard/documents`) | ✅ Có link | 🟡 Trung bình |
| Cài đặt (`/dashboard/settings`) | Có nút | 🟢 Thấp |
| Authentication (NextAuth) | Schema sẵn | 🟡 Trung bình |

---

## 🎯 Scope: Trang Quản Lý Thành Viên

### Tính năng cốt lõi

#### 1. Danh sách thành viên (Members List)
- **Grid/List toggle view** — Hiển thị dạng card grid hoặc danh sách compact
- **Search & Filter** — Tìm kiếm theo tên, lọc theo đời (generation), giới tính, trạng thái (còn sống/đã khuất), nhánh (branch)
- **Sort** — Sắp xếp theo tên, đời, ngày sinh, ngày tạo
- **Statistics bar** — Tổng thành viên, số đời, nam/nữ, còn sống/đã khuất
- **Pagination** hoặc infinite scroll

#### 2. Thêm thành viên mới (Add Member Modal)
- Form đầy đủ: Họ tên, giới tính, ngày sinh, ngày mất, nghề nghiệp, nơi sinh, nơi ở hiện tại, avatar
- Chọn **đời (generation)** và **nhánh (branch)**
- Chọn **quan hệ** với thành viên hiện có (cha/mẹ, vợ/chồng)
- Upload avatar
- Tiểu sử (textarea)

#### 3. Chi tiết & chỉnh sửa thành viên (Member Detail / Edit)
- Xem thông tin đầy đủ trong slide panel (tái sử dụng pattern MemberDetailPanel)
- Inline edit mode — toggle giữa view/edit
- Tab: Thông tin | Quan hệ | Sự kiện
- Save/Cancel actions

#### 4. Xóa thành viên
- Confirm dialog trước khi xóa
- Hiển thị cảnh báo cascade effects
- Xác nhận bằng gõ tên

---

## 📁 Proposed Changes

### Server Actions Layer

#### [NEW] [members.ts](file:///d:/MyWorks/gia-pha-ky/src/app/actions/members.ts)
- `getMembers(filters?)` — Query danh sách thành viên với filter/search/sort, kèm relationships
- `getMemberById(id)` — Lấy chi tiết 1 thành viên kèm relationships, events
- `addMember(data)` — Tạo thành viên mới + tạo relationships nếu có
- `updateMember(id, data)` — Cập nhật thông tin thành viên
- `deleteMember(id)` — Xóa thành viên (cascade relationships)
- `getBranches()` — Lấy danh sách nhánh
- `getMemberStats()` — Thống kê: tổng thành viên, nam/nữ, còn sống/đã khuất, số đời

---

### Route & Page Layer

#### [NEW] [page.tsx](file:///d:/MyWorks/gia-pha-ky/src/app/dashboard/members/page.tsx)
- Server component page — import DashboardHeader + MembersPage

---

### Component Layer (7 components)

#### [NEW] [MembersPage.tsx](file:///d:/MyWorks/gia-pha-ky/src/components/members/MembersPage.tsx)
- **Main orchestrator component** (client component)
- State: members, filters, view mode, selected member, modals
- Statistics bar (4 stat cards animated with Framer Motion)
- Renders: MemberFilters → MemberCard/MemberListItem grid → Modals
- Floating "Thêm thành viên" FAB button

#### [NEW] [MemberCard.tsx](file:///d:/MyWorks/gia-pha-ky/src/components/members/MemberCard.tsx)
- **Card component cho Grid view**
- Avatar (Dicebear fallback), tên, đời, nghề nghiệp, trạng thái sống/khuất
- Hover: elevation + border-primary, quick action icons (edit/delete/view tree)
- Male/Female color coding consistent with MemberNode

#### [NEW] [MemberListItem.tsx](file:///d:/MyWorks/gia-pha-ky/src/components/members/MemberListItem.tsx)
- **Row component cho List view**  
- Compact: avatar nhỏ + tên + đời + giới tính badge + nghề + trạng thái + actions

#### [NEW] [MemberFilters.tsx](file:///d:/MyWorks/gia-pha-ky/src/components/members/MemberFilters.tsx)
- Search input (debounced 300ms)
- Generation dropdown (Tất cả | Đời 1..11)
- Gender toggle chips (Tất cả | Nam | Nữ)
- Status toggle chips (Tất cả | Còn sống | Đã khuất)
- Branch dropdown
- Sort by dropdown
- "Xóa bộ lọc" clear button
- Grid/List view toggle

#### [NEW] [AddMemberModal.tsx](file:///d:/MyWorks/gia-pha-ky/src/components/members/AddMemberModal.tsx)
- **Full form modal thêm thành viên**
- Fields: firstName, lastName, gender, dateOfBirth, dateOfDeath, isAlive, occupation, birthPlace, currentLocation, biography, generation, branchId
- Avatar upload via `/api/upload`
- Optional relationship picker: chọn cha/mẹ hoặc vợ/chồng từ dropdown thành viên hiện có
- Validation + submit via server action `addMember`
- Consistent modal pattern với `AddEventModal` existing

#### [NEW] [EditMemberPanel.tsx](file:///d:/MyWorks/gia-pha-ky/src/components/members/EditMemberPanel.tsx)
- **Slide-in panel (reuse MemberDetailPanel pattern)**
- View mode → hiển thị info (tái sử dụng style)
- Edit mode → inline form fields
- Tab: Thông tin | Quan hệ | Sự kiện đời
- Save/Cancel + xóa thành viên shortcut
- Framer Motion slide animation

#### [NEW] [DeleteMemberDialog.tsx](file:///d:/MyWorks/gia-pha-ky/src/components/members/DeleteMemberDialog.tsx)
- Confirm dialog: hiển thị avatar + tên + cảnh báo cascade
- Yêu cầu gõ tên thành viên để xác nhận
- Nút "Xóa vĩnh viễn" màu đỏ

---

## 🎨 Design Direction

### Modern Heritage Design System (nhất quán với existing)
- **Colors**: primary `#5C1E1E`, secondary `#D4AF37`, parchment `#F9F5EB`, foreground `#1A0F0F`
- **Typography**: `Playfair Display` (headings), `Inter` (body)
- **Border radius**: `rounded-2xl` / `rounded-3xl` cho cards, `rounded-xl` cho buttons/inputs
- **Shadows**: `shadow-sm` default, `shadow-xl shadow-primary/5` on hover
- **Animations**: Framer Motion cho staggered card entrance, list transitions
- **Patterns**: Stat cards gradient, `bg-parchment` texture, `border-heritage` accents

### Male/Female Visual Coding
- **Nam**: `bg-primary/5 border-primary/20 text-primary` (Deep Red family)
- **Nữ**: `bg-rose-50 border-rose-200 text-rose-700` (Rose family)
- Consistent với `MemberNode.tsx` và `MemberDetailPanel.tsx`

### Responsive Breakpoints
- `lg (≥1024)`: Grid 3-4 columns
- `md (768-1023)`: Grid 2 columns  
- `sm (<768)`: Single column, collapsible filters

---

## ⚙️ Technical Decisions

> [!IMPORTANT]
> ### Data Source: Database (Prisma) — NOT mock data
> Trang Members sẽ query trực tiếp từ database qua Server Actions (giống OverviewPage), khác với FamilyTree hiện dùng mock data hardcoded. Đảm bảo data consistency.

> [!WARNING]
> ### FamilyTree vẫn dùng mock data
> Hiện tại `FamilyTree.tsx` hardcode `GENERATION_DATA`. Trong scope này, chúng ta **KHÔNG** refactor FamilyTree sang database. Đó là task riêng biệt sau này.

### Filter Strategy
- **Client-side filtering** — vì dataset gia phả thường <500 thành viên
- Fetch all members 1 lần, filter/sort/search trên client
- Nếu cần, có thể chuyển sang server-side sau

### State Management
- `useState` cho filter state, view mode, modal state
- `useOptimistic` cho instant UI feedback khi add/delete
- `revalidatePath` sau mỗi mutation

---

## 🔲 Task Breakdown (4 Phases)

### Phase 1: Foundation
- [ ] Tạo `src/app/actions/members.ts` — All CRUD server actions
- [ ] Tạo `src/app/dashboard/members/page.tsx` — Route page

### Phase 2: Core UI
- [ ] Tạo `MembersPage.tsx` — Main orchestrator + Statistics bar
- [ ] Tạo `MemberCard.tsx` — Grid card component
- [ ] Tạo `MemberListItem.tsx` — List row component  
- [ ] Tạo `MemberFilters.tsx` — Search + Filters bar

### Phase 3: CRUD Modals
- [ ] Tạo `AddMemberModal.tsx` — Form thêm thành viên mới
- [ ] Tạo `EditMemberPanel.tsx` — Panel xem/chỉnh sửa
- [ ] Tạo `DeleteMemberDialog.tsx` — Confirm dialog xóa

### Phase 4: Polish
- [ ] Framer Motion staggered animations
- [ ] Skeleton loading states  
- [ ] Empty state với illustration
- [ ] Error handling & toast feedback
- [ ] Link "Xem trên cây gia phả" → navigate `/dashboard/tree`

---

## ✅ Verification Plan

### Build Check
```bash
npm run build
```

### Browser Verification
1. `/dashboard/members` → hiển thị danh sách thành viên từ database
2. Search "Ngô" → filter realtime
3. Filter đời 1-3 → chỉ hiện 3 đời đầu
4. Toggle Grid ↔ List → layout chuyển đúng
5. "Thêm thành viên" → modal → điền form → submit → thành viên mới hiện
6. Click thành viên → panel chi tiết mở
7. "Chỉnh sửa" → form edit → save → cập nhật
8. "Xóa" → confirm dialog → xóa thành công
9. Responsive resize → layout adapt đúng

---

## 🧭 Agent Assignments

| Task | Agent |
|------|-------|
| Server Actions (Prisma) | `backend-specialist` |
| UI Components & Design | `frontend-specialist` |
| Integration | `orchestrator` |

---

## ❓ Open Questions

> [!IMPORTANT]
> 1. **Avatar upload**: Tiếp tục dùng `/api/upload` lưu local (folder `public/uploads/`) — OK chứ?
> 2. **Relationship picker**: Khi thêm thành viên mới, cho phép chọn quan hệ ngay trong modal (cha/mẹ, vợ/chồng) hay tách thành bước riêng sau khi tạo?
> 3. **Thống kê**: Stat cards đếm realtime từ DB mỗi lần load page — chấp nhận được?
