const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.OPENROUTER_API_KEY);

async function parseInventoryData(userInput) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            Bạn là trợ lý kho shop quần áo trẻ em. Bóc tách câu: "${userInput}"
            Trả về DUY NHẤT JSON thuần, không markdown:
            {"ten": "Tên SP", "gia": "Giá số", "size": "Size", "anh": ""}
        `;

        const result = await model.generateContent(prompt);
        let text = result.response.text();
        
        // Làm sạch dữ liệu AI trả về
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        return JSON.parse(text);
    } catch (error) {
        console.error("Lỗi AI Service:", error.message);
        return { ten: "Lỗi phân tích", gia: 0, size: "", anh: "" };
    }
}

module.exports = { parseInventoryData };
