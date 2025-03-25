# 스마트 신호등 컨트롤러

## 목적
- 횡단보도에서 기다리는 시간을 효율적으로 개선하기 위해 기다리는 사람 수에 따라 신호 시간을 조절한다.

## 아키텍처
1. client - vue.js
2. server - node.js
3. yolo - fast api
4. raspberrypi - socketio
- raspberrypi의 카메라를 통해 5초 간격으로 이미지를 가져오고, 해당 이미지를 객체 인식이 가능한 yolo 모델을 통해 기다리고 있는 사람 수를 분석한다. 분석한 사람의 수에 따라 현재 남은 시간의 10%를 감소시킨다.
- 분석한 사람의 수는 시간을 기준으로 DB에 저장되며 특정 시간대에 몇 명이 횡단보도를 이용했는지 알 수 있는 그래프를 제공한다. 해당 그래프를 통해 데이터 분석에 활용할 수 있다.

## 통신 흐름
1. 클라이언트(웹) → 이미지 분석 API (포트 8000)
   - 사용자가 이미지를 업로드하면 Vue 앱이 이미지를 Base64로 변환 후, 포트 8000에서 실행 중인 이미지 분석 API로 전송하여 사람 수를 얻음

2. 클라이언트(웹) → Node.js REST API (포트 9000)
   - 이미지 분석 결과(사람 수)를 받은 후, 해당 값을 Node.js 서버의 POST 엔드포인트로 전송하여 MySQL DB에 저장

3. Node.js 서버
   - DB에 저장된 데이터는 GET 엔드포인트를 통해 24시간 단위로 집계되어 클라이언트에게 제공
   - 타이머 로직이 동작하며, 신호 상태가 변경될 때마다 socket.io를 사용해 LED 상태 정보를 모든 연결된 클라이언트(웹과 라즈베리파이)로 브로드캐스트

4. 라즈베리파이 (Python)
   - 웹소켓 클라이언트를 통해 Node.js 서버에 연결하고, LED 상태 정보를 수신하여 지정된 GPIO 핀에 따라 실제 LED를 제어

## 사용법

### 필요한 패키지 설치

#### `./client`, `./server`
    npm i

#### `./yolo`
    pip install -r ./requirements.txt

### 실행

#### `./client`
    npm run dev

#### `./server`
    node ./index.mjs
    # OR
    nodemon ./index.mjs

#### `./yolo`
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
