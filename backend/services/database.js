require('dotenv').config();

const { Pool } = require("pg");
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    max: 20, // số lượng kết nối tối đa trong pool
    idleTimeoutMillis: 30000, // thời gian chờ kết nối không sử dụng trước khi bị đóng
    connectionTimeoutMillis: 2000, // thời gian chờ kết nối trước khi báo lỗi
})

pool.on('error', (err, client) => {
    console.error(err.message);
    process.exit(-1);
});

module.exports = {
    pool
}