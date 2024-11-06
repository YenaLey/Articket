/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../style/main.css";
import QR from "./qr";
import axios from "axios";

function Main() {
  const [uploadStatus, setUploadStatus] = useState(null); 
  const navigate = useNavigate();

  // 주기적으로 상태를 확인하는 함수
  const checkUploadStatus = async () => {
    try {
      const response = await axios.get(`http://${process.env.REACT_APP_HOST}:5000/upload-image-status`);
      if (response.status === 200) {
        setUploadStatus(response.data);
      }
    } catch (error) {
      console.error("Error checking upload status", error);
    }
  };

    // 상태가 변경되었을 때, 'completed' 상태로 변경되면 navigate 실행
    useEffect(() => {
      const intervalId = setInterval(() => {
        checkUploadStatus();
      }, 10000); // 10초마다 상태 확인
  
      return () => clearInterval(intervalId); // 컴포넌트가 unmount 될 때, interval 정리
    }, []);
  
    useEffect(() => {
      if (uploadStatus && uploadStatus.status === 'completed') {
        navigate('/test'); // 'completed' 상태일 때 페이지 이동
      }
    }, [uploadStatus, navigate]);

  return (
    <div className="main-container">
      <div className="main-title">
        <p className="main-title-top">당신의 사진이 예술이 되는 곳</p>
        <h4 className="main-title-title">ARTPICS</h4>
      </div>

      <div className="main-qr">
        <>
          <QR pathname="#/upload" />
          <p onClick={() => navigate("/upload")}>
            QR코드를 인식해서 사진을 선택해주세요
          </p>
        </>
      </div>

      <div className="main-next">
        <p onClick={() => navigate("/test")}>나의 예술가 유형 테스트하기 </p>
      </div>
      <div className="main-upload">
        <p>이미지 업로드 상태: {uploadStatus ? uploadStatus.status : '대기 중'}</p>
      </div>
    </div>
  );
}

export default Main;
