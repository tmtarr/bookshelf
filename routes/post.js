const pool = require('../modules/dbpool');
const hashgen = require('../modules/hashgen');

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

// メイン画面を起動
exports.main = function(req, res) {

    // 画面制御
    const display = makeDisplay(req);
    res.render('main', {display: display});
}

// 一覧画面を起動
exports.index = function(req, res) {

    // 画面制御
    const display = makeDisplay(req);
    let isSelf = false;

    // 検索対象のuseridを決定
    let userid;
    if (req.params.userid) {
        userid = req.params.userid;     // 他人のを参照
    } else {
        display.editable = true;
        isSelf = true;
        userid = display.userid;        // 自分のを編集
        display.activeHome = "active";
    }

    // データ取得
    (async () => {
        // ユーザー名取得
        display.username = await getUserName(req, res, userid, isSelf);
        if (!display.username) {
            return;
        }

        // 書籍リスト取得
        const books = await getBooklist(req, userid);
        req.query.ebookFlg = req.query.ebookFlg == 1 ? "checked" : "";
        req.query.wishFlg = req.query.wishFlg == 1 ? "checked" : "";
        res.render('posts/index', {display: display, books: books, reqq: req.query});
    })();
};

// ユーザー名取得
async function getUserName(req, res, userid, isSelf) {

    let username;
    const qres = await pool.query("select name from user_t where userid = $1", [userid]);
    if (qres.rows.length >= 1) {
        username = qres.rows[0].name;
    } else {
        if (isSelf) {
            displayError(req, res, '自身のほんだなを見るにはログインしてください。');
        } else {
            displayError(req, res, 'ユーザー ' + userid + ' は存在しません。');
        }
    }
    return username;
}

// 書籍リストを取得
async function getBooklist(req, userid) {

    // パラメータ
    const aryParam = [];

    // クエリ
    const aryQuery = [];
    aryQuery.push("select bl.*, chgisbn13to10(isbn13) as isbn10, ut.name");
    aryQuery.push("from booklist bl, user_t ut");
    aryQuery.push("where 1=1");
    aryQuery.push("and bl.userid = ?");
    aryQuery.push("and bl.userid = ut.userid");
    aryParam.push(userid);

    // 検索条件
    // 簡易検索
    if (req.query.q) {
        aryQuery.push("and(");
        aryQuery.push("  bookname ilike ?");
        aryQuery.push("  or category ilike ?");
        aryQuery.push(")");
        aryParam.push('%' + req.query.q + '%');
        aryParam.push('%' + req.query.q + '%');
    }
    // name
    if (req.query.name) {
        aryQuery.push("  and bookname ilike ?");
        aryParam.push('%' + req.query.name + '%');
    }
    // category
    if (req.query.category) {
        aryQuery.push("  and category ilike ?");
        aryParam.push('%' + req.query.category + '%');
    }
    // 電子書籍
    if (req.query.ebookFlg == 1) {
        aryQuery.push("  and ebook_flg = '1'");
    }
    // ほしい
    if (req.query.wishFlg == 1) {
        aryQuery.push("  and wish_flg = '1'");
    }

    aryQuery.push("order by id desc");

    // 実行
    const res = await pool.query(numberQueryParameters(aryQuery.join(" ")), aryParam);
    return res.rows;
}

// 新規登録画面を起動
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

// 書籍登録処理
exports.create = function(req, res) {

    (async () => {
        const client = await pool.connect();
        let blnError = false;
        try {
            await client.query('begin');

            // id取得
            const resq = await client.query("select to_char(to_number(max(id), '99999') + 1, 'FM00000') as id from booklist");
            const id = resq.rows[0].id;

            // 書籍情報を登録
            await insBook(client, req, id);
            await client.query('commit');

        } catch(e) {
            await client.query('rollback');
            console.log("rollback");
            console.log(e);
            blnError = true;

        } finally {
            client.release();

            // エラー処理
            if (blnError) {
                displayError(req, res, '登録処理でエラーが発生しました。');
                return;
            }

            // 一覧を再表示
            res.redirect('/home');
        }
    })();
};

// 書籍情報を登録する
async function insBook(client, req, id) {
    // クエリ
    const aryQuery = [];
    aryQuery.push("insert into booklist(");
    aryQuery.push("  id");
    aryQuery.push("  ,bookname");
    aryQuery.push("  ,author");
    aryQuery.push("  ,publisher");
    aryQuery.push("  ,category");
    aryQuery.push("  ,read_date");
    aryQuery.push("  ,note");
    aryQuery.push("  ,isbn13");
    aryQuery.push("  ,ebook_flg");
    aryQuery.push("  ,wish_flg");
    aryQuery.push("  ,userid");
    aryQuery.push("  ,ins_date");
    aryQuery.push(") values (");
    aryQuery.push("$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11");
    aryQuery.push(",to_char(now() at time zone 'JST', 'YYYY/MM/DD|HH24:MI:SS')");
    aryQuery.push(")");

    // パラメータ
    const aryParam = [];
    aryParam.push(id);
    aryParam.push(req.body.name);
    aryParam.push(req.body.author);
    aryParam.push(req.body.publisher);
    aryParam.push(req.body.category);
    aryParam.push(req.body.read_date);
    aryParam.push(req.body.note);
    aryParam.push(req.body.isbn13);
    aryParam.push(req.body.ebookFlg);
    aryParam.push(req.body.wishFlg);
    aryParam.push(req.user);

    // クエリ実行
    return await client.query(aryQuery.join(" "), aryParam);
}

// 編集画面を起動
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

// 更新処理
exports.update = function(req, res) {

    // 更新
    // クエリ
    const aryQuery = [];
    aryQuery.push("update booklist");
    aryQuery.push("set");
    aryQuery.push("bookname = $1");
    aryQuery.push(",author = $2");
    aryQuery.push(",publisher = $3");
    aryQuery.push(",category = $4");
    aryQuery.push(",read_date = $5");
    aryQuery.push(",note = $6");
    aryQuery.push(",isbn13 = $7");
    aryQuery.push(",ebook_flg = $8");
    aryQuery.push(",wish_flg = $9");
    aryQuery.push(",upd_date = to_char(now() at time zone 'JST', 'YYYY/MM/DD|HH24:MI:SS')");
    aryQuery.push("where");
    aryQuery.push("id = $10");
    
    // パラメータ
    const aryParam = [];
    aryParam.push(req.body.name);
    aryParam.push(req.body.author);
    aryParam.push(req.body.publisher);
    aryParam.push(req.body.category);
    aryParam.push(req.body.read_date);
    aryParam.push(req.body.note);
    aryParam.push(req.body.isbn13);
    aryParam.push(req.body.ebookFlg);
    aryParam.push(req.body.wishFlg);
    aryParam.push(req.params.id);

    // クエリ実行
    pool.query(aryQuery.join(" "), aryParam, (perr, pres) => {

        // エラー処理
        if (perr) {
            console.log(perr.stack);
            displayError(req, res, '更新処理でエラーが発生しました。');
            return;
        }

        // 一覧を再表示
        res.redirect('/home');
    });
};

exports.delete = function(req, res) {

    // 削除
    // クエリ
    const aryQuery = [];
    aryQuery.push("delete from booklist where id = $1;");
    
    // パラメータ
    const aryParam = [];
    aryParam.push(req.params.id);

    // クエリ実行
    pool.query(aryQuery.join(" "), aryParam, (perr, pres) => {
	    // 一覧を再表示
        res.redirect('/home');
    });
};

// ドキュメント画面を起動
exports.doc = function(req, res) {
    // 画面制御
    const display = makeDisplay(req);
    display.activeDoc = "active";

	res.render('doc', {display: display});
};

// ログイン画面を起動
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

// サインアップ画面を起動
exports.signup = function(req, res) {
    // 画面制御
    const display = makeDisplay(req);
	res.render('signup', {display: display});
};

// サインアップ処理
exports.addUser = function(req, res) {
    // 登録
    var aryParam = [];
    var aryQuery = [];
    const hash = hashgen.getHash(req.body.userid, req.body.password);

    aryQuery.push("insert into user_t values (");
    aryQuery.push("$1, $2, $3, 0");
    aryQuery.push(",to_char(now() at time zone 'JST', 'YYYY/MM/DD|HH24:MI:SS')");
    aryQuery.push(")");

    aryParam.push(req.body.userid);
    aryParam.push(req.body.name);
    //aryParam.push(req.body.password);
    aryParam.push(hash);

    pool.query(aryQuery.join(" "), aryParam, (perr, pres) => {
        if (perr) {
            const display = {};
            display.error = true;
            res.render('signup', {display: display});
        } else {
            // ログイン状態でトップ画面にリダイレクト
            req.login(req.body.userid, function(err) {
                return res.redirect('/home');
            });
        }
    });
};

// エラー画面
function displayError(req, res, message) {
    const display = makeDisplay(req);
	res.render('error', {display: display, message: message});
}

// クエリパラメータを置換
function numberQueryParameters(strIn) {

	var count = 1;
	var strOut = strIn;

	var re = /\?/;
	while (re.test(strOut)) {
		strOut = strOut.replace(re, "$" + count);
		count++;
	}

	return strOut;
}
