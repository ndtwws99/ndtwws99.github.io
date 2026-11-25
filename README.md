# Twin — Mạng xã hội cho GitHub Pages (Firebase + Cloudinary)

## Cấu trúc thư mục
- `index.html` — Bảng tin chính (Stories, đăng bài, 6 cảm xúc, bình luận, Twin Chat)
- `login.html` — Đăng nhập & Đăng ký tài khoản
- `profile.html` — Trang cá nhân (đổi ảnh đại diện, ảnh bìa, tiểu sử, xem người khác qua `?uid=...`)
- `friends.html` — Lời mời kết bạn, danh sách bạn bè & gợi ý kết bạn
- `groups.html` — Tạo nhóm, tham gia/rời nhóm và đăng bài trong nhóm
- `pages.html` — Tạo Trang (Pages) và theo dõi Trang
- `saved.html` — Bài viết đã lưu
- `404.html` — Trang báo lỗi 404 tự động của GitHub Pages
- `assets/css/twin.css` — Giao diện chung (Light/Dark mode, Responsive PC & Mobile)
- `assets/js/config.js` — Cấu hình tập trung Firebase & Cloudinary
- `assets/js/firebase-service.js` — Kết nối Firebase Auth, Firestore & Cloudinary Upload API
- `assets/js/layout.js` — Header, Thông báo realtime, Twin Chat nổi & Footer dùng chung cho mọi trang
- `assets/js/post-ui.js` — Thành phần hiển thị bài viết dùng chung
- `firestore.rules` — Quy tắc bảo mật mẫu cho Cloud Firestore

## Cách triển khai nhanh lên GitHub Pages
1. Mở `assets/js/config.js` và điền `firebaseConfig` cùng `cloudinaryConfig` (chế độ **Unsigned Upload Preset**).
2. Trên Firebase Console:
   - Bật **Authentication → Email/Password**.
   - Tạo **Cloud Firestore** và dán nội dung từ `firestore.rules` vào tab **Rules**.
3. Đẩy toàn bộ thư mục lên repository GitHub và bật **Settings → Pages → Deploy from branch (main / root)**.
