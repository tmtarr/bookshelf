// 変数定義
var express = require('express'),
	methodOverride = require('method-override'),
	app = express(),
	post = require('./routes/post');

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

// ルーティング設定
app.get('/', post.index);
app.get('/posts/new', post.new);		// 新規作成フォームを表示
app.post('/posts/create', post.create);	// formのpost先
app.get('/posts/:id/edit', post.edit);	// 更新 編集フォームを表示
app.put('/posts/:id', post.update);		// フォームの投稿先
app.delete('/posts/:id', post.destroy);	// 削除

app.listen(PORT);
console.log("server starting...");

/*
http://localhost:5000/
https://intense-temple-32472.herokuapp.com/
*/
