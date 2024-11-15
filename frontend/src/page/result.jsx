/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../style/result.css";
import HashLoader from "react-spinners/HashLoader";

export default function Result() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState(""); // 사용자 이름
  const [artist, setArtist] = useState(""); // 추천된 화가
  const [generatedImageUrls, setGeneratedImageUrls] = useState([]); // 생성된 이미지 URLs 배열
  const [qrImageUrl, setQrImageUrl] = useState(null); // QR 코드 이미지 URL
  const [loading, setLoading] = useState(true);
  const who = ["나의 화가 유형", "나와 찰떡궁합인 화가", "나와 안 맞는 화가"];

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
      const { user_name, artist, generated_image, qr_image } = generatedResult;

      setUserName(user_name);
      setArtist(artist);

      // 배열인지 확인 후 설정
      setGeneratedImageUrls(
        Array.isArray(generated_image) ? generated_image : [generated_image]
      );

      setQrImageUrl(qr_image);
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
      <h1 onClick={() => navigate("/")}>ARTPICS</h1>

      {loading ? (
        <div className="loading-container">
          <div className="loading-img-container">
            {imgSample.map((element, index) => (
              <div className="loading-img" key={index}>
                <img
                  src={process.env.PUBLIC_URL + element.src}
                  alt={element.artist}
                />
                <p>{element.artist}</p>
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
          <h4>{userName}의 예술가 유형은?</h4>
          <h2>{artist}</h2>
          <p>성격 유형에 맞춰 추천된 예술가 스타일입니다!</p>

          <div className="result-img-container">
            {generatedImageUrls.length > 0 ? (
              generatedImageUrls.map((url, index) => (
                <div className="result-img" key={index}>
                  <img src={url} alt={`generated ${index + 1}`} />
                  <p>{who[index]}</p>
                </div>
              ))
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
