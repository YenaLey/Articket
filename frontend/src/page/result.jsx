/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import "../style/result.css";
import HashLoader from "react-spinners/HashLoader";
import { FaLongArrowAltRight } from "react-icons/fa";

export default function Result() {
  const navigate = useNavigate();
  const { socket, imageStatus, errorStatus } = useSocket();
  const [userName, setUserName] = useState("");
  const [originalImage, setOriginalImage] = useState("");
  const [generatedImageUrls, setGeneratedImageUrls] = useState([]); // 생성된 이미지 URLs 배열
  const [loading, setLoading] = useState(true);

  // 기본 화가 이미지 샘플
  const imgSample = [
    { src: "/img/피카소.png", artist: "피카소" },
    { src: "/img/리히텐슈타인.png", artist: "리히텐슈타인" },
    { src: "/img/고흐.png", artist: "고흐" },
    { src: "/img/르누아르.png", artist: "르누아르" },
  ];

  const artists = ["피카소", "르누아르", "리히텐슈타인", "고흐"];

  // 생성된 이미지와 기타 데이터 가져오기
  useEffect(() => {
    const timer = setTimeout(() => {
      if (imageStatus) {
        (async () => {
          try {
            const response = await fetch(
              `${process.env.REACT_APP_BACKEND_URL}/get-generated-images`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              }
            );

            if (!response.ok) {
              throw new Error("Failed to fetch generated images");
            }

            const generatedResult = await response.json();
            console.log(generatedResult);
            const { user_name, original_image, generated_image } =
              generatedResult;

            setUserName(user_name);
            setOriginalImage(original_image);
            setGeneratedImageUrls(
              Array.isArray(generated_image)
                ? generated_image
                : [generated_image]
            );

            if (socket && generated_image) {
              socket.emit("operation_status", { success: true });
              console.log("생성된 이미지를 모두 가져왔다고 리모컨에 알림~");
            }
          } catch (error) {
            console.error(error);
            navigate("/");
          } finally {
            setLoading(false);
          }
        })();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [imageStatus, socket, navigate]);

  // 이미지 변환 중 오류 발생 시 main화면으로 navigate
  useEffect(() => {
    const timer = setTimeout(() => {
      if (errorStatus) {
        navigate("/", { replace: true });
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [errorStatus, navigate]);

  const newImageUrl = (url) => {
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
    <div className="result-container">
      <h1 onClick={() => navigate("/")}>ARTICKET</h1>

      {loading ? (
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
        <div className="result-result">
          <div className="result-description">
            {/* <h2>{artist}</h2>
            <p>{artists_summary[artist]}</p> */}
          </div>

          <div className="result-img-container">
            <div className="result-original-img">
              <h4>
                <span>{userName}</span>님의<br></br>예술 작품
              </h4>
              <img src={newImageUrl(originalImage)} alt="원본" />
              <p>원본</p>
            </div>
            <FaLongArrowAltRight className="result-convert-arrow" />
            <div className="result-convert-img-container">
              {generatedImageUrls.length > 0 ? (
                generatedImageUrls.map((url, index) => {
                  if (url === null) return null;

                  return (
                    <div key={index}>
                      {/* <p style={{ fontSize: "1.5rem" }}>
                      {who[index] || "정보 없음"}
                    </p> */}
                      <img
                        src={newImageUrl(url)}
                        alt={`generated ${index + 1}`}
                      />
                      <p>{artists[index]}</p>
                    </div>
                  );
                })
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
