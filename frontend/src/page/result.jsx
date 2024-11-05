/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../style/result.css";
import HashLoader from "react-spinners/HashLoader";

export default function Result() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState(""); // 사용자 이름
  const [artist, setArtist] = useState(""); // 추천된 화가
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null); // 생성된 이미지 URL
  const [qrImageUrl, setQrImageUrl] = useState(null); // QR 코드 이미지 URL
  const [loading, setLoading] = useState(true);

  // 생성된 이미지와 기타 데이터 가져오기
  const getGeneratedImages = async () => {
    try {
      const response = await fetch(`http://${process.env.REACT_APP_HOST}:5000/get-generated-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch generated images');
      }

      const generatedResult = await response.json();
      const { user_name, artist, generated_image, qr_image } = generatedResult;

      setUserName(user_name);
      setArtist(artist);
      setGeneratedImageUrl(generated_image);
      setQrImageUrl(qr_image);

    } catch (error) {
      console.error(error);
      alert('An error occurred while fetching generated images. Please try again.');
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
          <div className="loading-loading">
            <img src={process.env.PUBLIC_URL + '/img/nara.png'} alt="나라" />
            <p>아트픽스가 이미지를 생성하는 중이에요</p>
            <HashLoader color="#D8D8D8" size={50} />
          </div>
        </div>
      ) : (
        <div className="result-result">
          <div className="result-img-container">
            {generatedImageUrl ? (
              <div className="result-img">
                <img src={generatedImageUrl} alt="generated" />
              </div>
            ) : (
              <p>생성된 이미지가 없습니다.</p>
            )}
          </div>
          <div className="result-details">
            <p><strong>사용자 이름:</strong> {userName}</p>
            <p><strong>추천 화가:</strong> {artist}</p>
          </div>
          <div className="qr-container">
            {qrImageUrl && (
              <div className="qr-image">
                <img src={qrImageUrl} alt="QR code"/>
                <p>QR 코드를 스캔하여 성격 테스트 결과를 확인하세요</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
