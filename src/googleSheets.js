const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : null,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function saveToSheets(product) {
    const doc = new GoogleSpreadsheet(process.env.ID_FILE_PRODUCT, auth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0]; // Tab đầu tiên

    await sheet.addRow({
        'Tên': product.ten || '',
        'Giá': product.gia || '',
        'Size': product.size || '',
        'Mô tả': product.mota || '',
        'Ảnh': product.anh || ''
    });
}

module.exports = { saveToSheets };
