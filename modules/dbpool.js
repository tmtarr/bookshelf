// DB接続
const { Pool } = require('pg');
const config = {
	connectionString: process.env.DATABASE_URL
}
if (process.env.SSL != 'false') {
	config.ssl = {
		rejectUnauthorized: false
	}
}
const pool = new Pool(config);
console.log('接続ログ↓');
console.log(pool);
console.log('接続ログ↑');
module.exports = pool;
