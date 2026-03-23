const axios = require('axios');

async function parseInventoryData(userInput) {
    try {
        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            // ĐÂY LÀ MODEL MIỄN PHÍ TỐT NHẤT CHO ĐẠT HIỆN TẠI
            model: "google/gemini-2.0-flash-lite-preview-02-05:free", 
            messages: [
                {
                    role: "system",
                    content: "Bạn là trợ lý kho. Phân tích tin nhắn thành JSON: {'ten': '...', 'gia': '...', 'size': '...', 'anh': ''}. Chỉ trả về JSON thuần."
                },
                {
                    role: "user",
                    content: userInput
                }
            ]
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY.trim()}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://render.com",
                "X-Title": "Huong Kid Admin Free"
            }
        });

        let text = response.data.choices[0].message.content;
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        return { success: true, ...JSON.parse(text) };

    } catch (error) {
        console.error("Lỗi AI Free:", error.response ? error.response.data : error.message);
        return { 
            success: false, 
            message: "Model Free đang bận hoặc tài khoản âm tiền nên bị chặn. Đạt thử lại sau nhé!" 
        };
    }
}

module.exports = { parseInventoryData };
