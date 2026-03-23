const axios = require('axios');

async function parseInventoryData(userInput) {
    try {
        // Đảm bảo OPENROUTER_API_KEY đã được load từ process.env
        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: "google/gemini-2.0-flash-001",
            messages: [
                {
                    role: "system",
                    content: "Bạn là trợ lý kho chuyên nghiệp. Nhiệm vụ của bạn là trích xuất thông tin từ tin nhắn người dùng thành JSON. Định dạng: {\"ten\": \"...\", \"gia\": \"...\", \"size\": \"...\", \"anh\": \"\"}. CHỈ TRẢ VỀ JSON thuần, không giải thích."
                },
                {
                    role: "user",
                    content: userInput
                }
            ]
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, // Kiểm tra kỹ biến này trên Render
                "Content-Type": "application/json"
            }
        });

        let text = response.data.choices[0].message.content;
        
        // Làm sạch chuỗi JSON nếu AI trả về kèm ký tự lạ
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        console.log("🤖 AI bóc tách:", text);
        
        const parsedData = JSON.parse(text);
        return { success: true, ...parsedData }; // Thêm success: true để Frontend nhận biết
        
    } catch (error) {
        console.error("❌ Lỗi gọi OpenRouter:", error.response ? error.response.data : error.message);
        return { 
            success: false, 
            message: "AI không phản hồi, Đạt kiểm tra lại Key OpenRouter và cấu hình trên Render nhé!" 
        };
    }
}

module.exports = { parseInventoryData };
