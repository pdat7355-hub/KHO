require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const multer = require('multer');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const app = express();
const upload = multer();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- CẤU HÌNH ---
const ADMIN_PASS = process.env.ADMIN_PASSWORD;
const IMGBB_KEY = process.env.IMGBB_API_KEY;
const SHEET_ID = process.env.ID_FILE_PRODUCT;

const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : null,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// ==========================================
// 1. KỊCH BẢN BÓC TÁCH DỮ LIỆU (THAY THẾ AI)
// ==========================================
function smartParse(text) {
    // Mặc định ban đầu
    let res = { ten: "", gia: "", size: "", anh: "" };

    // 1. Tìm giá (Tìm số đi kèm chữ k, K, hoặc vnđ, hoặc số đứng sau chữ 'giá')
    const priceMatch = text.match(/(\d+)\s*(k|K|vnđ|vnd|ngàn)/i) || text.match(/giá\s*(\d+)/i);
    if (priceMatch) res.gia = priceMatch[1] + "k";

    // 2. Tìm size (Tìm chữ size + số, hoặc s+số)
    const sizeMatch = text.match(/size\s*(\d+)/i) || text.match(/s(\d+)/i);
    if (sizeMatch) res.size = sizeMatch[1];

    // 3. Tìm tên sản phẩm 
    // Giả sử Đạt viết: "Váy công chúa 180k size 5" -> Tên sẽ là phần trước giá hoặc size
    let namePart = text.split(/(\d+k|size|giá)/i)[0].trim();
    res.ten = namePart || "Sản phẩm mới";

    return res;
}

// ==========================================
// 2. CÁC ROUTE XỬ LÝ
// ==========================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Route bóc tách bằng kịch bản
app.post('/api/admin/analyze', (req, res) => {
    const { password, data } = req.body;
    if (password !== ADMIN_PASS) return res.json({ success: false, message: "Sai mật khẩu" });

    try {
        const result = smartParse(data);
        res.json({ success: true, ...result });
    } catch (e) {
        res.json({ success: false, message: "Không hiểu kịch bản này" });
    }
});

// Route tải ảnh lên ImgBB
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

// Route lưu vào Sheets
app.post('/api/admin/save', async (req, res) => {
    try {
        const { password, product } = req.body;
        if (password !== ADMIN_PASS) return res.json({ success: false, message: "Sai mật khẩu" });

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
        res.json({ success: false, message: "Lỗi lưu Sheets" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Shop Hương Kid chạy bằng Kịch Bản tại cổng ${PORT}`));
