# KHO
/ (Thư mục gốc)
├── index.js
├── package.json
├── public/
│   └── admin.html
└── src/
    ├── aiService.js
    └── googleSheets.js
📋 Tổng Quan Dự Án
Mục tiêu: Tạo một công cụ quản lý nhập kho độc lập, sử dụng AI để bóc tách dữ liệu tự nhiên và ghi trực tiếp vào Google Sheets.

Công nghệ sử dụng: Node.js (Backend), Gemini 2.0 Flash (AI), Google Sheets API (Lưu trữ), ImgBB API (Lưu ảnh).

🏗️ Cấu Trúc Hệ Thống (4 File Chính)
index.js (Thư mục gốc): * Đóng vai trò "tổng đài" điều hướng.

Có 2 Route chính: /api/admin/analyze (Gọi AI) và /api/admin/save (Ghi Sheets).

src/aiService.js:

Gửi văn bản thô của Đạt lên Gemini.

Yêu cầu AI trả về đúng định dạng JSON: ten, gia, size, mota, anh.

src/googleSheets.js:

Dùng google-spreadsheet và JWT để kết nối.

Hàm saveToSheets sẽ ghi một dòng mới vào file Excel của shop.

public/admin.html:

Giao diện nhập liệu có mật khẩu bảo vệ.

Tính năng đặc biệt: Có nút 📷 chụp ảnh/chọn ảnh, tự động upload lên ImgBB và lấy link điền vào form.

🛠️ Các Thông Số Cấu Hình (Trên Render)
Để chạy được, ngày mai Đạt cần đảm bảo các biến môi trường (Environment Variables) này đã chuẩn:

ADMIN_PASSWORD: Mật khẩu đăng nhập trang admin.

OPENROUTER_API_KEY: Key gọi AI Gemini.

GOOGLE_SERVICE_ACCOUNT_EMAIL: Email từ file credentials.

GOOGLE_PRIVATE_KEY: Khóa bí mật (nhớ xử lý lỗi xuống dòng \n).

ID_FILE_PRODUCT: ID của file Google Sheets sản phẩm.

✅ Trạng Thái Hiện Tại
Chúng ta đã tách riêng phần Nhập kho ra khỏi phần Chatbot bán hàng để dễ quản lý.

Đã bổ sung file package.json để Render cài đặt thư viện (express, axios, google-spreadsheet...).

Cần lưu ý: Dòng 1 trong Google Sheets phải có các cột: Tên, Giá, Size, Mô tả, Ảnh.

Ngày mai chúng ta sẽ:

Kiểm tra Log trên Render xem có lỗi kết nối Google Sheets không.

Test thử luồng: Nhập văn bản -> Chụp ảnh -> AI bóc tách -> Lưu Sheets.

Tối ưu hóa phần phản hồi của AI nếu Đạt muốn nó thông minh hơn.

Đạt nghỉ ngơi nhé, mai cần mình hỗ trợ kiểm tra đoạn nào đầu tiên thì cứ nhắn mình! Chúc Đạt ngủ ngon.
