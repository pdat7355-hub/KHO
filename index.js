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
// 1. CẤU HÌNH BIẾN MÔI TRƯỜNG
// ==========================================
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY ? process.env.GOOGLE_AI_KEY.trim() : null;
const ADMIN_PASS = process.env.ADMIN_PASSWORD;
const IMGBB_KEY = process.env.IMGBB_API_KEY;
const SHEET_ID = process.env.ID_FILE_PRODUCT;

const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : null,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// ==========================================
// 2. HÀM AI BÓC TÁCH (DÙNG MODEL 1.5 FLASH ĐỂ CÓ QUOTA CAO)
// ==========================================
async function aiAnalyze(userInput) {
    if (!GOOGLE_AI_KEY) throw new Error("Chưa có GOOGLE_AI_KEY trên Render!");

    try {
        const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);
        // Chuyển sang 1.5-flash để tránh lỗi 429 (vượt hạn mức)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Bạn là trợ lý kho Hương Kid. Hãy phân tích nội dung sau thành JSON:
        {"ten": "Tên sản phẩm", "gia": "Giá tiền", "size": "Kích cỡ", "anh": ""}.
        Lưu ý: Chỉ trả về JSON thuần, không giải thích.
        Nội dung: "${userInput}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        
        console.log("✅ Kết quả AI:", text);
        return JSON.parse(text);
    } catch (e) {
        console.error("❌ Lỗi AI:", e.message);
        throw e;
    }
}

// ==========================================
// 3. CÁC ĐƯỜNG DẪN (ROUTES)
// ==========================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Bước 1: Phân tích văn bản
app.post('/api/admin/analyze', async (req, res) => {
    try {
        const { password, data } = req.body;
        if (password !== ADMIN_PASS) return res.json({ success: false, message: "Sai mật khẩu!" });
        
        const result = await aiAnalyze(data);
        res.json({ success: true, ...result });
    } catch (e) {
        res.json({ success: false, message: "AI đang bận, Đạt đợi 10 giây rồi bấm lại nhé!" });
    }
});

// Bước 2: Tải ảnh lên ImgBB
app.post('/api/admin/upload', upload.single('image'), async (req, res) => {
    try {
        const body = new URLSearchParams();
        body.append('image', req.file.buffer.toString('base64'));
        const response = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, body);
        res.json(response.data);
    } catch (e) {
        res.json({ success: false, message: "Lỗi tải ảnh" });
    }
});

// Bước 3: Lưu vào Google Sheets
app.post('/api/admin/save', async (req, res) => {
    try {
        const { password, product } = req.body;
        if (password !== ADMIN_PASS) return res.json({ success: false, message: "Sai mật khẩu!" });

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

        res.json({ success: true, message: "✅ Đã lưu kho thành công!" });
    } catch (e) {
        res.json({ success: false, message: "Lỗi lưu Sheets: " + e.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Hệ thống Hương Kid đã sẵn sàng tại cổng ${PORT}`);
});
