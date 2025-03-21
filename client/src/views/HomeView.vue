<script setup>
import { ref } from "vue";
import axios from "axios";

// 기본값 상수
const INITIAL_CROSSWALK_TIMER = 100;
const CROSSWALK_GREEN_TIME = 30;
const CAR_YELLOW_TIME = 10;

// 신호 상태
const crosswalkSignal = ref("red");
const carSignal = ref("green");

// 신호 카운트다운
const crosswalkTimer = ref(INITIAL_CROSSWALK_TIMER);

// 사람 수 카운트
const peopleCount = ref(0);
const prevPeopleCount = ref(0);

// 타이머 실행 상태
const isRunning = ref(false);
let timer = null;

// 이미지 파일 및 Base64 변환
const imageFile = ref(null);
const base64Image = ref("");

// 🚦 신호 시작
const startSignal = () => {
  if (isRunning.value) return;
  isRunning.value = true;
  runTimer();
};

// 🚦 타이머 실행
const runTimer = () => {
  timer = setInterval(() => {
    if (crosswalkSignal.value === "red") {
      if (crosswalkTimer.value > 10) {
        crosswalkTimer.value--;
      } else if (crosswalkTimer.value > 0 && crosswalkTimer.value <= CAR_YELLOW_TIME) {
        carSignal.value = "yellow";
        crosswalkTimer.value--;
      } else {
        crosswalkSignal.value = "green";
        carSignal.value = "red";
        crosswalkTimer.value = CROSSWALK_GREEN_TIME;
      }
    } else if (crosswalkSignal.value === "green") {
      if (crosswalkTimer.value > 0) {
        crosswalkTimer.value--;
      } else {
        crosswalkSignal.value = "red";
        carSignal.value = "green";
        crosswalkTimer.value = INITIAL_CROSSWALK_TIMER;
        peopleCount.value = 0;
        prevPeopleCount.value = 0;
      }
    }
  }, 1000);
};

// 🚦 신호 정지
const stopSignal = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
    isRunning.value = false;
  }
};

// 🚦 신호 초기화
const resetSignal = () => {
  stopSignal();
  crosswalkSignal.value = "red";
  carSignal.value = "green";
  crosswalkTimer.value = INITIAL_CROSSWALK_TIMER;
  peopleCount.value = 0;
  prevPeopleCount.value = 0;
};

// 🖼️ 이미지 선택 및 Base64 변환
const onImageChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    imageFile.value = file;
    convertToBase64(file);
  }
};

const convertToBase64 = (file) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    base64Image.value = reader.result.split(",")[1];
  };
};

// 🖼️ 이미지 분석
const detectPeople = async () => {
  if (!base64Image.value) {
    alert("이미지를 먼저 업로드하세요!");
    return;
  }
  try {
    const response = await axios.post("http://127.0.0.1:8000/api/v1/detect", {
      base64_image: base64Image.value,
    });

    const detectedPeople = response.data.num_people;
    const newPeople = detectedPeople - prevPeopleCount.value;
    if (newPeople > 0 && crosswalkSignal.value === "red" && crosswalkTimer.value > 10) {
      crosswalkTimer.value = Math.max(10, crosswalkTimer.value - newPeople * 10);
    }
    prevPeopleCount.value = detectedPeople;
    peopleCount.value = detectedPeople;
  } catch (error) {
    console.error("API 호출 오류:", error);
  }
};
</script>

<template>
  <div class="container">
    <h1 class="title">🚦 스마트 신호등 시스템</h1>

    <div class="signals">
      <div class="signal-box crosswalk">
        <p>횡단보도 신호</p>
        <div class="light-box">
          <div class="light red" :class="{ active: crosswalkSignal === 'red' }"></div>
          <div class="light green" :class="{ active: crosswalkSignal === 'green' }"></div>
        </div>
        <p class="timer">{{ crosswalkTimer }}</p>
      </div>

      <div class="signal-box car">
        <p>자동차 신호</p>
        <div class="light-box">
          <div class="light green" :class="{ active: carSignal === 'green' }"></div>
          <div class="light yellow" :class="{ active: carSignal === 'yellow' }"></div>
          <div class="light red" :class="{ active: carSignal === 'red' }"></div>
        </div>
      </div>
    </div>

    <div class="controls">
      <button @click="startSignal" :disabled="isRunning" class="btn start">신호 시작</button>
      <button @click="stopSignal" class="btn stop">신호 정지</button>
      <button @click="resetSignal" class="btn reset">신호 초기화</button>
    </div>

    <div class="image-section">
      <input type="file" @change="onImageChange" accept="image/*" class="file-input">
      <button @click="detectPeople" class="btn analyze">이미지 분석</button>
      <div v-if="base64Image" class="image-preview">
        <img :src="'data:image/jpeg;base64,' + base64Image" alt="업로드된 이미지">
      </div>
    </div>

    <p class="people-count">현재 감지된 사람 수: {{ peopleCount }} 명</p>
  </div>
</template>

<style scoped>
.container {
  max-width: 600px;
  margin: 30px auto;
  padding: 20px;
  text-align: center;
  background: #f9f9f9;
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 2rem;
  margin-bottom: 20px;
}

.signals {
  display: flex;
  justify-content: space-around;
  margin: 20px 0;
}

.signal-box {
  text-align: center;
}

.light-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.light {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #333;
  transition: 0.3s;
  box-shadow: none;
}

.red.active {
  background: red;
  box-shadow: 0 0 10px red;
}

.green.active {
  background: green;
  box-shadow: 0 0 10px green;
}

.yellow.active {
  background: orange;
  box-shadow: 0 0 10px orange;
}

.timer {
  font-size: 1.2rem;
  margin-top: 10px;
}

.controls {
  margin: 20px 0;
}

.btn {
  margin: 10px;
  padding: 10px 20px;
  font-size: 1rem;
  border-radius: 5px;
  cursor: pointer;
}

.start { background: #28a745; color: white; }
.stop { background: #dc3545; color: white; }
.reset { background: #ffc107; color: white; }
.analyze { background: #007bff; color: white; }

.image-preview img {
  max-width: 100%;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.people-count {
  font-size: 1.2rem;
  font-weight: bold;
}
</style>
