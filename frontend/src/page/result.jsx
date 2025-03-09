/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import "../style/result.css";
import HashLoader from "react-spinners/HashLoader";
import { FaLongArrowAltRight } from "react-icons/fa";

export default function Result() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [originalImage, setOriginalImage] = useState("");
  const [generatedImageUrls, setGeneratedImageUrls] = useState([]);

  const artists = ["피카소", "르누아르", "리히텐슈타인", "고흐"];

  const imgSample = [
    { src: "/img/피카소.png", artist: "피카소" },
    { src: "/img/리히텐슈타인.png", artist: "리히텐슈타인" },
    { src: "/img/고흐.png", artist: "고흐" },
    { src: "/img/르누아르.png", artist: "르누아르" },
  ];

  useEffect(() => {
    if (!socket) {
      navigate("/", { replace: true });
      return;
    }

    const handleUpdateStatus = (data) => {
      if (data.error_status) {
        navigate("/", { replace: true });
        return;
      }

      if (data.success) {
        setUserName(data.user_name || "");
        setOriginalImage(data.original_image || "");

        if (Array.isArray(data.generated_image)) {
          setGeneratedImageUrls(data.generated_image);
        } else {
          setGeneratedImageUrls(
            data.generated_image ? [data.generated_image] : []
          );
        }

        setLoading(false);
      }
    };

    socket.on("get_generate_images", handleUpdateStatus);

    return () => {
      socket.off("get_generate_images", handleUpdateStatus);
    };
  }, [socket, navigate]);

  const newImageUrl = (url = "") => {
    if (url.startsWith("wss://")) return url.replace("wss://", "https://");
    if (url.startsWith("ws://")) return url.replace("ws://", "https://");
    return url;
  };

  return (
    <div className="result-container">
      <h1 onClick={() => navigate("/")}>ARTICKET</h1>

      {loading ? (
        // 로딩 중 화면
        <div className="loading-container">
          <div className="loading-img-container">
            {imgSample.map((element, index) => (
              <div
                className="loading-img"
                key={index}
                style={{ "--delay": `${index * 0.5}s` }}
              >
                <p>{element.artist}</p>
                <img
                  src={process.env.PUBLIC_URL + element.src}
                  alt={element.artist}
                />
              </div>
            ))}
          </div>
          <div className="loading-loading">
            <p>화가 스타일로 이미지를 변환 중이에요</p>
            <HashLoader color="#D8D8D8" size={50} />
          </div>
        </div>
      ) : (
        // 로딩 완료 시 결과 화면
        <div className="result-result">
          <div className="result-img-container">
            <div className="result-original-img">
              <h4>
                <span>{userName}</span>님의
                <br />
                예술 작품
              </h4>
              <img src={newImageUrl(originalImage)} alt="원본" />
              <p>원본</p>
            </div>
            <FaLongArrowAltRight className="result-convert-arrow" />
            <div className="result-convert-img-container">
              {generatedImageUrls.length > 0 ? (
                generatedImageUrls.map((url, index) => (
                  <div key={index}>
                    <img
                      src={newImageUrl(url)}
                      alt={`generated_${index + 1}`}
                    />
                    <p>{artists[index] || "알 수 없음"}</p>
                  </div>
                ))
              ) : (
                <p>생성된 이미지가 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
