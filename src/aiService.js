const axios = require('axios');

async function parseInventoryData(userInput) {
    try {
        // Ưu tiên lấy Key từ Render (Environment Variables), nếu không có mới dùng Key dự phòng
        const apiKey = process.env.OPENROUTER_API_KEY || "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";
        
        console.log("📡 Đang gửi dữ liệu sang Gemini 2.0 Flash...");

        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: "google/gemini-2.0-flash-001",
            messages: [
                {
                    role: "system",
                    content: "Bạn là trợ lý kho Hương Kid. Nhiệm vụ: Trích xuất thông tin sản phẩm từ tin nhắn thành JSON thuần. Định dạng: {\"ten\": \"...\", \"gia\": \"...\", \"size\": \"...\", \"anh\": \"\"}. Không giải thích, không thêm văn bản thừa."
                },
                {
                    role: "user",
                    content: userInput
                }
            ]
        }, {
            headers: {
                "Authorization": `Bearer ${apiKey.trim()}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://render.com", // Bắt buộc có để OpenRouter chấp nhận
                "X-Title": "Huong Kid Inventory"
            },
            timeout: 15000
        });

        if (response.data && response.data.choices && response.data.choices[0]) {
            let aiText = response.data.choices[0].message.content;
            
            // Làm sạch chuỗi JSON (xóa ```json và ```)
            aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
            
            console.log("✅ AI bóc tách thành công:", aiText);
            
            const finalData = JSON.parse(aiText);
            return { success: true, ...finalData };
        } else {
            return { success: false, message: "AI trả về dữ liệu không xác định" };
        }

    } catch (error) {
        let status = error.response ? error.response.status : "Unknown";
        let detail = error.response ? JSON.stringify(error.response.data) : error.message;
        
        console.error(`❌ Lỗi AI (${status}):`, detail);
        
        return { 
            success: false, 
            message: `Lỗi AI (${status}). Đạt kiểm tra lại số dư tài khoản OpenRouter nhé!` 
        };
    }
}

module.exports = { parseInventoryData };
