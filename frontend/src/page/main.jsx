import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/main.css";
import QR from "./qr";
import { useSocket } from "../context/SocketContext";
import PropTypes from "prop-types";

export default function Main({ room }) {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [imgUrl, setImgUrl] = useState("");

  useEffect(() => {
    if (!socket) return;

    socket.emit("join", { room });

    const handleUploadImage = (status) => {
      if (status.success) {
        setImgUrl(status.image_path);
      }
    };

    const handleStartGenerateImages = (status) => {
      if (status.success) {
        navigate("/result");
      }
    };

    socket.on("upload_image", handleUploadImage);
    socket.on("start_generate_images", handleStartGenerateImages);

    return () => {
      socket.off("upload_image", handleUploadImage);
      socket.off("start_generate_images", handleStartGenerateImages);
    };
  }, [socket, room, navigate]);

  const handleCopyQRLink = () => {
    const qrLink = `${window.location.origin}/#/upload?room=${room}`;
    navigator.clipboard.writeText(qrLink);
    alert("QR 링크가 복사되었습니다.");
  };

  return (
    <div className="main-container">
      <div className="main-title">
        <p className="main-title-top">당신의 사진이 예술이 되는 곳</p>
        <h4 className="main-title-title">ARTICKET</h4>
      </div>

      {!imgUrl && (
        <div
          className="main-qr"
          onClick={handleCopyQRLink}
          style={{ cursor: "pointer" }}
          role="button"
          tabIndex="0"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCopyQRLink();
          }}
        >
          <QR pathname={`#/upload?room=${room}`} />
          <p>QR코드를 스캔해 리모콘에 접속해주세요</p>
        </div>
      )}

      {imgUrl && (
        <div className="main-image">
          <div className="main-imgcontainer">
            <img src={imgUrl} alt="업로드된 이미지" />
          </div>
          <p>사진이 업로드 되었습니다</p>
        </div>
      )}
    </div>
  );
}

Main.propTypes = {
  room: PropTypes.string.isRequired,
};
