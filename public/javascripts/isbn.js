/**
 * 機能名：chg13to10
 * 概要：ISBN-13をISBN-10に変換する
 * 備考：計算方法は以下サイトを参考にした
 * http://www.infonet.co.jp/ueyama/ip/glossary/isbn.html
 */
function chgISBN13to10(isbn13) {

    // 入力チェック
    if (isbn13.length != 13) {
        return "";
    }
    var isbn9 = isbn13.substr(3, 9);

    // チェックデジット計算
    var numCheck = 0;
    numCheck += isbn9.substr(0, 1) * 10;
    numCheck += isbn9.substr(1, 1) * 9;
    numCheck += isbn9.substr(2, 1) * 8;
    numCheck += isbn9.substr(3, 1) * 7;
    numCheck += isbn9.substr(4, 1) * 6;
    numCheck += isbn9.substr(5, 1) * 5;
    numCheck += isbn9.substr(6, 1) * 4;
    numCheck += isbn9.substr(7, 1) * 3;
    numCheck += isbn9.substr(8, 1) * 2;

    var checkdigit = 11 - numCheck % 11;
    if (checkdigit == 11) {
        checkdigit = 0;
    } else if (checkdigit == 10) {
        checkdigit = 'x';
    }

    // ISBN-10作成
    var isbn10 = isbn9 + checkdigit;
    return isbn10;
}

//function reqListener() {
////    console.log(this.responseText);
////    console.log(this.responseText[0]);
//    // jsonはテキストで来ているからparse処理が必要？→requestでresponseTypeを指定すれば不要みたい
//
//    // this.response にjsonがparseされた状態でセットされる
//    console.log(this.response[0].summary);
//}
function callOpenBD(isbn13, listener) {
    if (isbn13.length != 13) {
        return false;
    }
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", listener);
//    console.log("before open");
    oReq.open("GET", "https://api.openbd.jp/v1/get?isbn=" + isbn13);
    oReq.responseType = 'json';
    oReq.send();
//    console.log("after open");
    return true;
}
