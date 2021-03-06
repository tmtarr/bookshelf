// フォーカス
document.getElementById("isbn13").focus();

// イベント設定
document.getElementById("isbn13").addEventListener('blur', blurISBN);
document.getElementById("btnGet").addEventListener('click', clickGetButton);
document.getElementById("btnGetNDL").addEventListener('click', clickNDLButton);

// ISBN入力後イベント
function blurISBN() {
    // ISBN整形
    formatISBN13();

    // 既に名前が入力済みの場合は処理しない
    if (document.getElementById("name").value) {
        return;
    }
    // 情報取得
    getBookInfo();
}

// 情報取得ボタン
function clickGetButton() {
    // ISBN整形
    formatISBN13();

    // 情報取得
    getBookInfo();
}

// 情報取得ボタン(NDL)
function clickNDLButton() {
    // ISBN整形
    formatISBN13();

    // 情報取得
    getBookInfoNDL();
}

// ISBN13整形
function formatISBN13() {
    var inIsbn = document.getElementById("isbn13").value;
    var isbn13 = calcISBN13(inIsbn);
    if (inIsbn != isbn13) {
        document.getElementById("isbn13").value = isbn13;
    }
}

// OpenBDから書誌情報を取得
function getBookInfo() {
    // ISBN取得
    var isbn13 = document.getElementById("isbn13").value;
    // 検索
    if (callOpenBD(isbn13, setData)) {
        document.getElementById("loading").style.display = "";
    }
}

// NDLから書誌情報を取得
function getBookInfoNDL() {
    // ISBN取得
    var isbn13 = document.getElementById("isbn13").value;
    // 検索
    if (callNDL(isbn13, setNDLData)) {
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

//    // google取得のテスト用デバッグコード
//    return false;

    // 存在チェック
    if (!record) {
        return false;
    }

    console.log('get book data from OpenBD');
    console.log(record.summary);

    // 取得データ設定
    if (force || !document.getElementById("name").value) {
        document.getElementById("name").value = record.summary.title;
        document.getElementById("publisher").value = record.summary.publisher;
        document.getElementById("author").value = record.summary.author;
    }
    return true;
}

function setGoogleBooksData() {

    if (this.response.totalItems > 0) {
        var record = this.response.items[0]; 
        console.log('get book data from GoogleBooksAPI');
        console.log(this.response);
        document.getElementById("name").value = record.volumeInfo.title;
        document.getElementById("publisher").value = record.volumeInfo.publisher || "";
        document.getElementById("author").value = record.volumeInfo.authors[0];
    }

    // load完了
    document.getElementById("loading").style.display = "none";
}

function setNDLData() {
    console.log('get book data from NDL');
    console.log(this.response);
    if (this.response) {
        var record = this.response;
        if (record.recordData) {
            console.log(record.recordData.srw_dc);
            document.getElementById("name").value = record.recordData.srw_dc.title._text;
            document.getElementById("publisher").value = record.recordData.srw_dc.publisher._text;
            if (record.recordData.srw_dc.creator) {
                document.getElementById("author").value = record.recordData.srw_dc.creator._text;
            }
        }
    }
    
    // load完了
    document.getElementById("loading").style.display = "none";
}
