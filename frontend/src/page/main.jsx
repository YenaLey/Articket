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
        setImgUrl(newImageUrl(status.image_path));
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
  }, [socket]);

  const newImageUrl = (url) => {
    console.log(url);
    let secureUrl = url;

    // wss:// -> https:// 변환
    if (url.startsWith("wss://")) {
      secureUrl = url.replace("wss://", "https://");
    } else if (url.startsWith("ws://")) {
      secureUrl = url.replace("ws://", "https://");
    }

    return secureUrl;
  };

  return (
    <div className="main-container">
      <div className="main-title">
        <p className="main-title-top">당신의 사진이 예술이 되는 곳</p>
        <h4 className="main-title-title">ARTICKET</h4>
      </div>

      {!imgUrl && (
        <div className="main-qr">
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
