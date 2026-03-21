const { GoogleGenerativeAI } = require("@google/generative-ai");

// Đảm bảo OPENROUTER_API_KEY đã có trên Render Settings
const genAI = new GoogleGenerativeAI(process.env.OPENROUTER_API_KEY);

async function parseInventoryData(userInput) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            Bạn là trợ lý nhập kho chuyên nghiệp cho shop Hương Kid. 
            Hãy bóc tách thông tin từ câu: "${userInput}"
            Trả về DUY NHẤT một chuỗi JSON thuần túy (không kèm markdown \`\`\`json, không kèm chữ khác) theo cấu trúc sau:
            {
                "ten": "Tên sản phẩm (viết hoa chữ cái đầu)",
                "gia": "Giá sản phẩm (chỉ lấy số)",
                "size": "Kích thước (ví dụ: 1-5 hoặc S, M, L)",
                "anh": ""
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Lọc bỏ các ký tự thừa nếu AI trả về định dạng Markdown
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        console.log("🤖 AI bóc tách được:", text);
        return JSON.parse(text);
    } catch (error) {
        console.error("❌ Lỗi AI:", error.message);
        return { ten: "Lỗi phân tích", gia: "0", size: "", anh: "" };
    }
}

module.exports = { parseInventoryData };
