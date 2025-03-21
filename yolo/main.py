from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import cv2
import numpy as np
from ultralytics import YOLO

# YOLO 모델 로드
model = YOLO("yolov8n.pt")

# FastAPI 앱 생성
app = FastAPI()

# CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 도메인 허용 (배포 시 특정 도메인으로 변경 가능)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 요청 바디 구조 정의
class ImageRequest(BaseModel):
    base64_image: str

def decode_base64_image(base64_string):
    """Base64 문자열을 OpenCV 이미지로 변환"""
    try:
        image_data = base64.b64decode(base64_string)
        np_array = np.frombuffer(image_data, np.uint8)
        return cv2.imdecode(np_array, cv2.IMREAD_COLOR)
    except Exception as e:
        raise ValueError(f"이미지 디코딩 오류: {e}")

@app.post("/api/v1/detect")
async def detect_people(image_request: ImageRequest):
    try:
        # base64 디코딩 후 OpenCV 이미지로 변환
        image = decode_base64_image(image_request.base64_image)
        
        # YOLO 모델 실행
        results = model(image)

        # 사람 수 계산 (YOLOv8의 사람 클래스 ID는 0)
        num_people = sum(1 for r in results[0].boxes.cls if r == 0)

        return {
            "num_people": num_people}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {e}")
