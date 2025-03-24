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

// GET: 24시간 단위로 사람 수 합계 반환
app.get("/api/v1/smart_blinker", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT HOUR(detected_time) AS hour, SUM(people_count) AS total_people FROM smart_blinker GROUP BY hour ORDER BY hour ASC"
    );
    // 0시 ~ 23시까지 24시간 배열 생성 (데이터가 없는 시간은 0)
    let result = [];
    for (let i = 0; i < 24; i++) {
      result.push({ hour: i, total_people: 0 });
    }
    rows.forEach(row => {
      result[row.hour] = { hour: row.hour, total_people: row.total_people };
    });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

// POST: 이미지 분석 후 사람 수를 DB에 저장
app.post("/api/v1/smart_blinker", async (req, res) => {
  try {
    // 현재 시간 가져오기 (UTC 기준)
    const utcNow = new Date();

    // 대한민국 표준시(KST)로 변환 (UTC+9)
    const kstNow = new Date(utcNow.getTime() + 9 * 60 * 60 * 1000);

    // MySQL DATETIME 형식으로 변환 (YYYY-MM-DD HH:MM:SS)
    const formattedTime = kstNow.toISOString().slice(0, 19).replace("T", " ");

    await pool.query(
      `INSERT INTO smart_blinker (people_count, detected_time) VALUES ('${req.body.people_count}', '${formattedTime}')`
    );

    // 저장된 최신 데이터 반환
    const data = await pool.query(
      "SELECT * FROM smart_blinker ORDER BY id DESC LIMIT 1"
    );

    return res.status(201).json(data[0][0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


const server = http.createServer(app);

server.listen(PORT, () => console.log(`This server is listening on ${PORT}`));
