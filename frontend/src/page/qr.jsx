/* eslint-disable no-undef */
import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import PropTypes from "prop-types";

export const localIp = "10.0.18.137";
function QR({ pathname }) {
  return (
    <div>
      <>
        <QRCodeCanvas
          value={`http://${process.env.REACT_APP_HOST}:3000/${pathname}`}
          size={64}
        />
      </>
    </div>
  );
}

QR.propTypes = {
  pathname: PropTypes.string.isRequired,
};

export default QR;
