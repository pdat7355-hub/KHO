const express = require('express');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const { parseInventoryData } = require('./src/aiService');
const { saveToSheets } = require('./src/googleSheets');

const app = express();
const upload = multer(); // Xử lý file ảnh từ camera

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Trang chủ
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Cổng 1: AI Phân tích dữ liệu
app.post('/api/admin/analyze', async (req, res) => {
    const { password, data } = req.body;
    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, message: "Sai mật khẩu quản lý!" });
    }
    try {
        const result = await parseInventoryData(data);
        res.json({ success: true, ...result });
    } catch (e) {
        res.status(500).json({ success: false, message: "Lỗi AI: " + e.message });
    }
});

// Cổng TRUNG GIAN: Tải ảnh lên ImgBB (Bảo mật Key trên Render)
app.post('/api/admin/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "Chưa có ảnh" });
        
        const formData = new FormData();
        formData.append('image', req.file.buffer.toString('base64'));
        
        const response = await axios.post(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, formData, {
            headers: formData.getHeaders()
        });
        
        res.json(response.data);
    } catch (error) {
        console.error("Lỗi Upload:", error.message);
        res.status(500).json({ success: false, message: "Server không thể gửi ảnh sang ImgBB" });
    }
});

// Cổng 2: Lưu vào Google Sheets
app.post('/api/admin/save', async (req, res) => {
    const { password, product } = req.body;
    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, message: "Sai mật khẩu!" });
    }
    try {
        await saveToSheets(product);
        res.json({ success: true, message: "✅ Đã nhập kho thành công!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi Sheets: " + err.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Hệ thống Hương Kid chạy tại Port ${PORT}`));
