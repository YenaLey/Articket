import React, { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react"; // QRCodeCanvas 임포트

function QR() {
  const [ipAddress, setIpAddress] = useState("");

  useEffect(() => {
    const localIp = "192.168.133.155"; // Mac에서 확인한 IP 주소
    setIpAddress(localIp);
  }, []);

  return (
    <div>
      <h1>QR 코드 페이지</h1>
      {ipAddress && (
        <>
          <QRCodeCanvas value={`http://${ipAddress}:3000`} size={256} />
          <p>이 QR 코드를 스캔하여 접속하세요.</p>
        </>
      )}
    </div>
  );
}

export default QR;
