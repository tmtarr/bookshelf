// モジュール
const express = require('express');
const methodOverride = require('method-override');
const app = express();
const post = require('./routes/post');
const api = require('./routes/api');
const passport = require('passport');
const session = require('express-session');

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

// passport設定
require('./modules/passport')();

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
