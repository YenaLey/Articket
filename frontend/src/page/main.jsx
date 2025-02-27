import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../style/main.css";
import QR from "./qr";
import { useSocket } from "../context/SocketContext";

export default function Main() {
  const navigate = useNavigate();
  const { uploadStatus, imageUrl, receivedOptions } = useSocket();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (uploadStatus) {
        console.log("업로드 성공 상태가 true로 변경됨!");
        if (imageUrl) {
          console.log("받은 이미지 URL:", imageUrl);
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [uploadStatus, imageUrl]);

  useEffect(() => {
    if (receivedOptions[0] === "C") {
      // navigate("/test");
      navigate("/result");
    }
  }, [receivedOptions, navigate]);

  return (
    <div className="main-container">
      <div className="main-title">
        <p className="main-title-top">당신의 사진이 예술이 되는 곳</p>
        <h4 className="main-title-title">ARTICKET</h4>
      </div>

      {!imageUrl && (
        <div className="main-qr">
          <QR pathname={`#/upload`} />
          <p onClick={() => navigate(`#/upload`)}>
            QR코드를 스캔해 리모콘에 접속해주세요
          </p>
        </div>
      )}

      {imageUrl && (
        <div className="main-image">
          <div className="main-imgcontainer">
            <img src={imageUrl} alt="업로드된 이미지" />
          </div>
          <p>사진이 업로드 되었습니다</p>
        </div>
      )}
    </div>
  );
}
