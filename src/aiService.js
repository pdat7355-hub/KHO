const axios = require('axios');

async function parseInventoryData(userInput) {
    try {
        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: "google/gemini-2.0-flash-001", // Đạt có thể đổi model tùy ý ở đây
            messages: [
                {
                    role: "system",
                    content: "Bạn là trợ lý kho. Phân tích tin nhắn thành JSON: {'ten': '...', 'gia': '...', 'size': '...', 'anh': ''}. Chỉ trả về JSON."
                },
                {
                    role: "user",
                    content: userInput
                }
            ]
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        // Lấy nội dung AI trả về
        let text = response.data.choices[0].message.content;
        
        // Làm sạch dữ liệu để tránh lỗi bóc tách
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        console.log("🤖 Kết quả từ OpenRouter:", text);
        return JSON.parse(text);
    } catch (error) {
        console.error("❌ Lỗi OpenRouter:", error.response ? error.response.data : error.message);
        return { 
            success: false, 
            message: "AI không phản hồi, Đạt kiểm tra lại Key OpenRouter nhé!" 
        };
    }
}

module.exports = { parseInventoryData };
