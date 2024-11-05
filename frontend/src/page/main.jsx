// HomePage.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../style/main.css";
import QR, { localIp } from "./qr";

function Main() {
  const navigate = useNavigate();
  const [ipAddress, setIpAddress] = useState("");

  useEffect(() => {
    setIpAddress(localIp);
  }, []);

  return (
    <div className="main-container">
      <div className="main-title">
        <p className="main-title-top">당신의 사진이 예술이 되는 곳</p>
        <h4 className="main-title-title">ARTPICS</h4>
      </div>

      <div className="main-qr">
        {ipAddress && (
          <>
            <QR pathname="#/upload" />
            <p onClick={() => navigate("/upload")}>
              QR코드를 인식해서 사진을 선택해주세요
            </p>
          </>
        )}
      </div>
      <div className="main-next">
        <p onClick={() => navigate("/test")}>나의 예술가 유형 테스트하기 </p>
      </div>
    </div>
  );
}

export default Main;
