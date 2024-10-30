import React, { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import PropTypes from "prop-types";

export const localIp = "10.0.18.137";

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

QR.propTypes = {
  pathname: PropTypes.string.isRequired,
};

export default QR;
