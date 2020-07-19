// 変数定義
var express = require('express'),
	methodOverride = require('method-override'),
	app = express(),
	post = require('./routes/post'),
	api = require('./routes/api'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
    session = require('express-session'),
    pool = require('./modules/dbpool'),
    hashgen = require('./modules/hashgen')
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
app.use(session({
    secret: "nazo",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// パスワードチェックのロジック
passport.use(new LocalStrategy(
    function(username, password, done) {
        //return done(null, "hello");
        //console.log("にんしょうちゅう");
        //console.log(getHash(username, password));
        const hash = hashgen.getHash(username, password);

        // 認証
        var aryQuery = [];
        aryQuery.push("select userid from user_t where");
        aryQuery.push("userid = $1");
        aryQuery.push("and password = $2");
    
        var aryParam = [];
        aryParam.push(username);
        //aryParam.push(password);
        aryParam.push(hash);
    
        pool.query(aryQuery.join(" "), aryParam, (perr, pres) => {
            //console.log(pres.rowCount);
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
app.get('/doc', post.doc);              // ドキュメント
app.get('/login', post.login);          // ログイン
app.get('/logout', post.logout);
app.post('/login',
    passport.authenticate('local', {
        successRedirect: '/home',
        failureRedirect: '/login'
    })
);
app.get('/signup', post.signup);        // サインアップ画面
app.post('/signup', post.addUser);      // サインアップ処理

// 書籍詳細情報の参照・編集
app.get('/posts/new', post.new);		// 新規作成フォームを表示
app.post('/posts/create', post.create);	// formのpost先
app.get('/posts/:id/edit', post.edit);	// 更新 編集フォームを表示
app.put('/posts/:id', post.update);		// フォームの投稿先
app.delete('/posts/:id', post.delete);	// 削除

// ajax用API
app.get('/api/ndl/:isbn', api.searchNDL);		// NDL検索

// 他ユーザーのほんだな参照
app.get('/:userid', post.index);

app.listen(PORT);
console.log("server starting...");
