const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.OPENROUTER_API_KEY);

async function parseInventoryData(userInput) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Phân tích câu: "${userInput}"
            Trả về duy nhất 1 đối tượng JSON, không kèm lời giải thích:
            {"ten": "Tên SP", "gia": "Giá số", "size": "Kích thước", "anh": ""}
        `;

        const result = await model.generateContent(prompt);
        let text = result.response.text();
        
        // Làm sạch các ký tự lạ
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        console.log("🤖 AI Response:", text); // Log này sẽ hiện trên Render
        return JSON.parse(text);
    } catch (error) {
        console.error("❌ Lỗi AI:", error.message);
        // Trả về lỗi dưới dạng chuỗi để mình dễ đọc
        return { ten: "LỖI: " + error.message, gia: 0, size: "error", anh: "" };
    }
}

module.exports = { parseInventoryData };
