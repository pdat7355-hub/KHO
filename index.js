const express = require('express');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const { parseInventoryData } = require('./src/aiService');
const { saveToSheets } = require('./src/googleSheets');

const app = express();
const upload = multer();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Cổng 1: AI Phân tích
app.post('/api/admin/analyze', async (req, res) => {
    const { password, data } = req.body;
    if (password !== process.env.ADMIN_PASSWORD) {
        return res.json({ success: false, message: "❌ Sai mật khẩu!" });
    }
    try {
        const result = await parseInventoryData(data);
        // Trả về thẳng các trường dữ liệu để Front-end dễ lấy
        res.json({ 
            success: true, 
            ten: result.ten, 
            gia: result.gia, 
            size: result.size, 
            anh: result.anh 
        });
    } catch (e) {
        res.json({ success: false, message: "Lỗi: " + e.message });
    }
});

// Cổng Upload ảnh qua Server (Bảo mật Key)
app.post('/api/admin/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) throw new Error("Chưa chọn ảnh");
        const formData = new FormData();
        formData.append('image', req.file.buffer.toString('base64'));
        const response = await axios.post(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, formData, {
            headers: formData.getHeaders()
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Cổng 2: Lưu vào Sheets
app.post('/api/admin/save', async (req, res) => {
    try {
        await saveToSheets(req.body.product);
        res.json({ success: true, message: "✅ Nhập kho thành công!" });
    } catch (err) {
        res.json({ success: false, message: "❌ Lỗi: " + err.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server chạy tại Port ${PORT}`));
