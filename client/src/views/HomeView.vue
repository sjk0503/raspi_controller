<script setup>
import { ref } from "vue";
import axios from "axios";

const count = ref(0); // 사람 수
const imageBase64 = ref(""); // Base64 인코딩된 이미지
const fileName = ref(""); // 업로드된 파일 이름

// 파일을 Base64로 변환하는 함수
const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(",")[1]; // "data:image/png;base64,..." 제거
      console.log("Base64 코드:", base64String); // 콘솔에 출력
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

// 파일 선택 이벤트 핸들러
const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  fileName.value = file.name; // 파일 이름 저장

  try {
    imageBase64.value = await convertToBase64(file);
  } catch (error) {
    console.error("이미지 변환 오류:", error);
  }
};

// API 호출 함수
const detectPeople = async () => {
  if (!imageBase64.value) {
    alert("먼저 이미지를 업로드하세요!");
    return;
  }

  try {
    const response = await axios.post("http://localhost:8000/api/v1/detect", {
      base64_image: imageBase64.value,
    });

    count.value = response.data.num_people; // 사람 수 업데이트
  } catch (error) {
    console.error("API 호출 오류:", error);
  }
};
</script>

<template>
  <div class="container">
    <h1>사람 수: {{ count }}</h1>

    <!-- 파일 업로드 -->
    <input type="file" @change="handleFileUpload" accept="image/*" />

    <!-- 파일 이름 표시 -->
    <p v-if="fileName">파일 선택됨: {{ fileName }}</p>

    <!-- 변환 버튼 -->
    <button @click="detectPeople" :disabled="!imageBase64">분석 시작</button>

    <!-- 이미지 미리보기 -->
    <img v-if="imageBase64" :src="'data:image/jpeg;base64,' + imageBase64" alt="Uploaded Image" class="preview" />
  </div>
</template>

<style scoped>
.container {
  text-align: center;
  padding: 20px;
}

input {
  margin: 10px;
}

button {
  margin-top: 10px;
  padding: 10px 15px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 5px;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.preview {
  margin-top: 10px;
  max-width: 300px;
  border-radius: 8px;
}
</style>
