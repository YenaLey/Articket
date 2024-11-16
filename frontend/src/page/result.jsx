/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import "../style/result.css";
import HashLoader from "react-spinners/HashLoader";

export default function Result() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [userName, setUserName] = useState("");
  const [artist, setArtist] = useState("");
  const [matchingArtists, setMatchingArtists] = useState({});
  const [originalImage, setOriginalImage] = useState("");
  const [generatedImageUrls, setGeneratedImageUrls] = useState([]); // 생성된 이미지 URLs 배열
  const [loading, setLoading] = useState(true);
  const who = ["나의 화가 유형", "나와 찰떡인 화가", "나와 상극인 화가"];
  const artists_summary = {
    '세련된 일상의 리히텐슈타인': "일상에 신선한 시각을 더하며 다재다능함을 발휘하는 창의적인 예술가",
    '감정과 열정의 섬세한 고흐': "삶의 깊이를 탐구하며 위로와 영감을 전하는 진지한 예술가",
    '대담하고 창의적인 피카소': "새로운 길을 개척하며 성장을 이끄는 창의적인 리더형 예술가",
    '낙천적이고 따뜻한 르누아르': "따뜻한 색감과 넘치는 표현으로 사람들과의 조화로운 관계와 삶의 아름다움을 찬미한 낙천적인 예술가"
  }

  // 기본 화가 이미지 샘플
  const imgSample = [
    { src: "/img/피카소.png", artist: "피카소" },
    { src: "/img/리히텐슈타인.png", artist: "리히텐슈타인" },
    { src: "/img/고흐.png", artist: "고흐" },
    { src: "/img/르누아르.png", artist: "르누아르" },
  ];

  // 생성된 이미지와 기타 데이터 가져오기
  const getGeneratedImages = async () => {
    try {
      const response = await fetch(
        `http://${process.env.REACT_APP_HOST}:5000/get-generated-images`,
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
      const { user_name, artist, matching_artists, original_image, generated_image } = generatedResult;

      setUserName(user_name);
      setArtist(artist);
      setMatchingArtists(matching_artists);
      setOriginalImage(original_image);
      setGeneratedImageUrls(
        Array.isArray(generated_image) ? generated_image : [generated_image]
      );

      if (socket && generated_image) {
        socket.emit("operation_status", { success: true });
        console.log("생성된 이미지를 모두 가져왔다고 리모컨에 알림~")
      }

    } catch (error) {
      console.error(error);
      navigate("/error");
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트가 마운트될 때 API 호출
  useEffect(() => {
    getGeneratedImages();
  }, []);

  return (
    <div className="result-container">
      <h1 onClick={() => navigate("/")}>ARTICKET</h1>

      {loading ? (
        <div className="loading-container">
          <div className="loading-img-container">
            {imgSample.map((element, index) => (
              <div className="loading-img" key={index} style={{ "--delay": `${index * 0.5}s` }}>
                <p>{element.artist}</p>
                <img
                  src={process.env.PUBLIC_URL + element.src}
                  alt={element.artist}
                />
              </div>
            ))}
          </div>
          <div className="loading-loading">
            <p>
              성격 유형을 분석하여 해당 화가 스타일로 이미지를 변환 중이에요
            </p>
            <HashLoader color="#D8D8D8" size={50} />
          </div>
        </div>
      ) : (
        <div className="result-result">
          <div className="result-description">
            <h4><span>{userName}</span> 의 예술가 유형은?</h4>
            <h2>{artist}</h2>
            <p>{artists_summary[artist]}</p>
          </div>

          <div className="result-img-container">
            <div className="result-img">
              <p style={{ fontSize: "1.5rem" }}>원본사진</p>
              <img src={originalImage} alt="원본" />
              <p>&nbsp;</p>
            </div>
            {generatedImageUrls.length > 0 ? (
              generatedImageUrls.map((url, index) => {
                if (url === null) return null;


                return (
                  <div className="result-img" key={index}>
                    <p style={{ fontSize: "1.5rem" }}>{who[index] || "정보 없음"}</p>
                    <img src={url} alt={`generated ${index + 1}`} />
                    <p>
                      {index === 0 ? artist : index === 1 ? matchingArtists['good'] : matchingArtists['bad']}
                    </p>
                  </div>
                );
              })
            ) : (
              <p>생성된 이미지가 없습니다.</p>
            )}

          </div>

          {/* <div className="qr-container">
            {qrImageUrl && (
              <div className="qr-image">
                <img src={qrImageUrl} alt="QR code" />
                <p>QR 코드를 스캔하여 성격 테스트 결과를 확인하세요</p>
              </div>
            )}
          </div> */}
        </div>
      )}
    </div>
  );
}
