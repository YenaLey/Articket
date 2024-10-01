// HomePage.js
import React, { useState, useEffect } from "react";
import axios from 'axios';
import '../style/main.css'
import { QRCodeCanvas } from "qrcode.react";

function Main() {
  const [ipAddress, setIpAddress] = useState("");
  const [image, setImage] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);

  // 파일 선택 핸들러
  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  }

  // 이미지 업로드 함수
  const uploadImage = async () => {
    const formData = new FormData();
    formData.append('image', image);

    try {
      const response = await axios.post('http://localhost:5000/upload-image', formData, {
        headers: {
          'Content-Type' : 'multipart/form-data',
        }
      });
      console.log('이미지 업로드 성공:', response.data);
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
    }
  }

  // 이미지 생성 함수
  const generateImages = async (style) => {
    try {
      const response = await axios.post(`http://localhost:5000/generate-images/${style}`);
      console.log('이미지 생성 성공:', response.data.generated_images);
      setGeneratedImages(response.data.generated_images);
    } catch (error) {
      console.error('이미지 생성 실패:', error);
    }
  }

  // 생성된 이미지 가져오기
  const getGeneratedImages = async () => {
    try {
      const response = await axios.get('http://localhost:5000/get-generated-images');
      console.log('생성된 이미지 가져오기 성공:', response.data.images);
      setGeneratedImages(response.data.images);
    } catch (error) {
      console.error('이미지 가져오기 실패:', error);
    }
  }

  useEffect(() => {
    const localIp = "192.168.0.14"; // 현재 노트북의 IP 주소 (연결된 네트워크에 따라 달라짐)
    setIpAddress(localIp);
  }, []);

  return (
    <div className="main-container">

      <div className="main-title">
        <p className="main-title-top">일상 속 사진을 명작으로_아트픽스</p>
        <h4 className="main-title-title">ARTPICS</h4>
        <p className="main-title-bottom">여러분의 사진을 화가의 손길을 거쳐 새롭게 만나보세요</p>
      </div>

      <div className="main-qr">
        {ipAddress && (
          <>
            <QRCodeCanvas 
              value={`http://${ipAddress}:3000`}
              fgColor="rgb(55, 117, 117)"
              size={64}
            />
            <p>QR코드를 인식해서 사진을 선택해주세요</p>
          </>
        )}
        <input type="file" onChange={handleFileChange} />
        <button onClick={uploadImage}>이미지 업로드</button>
        <button onClick={()=>generateImages('portrait')}>
          인물 이미지 생성
        </button>
        <button onClick={()=>generateImages('landscape')}>
          풍경 이미지 생성
        </button>
      </div>
    </div>
  );
}

export default Main;
