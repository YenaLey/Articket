import React, { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";

function QR() {
  const [ipAddress, setIpAddress] = useState("");

  useEffect(() => {
    const localIp = "192.168.0.14"; // 현재 노트북의 IP 주소 (연결된 네트워크에 따라 달라짐)
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
