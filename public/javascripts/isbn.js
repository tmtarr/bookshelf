/**
 * 機能名：chgISBN13to10
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

/**
 * 機能名：calcISBN13
 * 概要：入力されたISBNによりISBN13を計算する
 * 備考：計算方法は以下サイトを参考にした
 * https://ja.wikipedia.org/wiki/ISBN
 */
function calcISBN13(inIsbn) {

    var isbn12;
    // 入力チェック
    if (inIsbn.length == 9 || inIsbn.length == 10) {
        isbn12 = "978" + inIsbn.substr(0, 9);
    } else if (inIsbn.length >= 12) {
        isbn12 = inIsbn.substr(0, 12);
    } else {
        return inIsbn;
    }

    // チェックデジット計算
    var numCheck = 0;
    for (var i = 0; i < 12; i++) {
        if (i % 2 == 0) {
            numCheck += isbn12.substr(i, 1) * 1;
        } else {
            numCheck += isbn12.substr(i, 1) * 3;
        }
    }

    var checkdigit = 10 - numCheck % 10;
    if (checkdigit == 10) {
        checkdigit = 0;
    }

    // ISBN-13作成
    var isbn13 = isbn12 + checkdigit;
    return isbn13;
}

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
function callGoogleBooks(isbn13, listener) {
    if (isbn13.length != 13) {
        return false;
    }
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", listener);
//    console.log("before open");
    oReq.open("GET", "https://www.googleapis.com/books/v1/volumes?q=isbn:" + isbn13);
    oReq.responseType = 'json';
    oReq.send();
//    console.log("after open");
    return true;
}

function callNDL(isbn13, listener) {

    if (isbn13.length != 13) {
        return false;
    }
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", listener);
    oReq.open("GET", "/api/ndl/" + isbn13);
    oReq.responseType = 'json';
    oReq.send();
    return true;
}
