// モジュール
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const pool = require('./dbpool');
const hashgen = require('./hashgen');

// passport設定
module.exports = () => {
    // ユーザー情報をセッション情報に格納する際のシリアライズ／取得する際のデシリアライズ
    passport.serializeUser(function(user, done) {
        done(null, user);
    });
    passport.deserializeUser(function(user, done) {
        done(null, user);
    });

    // パスワードチェックのロジック
    passport.use(new LocalStrategy(
        function(username, password, done) {
            const hash = hashgen.getHash(username, password);

            // 認証
            const aryQuery = [];
            aryQuery.push("select userid from user_t where");
            aryQuery.push("userid = $1");
            aryQuery.push("and password = $2");
        
            const aryParam = [];
            aryParam.push(username);
            aryParam.push(hash);
        
            pool.query(aryQuery.join(" "), aryParam, (perr, pres) => {
                if (pres.rowCount == 0) {
                    return done(null, false, {message: 'ちがうよ'});
                }
                return done(null, username);
            });
        }
    ));
}
