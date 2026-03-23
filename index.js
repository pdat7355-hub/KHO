require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const app = express();
const upload = multer();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 1. CẤU HÌNH BIẾN MÔI TRƯỜNG (Lấy từ Render)
// ==========================================
// Đạt nhớ đặt tên biến trên Render là: GOOGLE_AI_KEY
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY ? process.env.GOOGLE_AI_KEY.trim() : null;
const ADMIN_PASS = process.env.ADMIN_PASSWORD;
const IMGBB_KEY = process.env.IMGBB_API_KEY;
const SHEET_ID = process.env.ID_FILE_PRODUCT;

// Cấu hình xác thực Google Sheets
const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : null,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// ==========================================
// 2. HÀM AI BÓC TÁCH DỮ LIỆU (Dùng Gemini Free)
// ==========================================
async function aiAnalyze(userInput) {
    if (!GOOGLE_AI_KEY) {
        throw new Error("Chưa cấu hình GOOGLE_AI_KEY trên Render!");
    }

    try {
        const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);
        // Dùng bản flash cho nhanh và miễn phí
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `Bạn là trợ lý kho Hương Kid. Nhiệm vụ: Phân tích nội dung tin nhắn thành JSON chuẩn.
        Định dạng: {"ten": "Tên sản phẩm", "gia": "Giá tiền", "size": "Kích cỡ", "anh": ""}.
        Lưu ý: Chỉ trả về duy nhất chuỗi JSON, không giải thích, không thêm chữ.
        Nội dung: "${userInput}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        
        console.log("✅ AI Response:", text);
        return JSON.parse(text);
    } catch (e) {
        console.error("❌ Lỗi AI Studio:", e.message);
        throw e;
    }
}

// ==========================================
// 3. CÁC ROUTE XỬ LÝ
// ==========================================

// Trang chủ Admin
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// BƯỚC 1: Phân tích nội dung bằng AI
app.post('/api/admin/analyze', async (req, res) => {
    try {
        const { password, data } = req.body;
        if (password !== ADMIN_PASS) return res.json({ success: false, message: "Sai mật khẩu!" });
        
        const result = await aiAnalyze(data);
        res.json({ success: true, ...result });
    } catch (e) {
        res.json({ success: false, message: "Lỗi AI: " + e.message });
    }
});

// BƯỚC 2: Tải ảnh lên ImgBB (Nếu Đạt có chọn ảnh)
app.post('/api/admin/upload', upload.single('image'), async (req, res) => {
    try {
        const body = new URLSearchParams();
        body.append('image', req.file.buffer.toString('base64'));
        const response = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, body);
        res.json(response.data);
    } catch (e) {
        res.json({ success: false, message: "Lỗi tải ảnh lên ImgBB" });
    }
});

// BƯỚC 3: Lưu dữ liệu cuối cùng vào Google Sheets
app.post('/api/admin/save', async (req, res) => {
    try {
        const { password, product } = req.body;
        if (password !== ADMIN_PASS) return res.json({ success: false, message: "Sai mật khẩu lưu!" });

        const doc = new GoogleSpreadsheet(SHEET_ID, auth);
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];

        await sheet.addRow({
            'Tên': product.ten,
            'Giá': product.gia,
            'Size': product.size,
            'Ảnh': product.anh,
            'Ngày': new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        });

        res.json({ success: true, message: "✅ Lưu kho thành công!" });
    } catch (e) {
        res.json({ success: false, message: "Lỗi lưu Sheets: " + e.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Hệ thống Hương Kid Online tại cổng ${PORT}`);
    console.log(`🔑 Trạng thái Key AI: ${GOOGLE_AI_KEY ? "Đã nạp" : "CHƯA CÓ"}`);
});
