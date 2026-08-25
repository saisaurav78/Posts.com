require("dotenv").config();

const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.Host,
  port: Number(process.env.Db_PORT),
  user: process.env.User,
  password: process.env.Password,
  database: process.env.Db,

  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,

  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test DB connectivity when app starts
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:");
    console.error(err);
    return;
  }

  console.log("Connected to Aiven MySQL");
  connection.release();
});

module.exports = pool;
