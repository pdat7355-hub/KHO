const { GoogleGenerativeAI } = require("@google/generative-ai");

// Khởi tạo Gemini với Key từ Render
const genAI = new GoogleGenerativeAI(process.env.OPENROUTER_API_KEY);

async function parseInventoryData(userInput) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            Bạn là trợ lý nhập kho chuyên nghiệp. 
            Hãy bóc tách thông tin từ câu sau: "${userInput}"
            Trả về DUY NHẤT một chuỗi JSON thuần túy (không kèm markdown, không kèm chữ khác) với các cột:
            {
                "ten": "Tên sản phẩm viết hoa chữ cái đầu",
                "gia": "Giá chỉ lấy số",
                "size": "Size sản phẩm (ví dụ: S, M, L hoặc 1-5)",
                "anh": ""
            }
            Nếu không có thông tin nào, hãy để trống chuỗi "".
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // BỘ LỌC CHỐNG LỖI: Xóa bỏ các ký tự thừa như ```json ... ``` nếu AI trả về
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        console.log("🤖 AI Response Raw:", text); // Log để Đạt xem trên Render

        return JSON.parse(text);
    } catch (error) {
        console.error("❌ Lỗi bóc tách AI:", error.message);
        return { ten: "", gia: "", size: "", anh: "" };
    }
}

module.exports = { parseInventoryData };
