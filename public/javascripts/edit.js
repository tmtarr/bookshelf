// イベント設定
document.getElementById("isbn13").addEventListener('blur', getBookInfo);
document.getElementById("btnGet").addEventListener('click', getBookInfoForce);

// OpenBDから書誌情報を取得
function getBookInfo() {
    var isbn13 = document.getElementById("isbn13").value;
    callOpenBD(isbn13, setData);
}

function getBookInfoForce() {
    var isbn13 = document.getElementById("isbn13").value;
    callOpenBD(isbn13, setDataForce);
}

// 取得データをフォームに設定
function setData() {
    setOpenBDData(this.response[0], false);
}
function setDataForce() {
    setOpenBDData(this.response[0], true);
}

function setOpenBDData(record, force) {
    // 存在チェック
    if (!record) {
        return;
    }

    console.log(record.summary);

    // 取得データ設定
    if (force || !document.getElementById("name").value) {
        document.getElementById("name").value = record.summary.title;
    }
}
