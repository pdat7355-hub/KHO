const express = require('express');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const { parseInventoryData } = require('./src/aiService');
const { saveToSheets } = require('./src/googleSheets');

const app = express();
const upload = multer(); // Để xử lý dữ liệu file từ Form

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Trang chủ mặc định
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Cổng 1: AI Phân tích
app.post('/api/admin/analyze', async (req, res) => {
    const { password, data } = req.body;
    if (password !== process.env.ADMIN_PASSWORD) {
        return res.json({ success: false, message: "❌ Sai mật khẩu quản lý!" });
    }
    try {
        const result = await parseInventoryData(data);
        res.json({ success: true, data: result });
    } catch (e) {
        res.json({ success: false, message: "Lỗi AI: " + e.message });
    }
});

// Cổng TRUNG GIAN: Upload ảnh lên ImgBB (Dùng Key từ Render)
app.post('/api/admin/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) throw new Error("Chưa có file ảnh");
        
        const formData = new FormData();
        // Chuyển buffer ảnh sang dạng Base64 để gửi cho ImgBB
        formData.append('image', req.file.buffer.toString('base64'));
        
        const apiKey = process.env.IMGBB_API_KEY;
        const response = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, formData, {
            headers: formData.getHeaders()
        });
        
        res.json(response.data);
    } catch (error) {
        console.error("Lỗi Upload:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Cổng 2: Lưu vào Sheets
app.post('/api/admin/save', async (req, res) => {
    try {
        await saveToSheets(req.body.product);
        res.json({ success: true, message: "✅ Đã nhập kho thành công!" });
    } catch (err) {
        res.json({ success: false, message: "❌ Lỗi Sheets: " + err.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Hệ thống chạy tại Port ${PORT}`));
