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

// Tuyến đường mặc định
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API Phân tích AI
app.post('/api/admin/analyze', async (req, res) => {
    try {
        const { password, data } = req.body;
        if (password !== process.env.ADMIN_PASSWORD) {
            return res.json({ success: false, message: "Sai mật khẩu!" });
        }
        const result = await parseInventoryData(data);
        res.json({ success: true, ...result });
    } catch (e) {
        res.json({ success: false, message: e.message });
    }
});

// API Upload ảnh trung gian
app.post('/api/admin/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.json({ success: false, message: "Không có file" });
        const formData = new FormData();
        formData.append('image', req.file.buffer.toString('base64'));
        const response = await axios.post(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, formData, {
            headers: formData.getHeaders()
        });
        res.json(response.data);
    } catch (error) {
        res.json({ success: false, message: "Lỗi tải ảnh" });
    }
});

// API Lưu vào Sheets
app.post('/api/admin/save', async (req, res) => {
    try {
        const { password, product } = req.body;
        if (password !== process.env.ADMIN_PASSWORD) return res.json({ success: false });
        await saveToSheets(product);
        res.json({ success: true, message: "Đã lưu thành công!" });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
