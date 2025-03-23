# 스마트 신호등 컨트롤러

## 목적
- 횡단보도에서 기다리는 시간을 효율적으로 개선하기 위해 기다리는 사람 수에 따라 신호 시간을 조절한다.

## 아키텍처
1. client - vue.js
2. server - node.js
3. ai - yolo
- 실시간 cctv에서 5초 간격으로 이미지를 가져오고, 해당 이미지를 객체 인식이 가능한 yolo 모델을 통해 기다리고 있는 사람 수를 분석한다. 분석한 사람의 수에 따라 현재 남은 시간의 10%를 감소시킨다.
- 분석한 사람의 수는 시간을 기준으로 DB에 저장되며 특정 시간대에 몇 명이 횡단보도를 이용했는지 알 수 있는 그래프를 제공한다. 해당 그래프를 통해 데이터 분석에 활용할 수 있다.
- client에서 신호등을 원격으로 조종하는 기능도 제공한다. 
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
    uvicorn main:app --reload --host 0.0.0.0 --port 8000;