const express = require('express');
const path = require('path');
const { parseInventoryData } = require('./src/aiService');
const { saveToSheets } = require('./src/googleSheets');

const app = express();

// Middleware để đọc JSON từ request body
app.use(express.json());

// Phục vụ các file tĩnh (CSS, JS, Hình ảnh) trong thư mục public
app.use(express.static(path.join(__dirname, 'public')));

// --- CÁCH SỬA LỖI CANNOT GET / ---
// Khi Đạt truy cập tên miền chính, server sẽ trả về file admin.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Cổng 1: AI Phân tích thông tin từ văn bản của Đạt
app.post('/api/admin/analyze', async (req, res) => {
    const { password, data } = req.body;
    
    // Kiểm tra mật khẩu (lấy từ Environment Variables trên Render)
    if (password !== process.env.ADMIN_PASSWORD) {
        console.warn("⚠️ Cảnh báo: Có người thử nhập sai mật khẩu!");
        return res.json({ success: false, message: "❌ Sai mật khẩu quản lý!" });
    }

    try {
        console.log("🤖 Đang gửi dữ liệu cho AI bóc tách...");
        const result = await parseInventoryData(data);
        
        if (!result) throw new Error("AI không phản hồi dữ liệu phù hợp.");
        
        console.log("✅ AI bóc tách thành công:", result);
        res.json({ success: true, ...result });
    } catch (e) {
        console.error("❌ Lỗi AI Service:", e.message);
        res.json({ success: false, message: "Lỗi AI: " + e.message });
    }
});

// Cổng 2: Lưu dữ liệu chính thức vào Google Sheets
app.post('/api/admin/save', async (req, res) => {
    try {
        const productData = req.body.product;
        console.log("📊 Đang ghi vào Google Sheets:", productData);
        
        await saveToSheets(productData);
        
        console.log("✅ Ghi Sheets thành công!");
        res.json({ success: true, message: "✅ Đã nhập kho thành công!" });
    } catch (err) {
        console.error("❌ Lỗi Google Sheets:", err.message);
        res.json({ success: false, message: "❌ Lỗi Sheets: " + err.message });
    }
});

// Cấu hình Port linh hoạt cho Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Hệ thống Nhập Kho Hương Kid đang chạy tại: http://localhost:${PORT}`);
    console.log(`📡 Trên Render: https://kho-hhe7.onrender.com`);
});
