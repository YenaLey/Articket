import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../style/main.css";
import QR from "./qr";
import { useSocket } from "../context/SocketContext";

export default function Main() {
  const navigate = useNavigate();
  const { uploadStatus, imageUrl } = useSocket();

  useEffect(() => {
    if (uploadStatus) {
      console.log("업로드 성공 상태가 true로 변경됨!");
      if (imageUrl) {
        console.log("받은 이미지 URL:", imageUrl);
      }
    }
  }, [uploadStatus]);

  return (
    <div className="main-container">
      <div className="main-title">
        <p className="main-title-top">당신의 사진이 예술이 되는 곳</p>
        <h4 className="main-title-title">ARTICKET</h4>
      </div>

      {!imageUrl && (
        <div className="main-qr">
          <QR pathname="#/upload" />
          <p onClick={() => navigate("/upload")}>
            QR코드를 인식해서 사진을 선택해주세요
          </p>
        </div>
      )}

      {imageUrl && (
        <div className="main-image">
          <div className="main-imgcontainer">
            <img src={imageUrl} alt="업로드된 이미지" />
          </div>
          <p>사진이 업로드 되었습니다</p>
          <button onClick={()=>navigate('/test')}>예술가 유형 검사하기</button>
        </div>
      )}
    </div>
  );
}
