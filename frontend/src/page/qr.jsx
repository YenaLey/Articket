import React, { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";

export const localIp = "10.0.28.91"; // 현재 노트북의 IP 주소 (연결된 네트워크에 따라 달라짐)

function QR({ pathname }) {
  const [ipAddress, setIpAddress] = useState("");

  useEffect(() => {
    setIpAddress(localIp);
  }, []);

  return (
    <div>
      {ipAddress && (
        <>
          <QRCodeCanvas
            value={`http://${ipAddress}:3000/${pathname}`}
            size={64}
          />
        </>
      )}
    </div>
  );
}

export default QR;
