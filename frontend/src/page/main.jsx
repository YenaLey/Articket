import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../style/main.css";
import QR from "./qr";
import { useSocket } from "../context/SocketContext";

export default function Main() {
  const navigate = useNavigate();
  const { uploadStatus } = useSocket();

  useEffect(() => {
    if (uploadStatus) {
      console.log("업로드 성공 상태가 true로 변경됨!");
      navigate("/test");
    }
  }, [uploadStatus, navigate]);

  return (
    <div className="main-container">
      <div className="main-title">
        <p className="main-title-top">당신의 사진이 예술이 되는 곳</p>
        <h4 className="main-title-title">ARTPICS</h4>
      </div>

      <div className="main-qr">
        <QR pathname="#/upload" />
        <p onClick={() => navigate("/upload")}>
          QR코드를 인식해서 사진을 선택해주세요
        </p>
      </div>

      <div className="main-next">
        <p onClick={() => navigate("/test")}>나의 예술가 유형 테스트하기 </p>
      </div>

      {uploadStatus ? (
        <p>업로드 완료</p> // 업로드 성공 시 버튼 출력
      ) : (
        <p>업로드 대기 중...</p>
      )}
    </div>
  );
}
