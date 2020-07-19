const fetch = require('node-fetch');
const convert = require('xml-js');

// NDLから情報を取得し、json形式でレスポンスを返す
// ajaxを利用してのアクセスを想定
exports.searchNDL = function(req, res) {
    // console.log(req.params.isbn);   // 入力ISBNチェック用

    fetch('http://iss.ndl.go.jp/api/sru?operation=searchRetrieve&query=isbn=' + req.params.isbn)
        .then(res => res.text())
        .then(body => {
            let repxml = body;
            repxml = repxml.replace(/&lt;/g, "<");
            repxml = repxml.replace(/&gt;/g, ">");
            repxml = repxml.replace(/&quot;/g, '"');
            repxml = repxml.replace(/dc:/g, '');
            const obj = convert.xml2js(repxml, {compact: true, spaces: 4});

            // 結果をconsoleで確認
            // const json = JSON.stringify(obj.searchRetrieveResponse.records);
            // console.log(json);
            let record = {};

            // レコードが1つの場合はオブジェクト、2つ以上の場合は配列になる records.record
            if (obj.searchRetrieveResponse.records.record) {
                record = obj.searchRetrieveResponse.records.record[0]
                || obj.searchRetrieveResponse.records.record;
            }
            // console.log(record);

            // JSON形式で返却
        	// res.json(obj.searchRetrieveResponse.records);
        	res.json(record);
        });
};
