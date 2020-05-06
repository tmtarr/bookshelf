function reqListenerOpenBD() {
    if (this.response[0]) {
        console.log(this.response[0].summary);
        document.getElementById("getname").value = this.response[0].summary.title;
    } else {
        document.getElementById("getname").value = "☆☆☆取得不可☆☆☆";
    }
}

function getBookInfo() {
    var isbn13 = document.getElementById("isbn13").value;
    callOpenBD(isbn13, reqListenerOpenBD);
}

function setName() {
    document.getElementById("name").value = document.getElementById("getname").value;
}
