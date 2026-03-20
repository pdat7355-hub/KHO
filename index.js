const express = require('express');
const path = require('path');
const { parseInventoryData } = require('./src/aiService');
const { saveToSheets } = require('./src/googleSheets');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cổng 1: AI Phân tích thông tin
app.post('/api/admin/analyze', async (req, res) => {
    const { password, data } = req.body;
    if (password !== process.env.ADMIN_PASSWORD) {
        return res.json({ success: false, message: "❌ Sai mật khẩu quản lý!" });
    }
    try {
        const result = await parseInventoryData(data);
        if (!result) throw new Error("AI không phản hồi");
        res.json({ success: true, ...result });
    } catch (e) {
        res.json({ success: false, message: "Lỗi AI: " + e.message });
    }
});

// Cổng 2: Lưu chính thức vào Sheets
app.post('/api/admin/save', async (req, res) => {
    try {
        await saveToSheets(req.body.product);
        res.json({ success: true, message: "✅ Đã nhập kho thành công!" });
    } catch (err) {
        res.json({ success: false, message: "❌ Lỗi Sheets: " + err.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Hệ thống Nhập Kho Hương Kid chạy tại Port ${PORT}`));
