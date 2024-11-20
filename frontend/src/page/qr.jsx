/* eslint-disable no-undef */
import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import PropTypes from "prop-types";

function QR({ pathname }) {
  return (
    <div>
      <>
        <QRCodeCanvas
          value={`${process.env.REACT_APP_FRONTEND_URL}/${pathname}`}
          size={121}
        />
      </>
    </div>
  );
}

QR.propTypes = {
  pathname: PropTypes.string.isRequired,
};

export default QR;
