// DB接続
const { Pool } = require('pg');
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});
let books;

// 一覧取得
exports.index = function(req, res) {

    pool.query('select *, chgisbn13to10(isbn13) as isbn10 from booklist order by id', (perr, pres) => {
        books = pres.rows;
        res.render('posts/index', {books: books});
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

exports.destroy = function(req, res) {

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
