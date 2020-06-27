// DB接続
const pool = require('../modules/dbpool');
let books;

// NDL
const fetch = require('node-fetch');
const convert = require('xml-js');

// 画面制御オブジェクトのコンストラクタ
function Display() {
    this.activeHome = "";
    this.activeNew = "";
    this.activeDoc = "";
    this.mode = "";
    this.userid = "";
    this.login = false;
}

function makeDisplay(req) {
    const display = new Display();
    if (req.user) {
        display.userid = req.user;
        display.login = true;
    }
    return display;
}

// メイン
exports.main = function(req, res) {

    // 画面制御
    const display = makeDisplay(req);
    res.render('main', {display: display});
}

// 一覧取得
exports.index = function(req, res) {

    // 画面制御
    const display = makeDisplay(req);
    let isSelf = false;

    // 検索対象のuseridを決定
    var userid;
    if (req.params.userid) {
        userid = req.params.userid;     // 他人のを参照
    } else {
        display.editable = true;
        isSelf = true;
        userid = display.userid;        // 自分のを編集
        display.activeHome = "active";
    }

    (async () => {

        // ユーザー
        var qres = await pool.query("select name from user_t where userid = $1", [userid]);
        if (qres.rows.length >= 1) {
            display.username = qres.rows[0].name;

        // ID未存在エラー
        } else {
            if (isSelf) {
                displayError(req, res, '自身のほんだなを見るにはログインしてください。');
                return;
            } else {
                displayError(req, res, 'ユーザー ' + userid + ' は存在しません。');
                return;
            }
        }

        // パラメータ
        var aryParam = [];

        // クエリ
        var aryQuery = [];
        aryQuery.push("select bl.*, chgisbn13to10(isbn13) as isbn10, ut.name");
        aryQuery.push("from booklist bl, user_t ut");
        aryQuery.push("where 1=1");
        aryQuery.push("and bl.userid = $1");
        aryQuery.push("and bl.userid = ut.userid");
        aryParam.push(userid);

        if (req.query.q) {
            aryQuery.push("and(");
            aryQuery.push("  bookname ilike $2");
            aryQuery.push("  or category ilike $2");
            aryQuery.push(")");
            aryParam.push('%' + req.query.q + '%');
        }
        aryQuery.push("order by id desc");

        // 実行
        qres = await pool.query(aryQuery.join(" "), aryParam);
        books = qres.rows;
        res.render('posts/index', {display: display, books: books, qstr: req.query.q});
    })();
};

exports.new = function(req, res) {
    // 画面制御
    const display = makeDisplay(req);
    display.activeNew = "active";
    display.mode = "new";
    const book = {};
    book.isbn13 = req.query.isbn;

    // エラーチェック
    if (!display.login) {
        displayError(req, res, '本を登録するにはログインしてください。');
        return;
    }

	res.render('posts/edit', {display: display, book: book});
};

// 登録
exports.create = function(req, res) {

    (async () => {
        const client = await pool.connect();
        try {
            await client.query('begin');

            // id取得
            const resq = await client.query("select to_char(to_number(max(id), '99999') + 1, 'FM00000') as id from booklist");
            const id = resq.rows[0].id;

            // 登録
            // クエリ
            var aryQuery = [];
            aryQuery.push("insert into booklist(");
            aryQuery.push("  id");
            aryQuery.push("  ,bookname");
            aryQuery.push("  ,category");
            aryQuery.push("  ,isbn13");
            aryQuery.push("  ,ebook_flg");
            aryQuery.push("  ,wish_flg");
            aryQuery.push("  ,userid");
            aryQuery.push("  ,ins_date");
            aryQuery.push(") values (");
            aryQuery.push("$1, $2, $3, $4, $5, $6, $7");
            aryQuery.push(",to_char(now() at time zone 'JST', 'YYYY/MM/DD|HH24:MI:SS')");
            aryQuery.push(")");

            // パラメータ
            var aryParam = [];
            aryParam.push(id);
            aryParam.push(req.body.name);
            aryParam.push(req.body.category);
            aryParam.push(req.body.isbn13);
            aryParam.push(req.body.ebookFlg);
            aryParam.push(req.body.wishFlg);
            aryParam.push(req.user);
        
            // クエリ実行
            await client.query(aryQuery.join(" "), aryParam);

            await client.query('commit');

        } catch(e) {
            await client.query('rollback');
            console.log("rollback");
            console.log(e);

        } finally {
            client.release();
            // 一覧を再表示
            res.redirect('/home');
        }
    })();

};

exports.edit = function(req, res) {

    // 画面制御
    const display = makeDisplay(req);
    display.mode = "edit";

    pool.query('select * from booklist where id = $1', [req.params.id], (perr, pres) => {
        var book = pres.rows[0];
        book.ebookFlg = book.ebook_flg == 1 ? "checked" : "";
        book.wishFlg = book.wish_flg == 1 ? "checked" : "";
        res.render('posts/edit', {display: display, book: book, id: req.params.id});
    });
};

// 更新
exports.update = function(req, res) {

    // 更新
    // クエリ
    var aryQuery = [];
    aryQuery.push("update booklist");
    aryQuery.push("set");
    aryQuery.push("bookname = $1");
    aryQuery.push(",category = $2");
    aryQuery.push(",isbn13 = $3");
    aryQuery.push(",ebook_flg = $4");
    aryQuery.push(",wish_flg = $5");
    aryQuery.push(",upd_date = to_char(now() at time zone 'JST', 'YYYY/MM/DD|HH24:MI:SS')");
    aryQuery.push("where");
    aryQuery.push("id = $6");
    
    // パラメータ
    var aryParam = [];
    aryParam.push(req.body.name);
    aryParam.push(req.body.category);
    aryParam.push(req.body.isbn13);
    aryParam.push(req.body.ebookFlg);
    aryParam.push(req.body.wishFlg);
    aryParam.push(req.params.id);

    // クエリ実行
    pool.query(aryQuery.join(" "), aryParam, (perr, pres) => {
	    // 一覧を再表示
        res.redirect('/home');
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
        res.redirect('/home');
    });
};

exports.doc = function(req, res) {
    // 画面制御
    const display = makeDisplay(req);
    display.activeDoc = "active";

	res.render('doc', {display: display});
};

// ログイン
exports.login = function(req, res) {
    // 画面制御
    const display = makeDisplay(req);

	res.render('login', {display: display});
};

// ログアウト
exports.logout = function(req, res) {
    req.logout();
    res.redirect('/');
}

// サインアップ
exports.signup = function(req, res) {
    // 画面制御
    const display = makeDisplay(req);
	res.render('signup', {display: display});
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

// エラー画面
function displayError(req, res, message) {
    const display = makeDisplay(req);
	res.render('error', {display: display, message: message});
}
