// 変数定義
var express = require('express'),
	methodOverride = require('method-override'),
	app = express(),
	post = require('./routes/post'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
    session = require('express-session'),
    pool = require('./modules/dbpool')
	;

const PORT = process.env.PORT || 5000;

// テンプレートの場所を指定
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));

// 利用するテンプレートエンジンの設定
app.set('view engine', 'ejs');

// postデータ受け取り
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// putメソッド・deleteメソッドに対応
app.use(methodOverride('_method'));

// 認証
app.use(session({ secret: "nazo" }));
app.use(passport.initialize());
app.use(passport.session());

// パスワードチェックのロジック
passport.use(new LocalStrategy(
    function(username, password, done) {
        //return done(null, "hello");
        console.log("にんしょうちゅう");

        // 認証
        var aryQuery = [];
        aryQuery.push("select userid from user_t where");
        aryQuery.push("userid = $1");
        aryQuery.push("and password = $2");
    
        var aryParam = [];
        aryParam.push(username);
        aryParam.push(password);
    
        pool.query(aryQuery.join(" "), aryParam, (perr, pres) => {
            console.log(pres.rowCount);
            if (pres.rowCount == 0) {
                return done(null, false, {message: 'ちがうよ'});
            }
            return done(null, username);
        });

//        if (password != "fish") {
//            return done(null, false, {message: 'ちがうよ'});
//        }
//        return done(null, username);
    }
));

// 【TODO】こちらは何をしているのかよくわかっていない
// キーワードは「シリアライズ」かな？
// express-sessionについて先に学んだほうがいいかもしれない
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(user, done) {
    done(null, user);
});

// ルーティング設定
app.get('/', post.main);
app.get('/home', post.index);
app.get('/posts/new', post.new);		// 新規作成フォームを表示
app.post('/posts/create', post.create);	// formのpost先
app.get('/posts/:id/edit', post.edit);	// 更新 編集フォームを表示
app.put('/posts/:id', post.update);		// フォームの投稿先
app.delete('/posts/:id', post.delete);	// 削除
app.get('/doc', post.doc);              // ドキュメント
app.get('/login', post.login);          // ログイン
app.get('/logout', post.logout);
app.post('/login',
    passport.authenticate('local', {
        successRedirect: '/home',
        failureRedirect: '/login'
    })
);
app.get('/signup', post.signup);            // サインアップ画面
app.post('/signup', function(req, res) {    // サインアップ処理

    // 登録
    var aryParam = [];
    var aryQuery = [];

    aryQuery.push("insert into user_t values (");
    aryQuery.push("$1, $2, $3, 0)");

    aryParam.push(req.body.userid);
    aryParam.push(req.body.name);
    aryParam.push(req.body.password);

    pool.query(aryQuery.join(" "), aryParam, (perr, pres) => {
        if (perr) {
            const display = {};
            display.error = true;
            res.render('signup', {display: display});
            //【TODO】redirect時に値を渡すことはできないか？の調査がしたい
            //res.redirect('/signup');
        } else {
            // ログイン状態でトップ画面にリダイレクト
            req.login(req.body.userid, function(err) {
                return res.redirect('/home');
            });
        }
    });
});

// ajax用API
app.get('/ndl/:isbn', post.searchNDL);		// NDL検索

// ユーザー
app.get('/:userid', post.index);
//app.get('/:userid', function(req, res) {
//    const viewid = req.params.userid;
//    console.log('viewid: ' + viewid);
//    post.index(req, res, viewid);
//});


app.listen(PORT);
console.log("server starting...");
