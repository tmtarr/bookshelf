// DB接続
const { Pool } = require('pg');
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});
let books;

// NDL
const fetch = require('node-fetch');
const convert = require('xml-js');

// 一覧取得
exports.index = function(req, res) {

    // パラメータ
    var aryParam = [];

    // クエリ
    var aryQuery = [];
    aryQuery.push("select *, chgisbn13to10(isbn13) as isbn10");
    aryQuery.push("from booklist");
    aryQuery.push("where 1=1");
    if (req.query.q) {
        aryQuery.push("and(");
        aryQuery.push("  bookname ilike $1");
        aryQuery.push("  or category ilike $1");
        aryQuery.push(")");
        aryParam.push('%' + req.query.q + '%');
    }
    aryQuery.push("order by id");

    // 実行
    pool.query(aryQuery.join(" "), aryParam, (perr, pres) => {
        books = pres.rows;
        res.render('posts/index', {books: books, qstr: req.query.q});
    });
};

exports.new = function(req, res) {
	res.render('posts/new');
};

exports.create = function(req, res) {

    (async () => {
        const client = await pool.connect();
        try {
            await client.query('begin');

            // id取得
            const resq = await client.query("select to_char(to_number(max(id), '99999') + 1, 'FM00000') as id from booklist");
            const id = resq.rows[0].id;
            console.log("new id: " + id);

            // 登録
            // クエリ
            var aryQuery = [];
            aryQuery.push("insert into booklist(");
            aryQuery.push("  id");
            aryQuery.push("  ,bookname");
            aryQuery.push("  ,category");
            aryQuery.push("  ,isbn13");
            aryQuery.push(") values (");
            aryQuery.push("$1, $2, $3, $4");
            aryQuery.push(")");

            // パラメータ
            var aryParam = [];
            aryParam.push(id);
            aryParam.push(req.body.name);
            aryParam.push(req.body.category);
            aryParam.push(req.body.isbn13);

            // クエリ実行
            await client.query(aryQuery.join(" "), aryParam);

            await client.query('commit');
            console.log("commit");

        } catch(e) {
            await client.query('rollback');
            console.log("rollback");
            console.log(e);

        } finally {
            client.release();
            console.log("release");
            // 一覧を再表示
            res.redirect('/');
        }
    })();

};

exports.edit = function(req, res) {

    pool.query('select * from booklist where id = $1', [req.params.id], (perr, pres) => {
        var book = pres.rows[0];
        res.render('posts/edit', {book: book, id: req.params.id});
    });
};

exports.update = function(req, res) {

    // 更新
    // クエリ
    var aryQuery = [];
    aryQuery.push("update booklist");
    aryQuery.push("set");
    aryQuery.push("bookname = $1");
    aryQuery.push(",category = $2");
    aryQuery.push(",isbn13 = $3");
    aryQuery.push("where");
    aryQuery.push("id = $4");
    aryQuery.push(";");
    
    // パラメータ
    var aryParam = [];
    aryParam.push(req.body.name);
    aryParam.push(req.body.category);
    aryParam.push(req.body.isbn13);
    aryParam.push(req.params.id);

    // クエリ実行
    pool.query(aryQuery.join(" "), aryParam, (perr, pres) => {
	    // 一覧を再表示
        res.redirect('/');
    });
};

exports.delete = function(req, res) {

    // 削除
    // クエリ
    var aryQuery = [];
    aryQuery.push("delete from booklist where id = $1;");
    
    // パラメータ
    var aryParam = [];
    aryParam.push(req.params.id);

    // クエリ実行
    pool.query(aryQuery.join(" "), aryParam, (perr, pres) => {
	    // 一覧を再表示
        res.redirect('/');
    });
};

// NDLから情報を取得し、json形式でレスポンスを返す
// ajaxを利用してのアクセスを想定
// 【TODO】一定時間待ち続けた場合タイムアウトさせたい
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
