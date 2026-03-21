const express = require('express');
const path = require('path');
const { parseInventoryData } = require('./src/aiService');
const { saveToSheets } = require('./src/googleSheets');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Tuyến đường trang chủ
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Cổng 1: AI Phân tích - Đảm bảo đường dẫn này khớp với Front-end
app.post('/api/admin/analyze', async (req, res) => {
    console.log("📩 Nhận yêu cầu phân tích từ trình duyệt...");
    const { password, data } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, message: "Sai mật khẩu!" });
    }

    try {
        const result = await parseInventoryData(data);
        console.log("✅ AI đã xử lý xong:", result);
        // Trả về thẳng dữ liệu
        res.json({ 
            success: true, 
            ten: result.ten, 
            gia: result.gia, 
            size: result.size, 
            anh: result.anh 
        });
    } catch (e) {
        console.error("❌ Lỗi tại Server:", e.message);
        res.status(500).json({ success: false, message: "Lỗi Server nội bộ" });
    }
});

// Giữ các cổng Save và Upload như cũ...
// ...

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server ok tại Port ${PORT}`));
