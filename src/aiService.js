const { GoogleGenerativeAI } = require("@google/generative-ai");

// Khởi tạo AI
const genAI = new GoogleGenerativeAI(process.env.OPENROUTER_API_KEY);

async function parseInventoryData(userInput) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Bạn là một trợ lý kiểm kho thông minh. 
            Nhiệm vụ: Đọc tin nhắn và bóc tách thông tin sản phẩm.
            Tin nhắn: "${userInput}"

            Hãy trả về duy nhất một chuỗi JSON theo đúng mẫu sau, không giải thích gì thêm:
            {
                "ten": "Tên sản phẩm",
                "gia": "Giá tiền (chỉ lấy số)",
                "size": "Kích thước/Size",
                "anh": ""
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Xử lý nếu AI trả về kèm ký tự lạ ```json ... ```
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        console.log("🤖 AI đã bóc tách:", text);
        return JSON.parse(text);
    } catch (error) {
        console.error("❌ Lỗi AI không hiểu tin nhắn:", error.message);
        return { ten: "Lỗi phân tích", gia: "0", size: "", anh: "" };
    }
}

module.exports = { parseInventoryData };
