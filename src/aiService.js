const axios = require('axios');

async function parseInventoryData(userInput) {
    try {
        const apiKey = process.env.OPENROUTER_API_KEY;
        
        // Kiểm tra xem Key đã được nạp chưa
        if (!apiKey) {
            console.error("❌ LỖI: Chưa có OPENROUTER_API_KEY trong Environment Variables.");
            return { success: false, message: "Server chưa nạp được API Key. Đạt kiểm tra tab Environment trên Render nhé!" };
        }

        console.log("📡 Đang gửi yêu cầu tới OpenRouter với model Gemini 2.0 Flash...");

        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: "google/gemini-2.0-flash-001",
            messages: [
                {
                    role: "system",
                    content: "Bạn là trợ lý kho. Phân tích nội dung và trả về JSON duy nhất: {'ten': '...', 'gia': '...', 'size': '...', 'anh': ''}. Không giải thích gì thêm."
                },
                {
                    role: "user",
                    content: userInput
                }
            ],
            // Các header bắt buộc để OpenRouter không chặn request từ Render
            headers: {
                "Authorization": `Bearer ${apiKey.trim()}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://render.com", 
                "X-Title": "Huong Kid Admin System"
            }
        }, {
            timeout: 10000 // Chờ tối đa 10 giây
        });

        if (response.data && response.data.choices && response.data.choices[0]) {
            let text = response.data.choices[0].message.content;
            
            // Làm sạch định dạng Markdown nếu AI trả về (```json ... ```)
            text = text.replace(/```json/g, "").replace(/```/g, "").trim();
            
            console.log("✅ AI phản hồi thành công:", text);
            
            const jsonData = JSON.parse(text);
            return { success: true, ...jsonData };
        } else {
            console.error("❌ OpenRouter trả về cấu hình lạ:", response.data);
            return { success: false, message: "AI trả về dữ liệu trống." };
        }

    } catch (error) {
        // --- ĐOẠN NÀY SẼ HIỆN LỖI THẬT SỰ TRÊN LOG RENDER ---
        let errorMsg = error.message;
        if (error.response) {
            // Lỗi từ phía OpenRouter trả về (Sai Key, Hết hạn, Sai Model...)
            errorMsg = `Mã lỗi ${error.response.status}: ${JSON.stringify(error.response.data)}`;
        }
        
        console.error("❌ LỖI OPENROUTER CHI TIẾT:", errorMsg);
        
        return { 
            success: false, 
            message: "AI không phản hồi. Lỗi: " + (error.response?.status || error.message) 
        };
    }
}

module.exports = { parseInventoryData };
