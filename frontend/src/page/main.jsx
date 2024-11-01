// HomePage.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../style/main.css";
import { FaArrowRight } from "react-icons/fa6";
import QR, {localIp} from "./qr";

function Main() {
  const navigate = useNavigate();
  const [ipAddress, setIpAddress] = useState("");

  useEffect(() => {
    setIpAddress(localIp);
  }, []);

  return (
    <div className="main-container">
      <div className="main-title">
        <p className="main-title-top">일상 속 사진을 명작으로_아트픽스</p>
        <h4 className="main-title-title">ARTPICS</h4>
        <p className="main-title-bottom" onClick={()=>navigate("/total-result")}>
          여러분의 사진을 화가의 손길을 거쳐 새롭게 만나보세요
        </p>
      </div>

      <div className="main-qr">
        {ipAddress && (
          <>
            <QR pathname="#/upload"/>
            <p onClick={() => navigate("/upload")}>
              QR코드를 인식해서 사진을 선택해주세요
            </p>
          </>
        )}
      </div>
      <div className="main-next">
        <p className="main-next" onClick={() => navigate("/test")}>
          <FaArrowRight /> 이미지 업로드 완료
        </p>
      </div>
    </div>
  );
}

export default Main;
