dotenv = require("dotenv").config()
const mysql = require("mysql2");
const connection = mysql.createConnection ({
    user: process.env.User,
    password: process.env.Password,
    database:process.env.Db,
    host: process.env.Host,
    port: process.env.Db_PORT
});

module.exports = connection






