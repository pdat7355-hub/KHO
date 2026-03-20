const axios = require('axios');

async function parseInventoryData(userInput) {
    try {
        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: "google/gemini-2.0-flash-001",
            messages: [
                {
                    role: "system",
                    content: `Bạn là trợ lý kho Hương Kid. Nhiệm vụ: Trích xuất thông tin sản phẩm từ câu nói.
                    Trả về JSON: {"status": "success/incomplete", "data": {"ten": "...", "gia": "...", "size": "...", "mota": "...", "anh": "..."}, "message": "..."}`
                },
                { role: "user", content: userInput }
            ]
        }, {
            headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}` }
        });

        const text = response.data.choices[0].message.content;
        return JSON.parse(text.match(/\{.*\}/s)[0]);
    } catch (error) {
        return null;
    }
}

module.exports = { parseInventoryData };
