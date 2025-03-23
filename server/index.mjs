import express from "express";
import morgan from "morgan";
import http from "http";
import cors from "cors";

// 접속정보 가져오기
import pool from "./db/index.mjs";

const app = express();
const PORT = 9000;

app.use(morgan("dev"));

app.use(express.json());

app.use(cors());

// async / await 필수
app.get("/api/v1/smart_blinker", async (req, res) => {
  try {
    // SQL 문법 사용
    const data = await pool.query("SELECT * FROM smart_blinker");
    // 0번 인덱스에 우리가 찾는 데이터가 존재함
    return res.json(data[0]);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

app.post("/api/v1/smart_blinker", async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO smart_blinker (people_count) VALUES ('${req.body.people_count}')`);
    // 잘 저장되었는지 확인하기 위해, 테이블에 저장된 맨 마지막 값 반환
    const data = await pool.query(
      "SELECT * FROM smart_blinker ORDER BY id DESC LIMIT 1"
    );
    return res.status(201).json(data[0][0]);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

const server = http.createServer(app);

server.listen(PORT, () => console.log(`This server is listening on ${PORT}`));
