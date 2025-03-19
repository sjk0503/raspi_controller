import mysql from "mysql2/promise";

// dotenv 설정
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// 사용할 땐 process.env 로 접근한다.
const pool = mysql.createPool({
  host: process.env.HOST,
  user: process.env.SQL_USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
