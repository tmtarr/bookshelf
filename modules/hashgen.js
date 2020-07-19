// モジュール取得
const crypto = require('crypto');

// ハッシュ
exports.getHash = function(id, password) {
    const hash = crypto.scryptSync(id + password, 'yakisoba', 10).toString("base64");
    return hash;
}
