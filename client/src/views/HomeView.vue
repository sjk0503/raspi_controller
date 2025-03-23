<script setup>
import { ref, onMounted, watch } from "vue";
import axios from "axios";
import { Chart } from "chart.js/auto";

// 기본값 상수
const INITIAL_CROSSWALK_TIMER = 100; // 횡단보도 빨간불 기본 시간
const CROSSWALK_GREEN_TIME = 30; // 횡단보도 초록불 지속 시간
const CAR_YELLOW_TIME = 10; // 자동차 신호 주황불 지속 시간

// 신호 상태
const crosswalkSignal = ref("red"); // 횡단보도 신호 (red, green)
const carSignal = ref("green"); // 자동차 신호 (green, yellow, red)

// 신호 카운트다운
const crosswalkTimer = ref(INITIAL_CROSSWALK_TIMER);

// 사람 수 카운트
const peopleCount = ref(0);
const prevPeopleCount = ref(0);

// 타이머 실행 상태 및 타이머 ID
const isRunning = ref(false);
let timer = null;
const currentTime = ref("");

// 이미지 파일 및 Base64 변환
const imageFile = ref(null);
const base64Image = ref("");

// 그래프 관련
const showChart = ref(false);
let chartInstance = null;

// 시간 표시 업데이트
const updateTime = () => {
  setInterval(() => {
    const now = new Date();
    currentTime.value = now.toLocaleString(); // 현재 시간 업데이트
  }, 1000);
};

onMounted(() => {
  updateTime(); // 컴포넌트 마운트 시 시간 업데이트 시작
});

// 🚦 신호 시작 (정지 상태에서 재개하면 현재 시간부터 시작)
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
        carSignal.value = "yellow"; // 자동차 주황불
        crosswalkTimer.value--;
      } else {
        // 빨간불 종료 → 횡단보도 초록불로 전환
        crosswalkSignal.value = "green";
        carSignal.value = "red";
        crosswalkTimer.value = CROSSWALK_GREEN_TIME;
      }
    } else if (crosswalkSignal.value === "green") {
      if (crosswalkTimer.value > 0) {
        crosswalkTimer.value--;
      } else {
        // 초록불 종료 → 다시 빨간불로 전환
        crosswalkSignal.value = "red";
        carSignal.value = "green"; // 자동차 초록불
        crosswalkTimer.value = INITIAL_CROSSWALK_TIMER;
        peopleCount.value = 0;
        prevPeopleCount.value = 0;
      }
    }
  }, 1000);
};

// 🚦 신호 정지 (현재 남은 시간을 기준으로 정지)
const stopSignal = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
    isRunning.value = false;
  }
};

// 🚦 신호 초기화 (신호를 기본값으로 재설정 후 정지)
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
    base64Image.value = reader.result.split(",")[1]; // 접두사 제거
    console.log("Base64 변환 완료:", base64Image.value);
  };
};

// 🖼️ 이미지 분석 API 호출 (사람 수에 따라 횡단보도 빨간불 시간 감소)
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

// 차트 생성 함수 (DB API에서 데이터를 가져와 차트를 그림)
const createChart = async () => {
  try {
    const response = await axios.get("http://127.0.0.1:9000/api/v1/smart_blinker");
    // API에서 반환한 데이터를 시간 순으로 정렬 (오름차순)
    const data = response.data.sort((a, b) => new Date(a.detected_time) - new Date(b.detected_time));
    const labels = data.map((d) => d.detected_time);
    const counts = data.map((d) => d.people_count);

    const ctx = document.getElementById("peopleChart").getContext("2d");
    // 기존 차트 인스턴스가 있으면 제거
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "사람 수",
          data: counts,
          borderColor: "#007bff",
          backgroundColor: "rgba(0, 123, 255, 0.2)",
          tension: 0.3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: "시간" }
          },
          y: {
            title: { display: true, text: "사람 수" },
            beginAtZero: true,
          }
        }
      }
    });
  } catch (error) {
    console.error("차트 데이터 로드 오류:", error);
  }
};

// 그래프 분석 버튼 클릭 시 토글
const toggleChart = () => {
  showChart.value = !showChart.value;
  // 그래프가 보일 때 차트 생성
  if (showChart.value) {
    // DOM 업데이트 후 차트 생성을 위해 약간의 딜레이
    setTimeout(createChart, 100);
  }
};

// 더이상 임의의 더미 데이터는 사용하지 않음 (나중에 DB API로 대체)
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
        <p class="timer">남은 시간: {{ crosswalkTimer }} 초</p>
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
    <p class="current-time">현재 시각: {{ currentTime }}</p>

    <div class="chart-section">
      <button @click="toggleChart" class="btn chart-toggle">
        {{ showChart ? "그래프 닫기" : "그래프 분석" }}
      </button>
      <div v-if="showChart" class="chart-container">
        <canvas id="peopleChart"></canvas>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 700px;
  margin: 30px auto;
  padding: 20px;
  text-align: center;
  background: #f9f9f9;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.title {
  font-size: 2rem;
  margin-bottom: 20px;
  color: #333;
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
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}
.start { background: #28a745; color: white; }
.stop { background: #dc3545; color: white; }
.reset { background: #ffc107; color: white; }
.analyze { background: #007bff; color: white; }
.chart-toggle { background: #6f42c1; color: white; }
.file-input {
  margin: 10px;
}
.image-preview img {
  max-width: 100%;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  margin-top: 10px;
}
.people-count {
  font-size: 1.2rem;
  font-weight: bold;
  margin-top: 20px;
}
.current-time {
  font-size: 1rem;
  color: #555;
  margin-top: 5px;
}
.chart-section {
  margin-top: 30px;
}
.chart-container {
  position: relative;
  height: 300px;
  margin-top: 20px;
}
</style>
