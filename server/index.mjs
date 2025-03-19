import express from "express";
import morgan from "morgan";
import http from "http";

// 접속정보 가져오기
import pool from "./db/index.mjs";

const app = express();
const PORT = 8000;

app.use(morgan("dev"));

app.use(express.json());

// async / await 필수
app.get("/api/v1/command-logs", async (req, res) => {
  try {
    // SQL 문법 사용
    const data = await pool.query("SELECT * FROM command_log");
    // 0번 인덱스에 우리가 찾는 데이터가 존재함
    return res.json(data[0]);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

app.get("/api/v1/command-logs/:id", async (req, res) => {
  try {
    const data = await pool.query(
      `SELECT * FROM command_log WHERE id = ${req.params.id}`
    );
    // 찾고자 하는 데이터는 하나일지라도 배열로 리턴되므로, data[0][0] 만 반환
    return res.json(data[0][0]);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

app.get("/api/v1/command-logs/last/get", async (req, res) => {
  try {
    // 맨 마지막 데이터를 가져오려면 내림차순 정렬 후 하나만 가져옴
    const data = await pool.query(
      "SELECT * FROM command_log ORDER BY id DESC LIMIT 1"
    );
    // 찾고자 하는 데이터는 하나일지라도 배열로 리턴되므로, data[0][0] 만 반환
    return res.json(data[0][0]);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

app.post("/api/v1/command-logs", async (req, res) => {
  try {
    // value 가 문자열인 경우, 작은따옴표로 한번 감싸주어야 함
    await pool.query(
      `INSERT INTO command_log (
        program,
        conveyer_speed,
        joint1,
        joint2,
        joint3,
        joint4,
        location_x,
        location_y,
        location_z,
        obj_detection_result,
        temp_result,
        ultrasonic_result,
        infrared_result,
        pressure_result,
        light_result
      ) VALUES (
        '${req.body.program}',
        '${req.body.conveyer_speed}',
        '${req.body.joint1}',
        '${req.body.joint2}',
        '${req.body.joint3}',
        '${req.body.joint4}',
        '${req.body.location_x}',
        '${req.body.location_y}',
        '${req.body.location_z}',
        '${req.body.obj_detection_result}',
        '${req.body.temp_result}',
        '${req.body.ultrasonic_result}',
        '${req.body.infrared_result}',
        '${req.body.pressure_result}',
        '${req.body.light_result}'
      )`
    );
    // 잘 저장되었는지 확인하기 위해, 테이블에 저장된 맨 마지막 값 반환
    const data = await pool.query(
      "SELECT * FROM command_log ORDER BY id DESC LIMIT 1"
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
