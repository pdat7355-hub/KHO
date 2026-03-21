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

app.post('/api/admin/analyze', async (req, res) => {
    try {
        const { password, data } = req.body;
        if (password !== process.env.ADMIN_PASSWORD) return res.json({ success: false, message: "Mật khẩu sai" });
        const result = await parseInventoryData(data);
        res.json({ success: true, ...result });
    } catch (e) { res.json({ success: false, message: "Lỗi AI" }); }
});

app.post('/api/admin/upload', upload.single('image'), async (req, res) => {
    try {
        const formData = new FormData();
        formData.append('image', req.file.buffer.toString('base64'));
        const response = await axios.post(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, formData, {
            headers: formData.getHeaders()
        });
        res.json(response.data);
    } catch (e) { res.json({ success: false }); }
});

app.post('/api/admin/save', async (req, res) => {
    try {
        await saveToSheets(req.body.product);
        res.json({ success: true, message: "Đã lưu vào Sheets!" });
    } catch (e) { res.json({ success: false, message: "Lỗi lưu Sheets" }); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server ok"));
