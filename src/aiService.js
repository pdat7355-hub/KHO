const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.OPENROUTER_API_KEY);

async function parseInventoryData(userInput) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `Phân tích câu: "${userInput}". Trả về JSON: {"ten": "Tên", "gia": "Giá số", "size": "Size", "anh": ""}`;
        const result = await model.generateContent(prompt);
        let text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(text);
    } catch (error) {
        return { ten: "Lỗi", gia: 0, size: "" };
    }
}
module.exports = { parseInventoryData };
