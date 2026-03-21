const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.OPENROUTER_API_KEY);

async function parseInventoryData(userInput) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            Phân tích câu sau thành JSON: "${userInput}"
            Yêu cầu trả về duy nhất 1 đối tượng JSON theo mẫu, không có chữ nào khác ngoài JSON:
            {"ten": "Tên sản phẩm", "gia": "Giá số", "size": "Size", "anh": ""}
        `;

        const result = await model.generateContent(prompt);
        let text = result.response.text();

        // Xử lý sạch sẽ các ký tự thừa
        const jsonMatch = text.match(/\{.*\}/s);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error("Không tìm thấy JSON trong phản hồi của AI");
    } catch (error) {
        console.error("Lỗi AI:", error.message);
        return { ten: "Lỗi bóc tách", gia: 0, size: "", anh: "" };
    }
}

module.exports = { parseInventoryData };
