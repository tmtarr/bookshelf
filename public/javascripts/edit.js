// イベント設定
document.getElementById("isbn13").addEventListener('blur', blurISBN);
document.getElementById("btnGet").addEventListener('click', getBookInfo);

// ISBN入力後イベント
function blurISBN() {
    // 既に名前が入力済みの場合は処理しない
    if (document.getElementById("name").value) {
        return;
    }
    getBookInfo();
}

// OpenBDから書誌情報を取得
function getBookInfo() {
    var isbn13 = document.getElementById("isbn13").value;
    if (callOpenBD(isbn13, setData)) {
        document.getElementById("loading").style.display = "";
    }
}

// データ設定
function setData() {
    if (setOpenBDData(this.response[0], true)) {
        // load完了
        document.getElementById("loading").style.display = "none";
    } else {
        // google books API
        var isbn13 = document.getElementById("isbn13").value;
        callGoogleBooks(isbn13, setGoogleBooksData);
    }
}

// OpenBDから取得したデータをフォームに設定
function setOpenBDData(record, force) {

    // 存在チェック
    if (!record) {
        return false;
    }

    console.log(record.summary);

    // 取得データ設定
    if (force || !document.getElementById("name").value) {
        document.getElementById("name").value = record.summary.title;
    }
    return true;
}

function setGoogleBooksData() {
//    var record = this.response.items[0]; 
//    console.log(this.response);

    if (this.response.totalItems > 0) {
        var record = this.response.items[0]; 
        document.getElementById("name").value = record.volumeInfo.title;
    }

    // load完了
    document.getElementById("loading").style.display = "none";
}
