import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style/upload.css";
import { ImFilePicture } from "react-icons/im";
import { localIp } from "./qr";

export default function Upload() {
  const [imgPreview, setImgPreview] = useState(null);
  const [fileName, setFileName] = useState("사진 선택하기"); // 초기 파일 선택 문구
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false); // 업로드 상태
  const [error, setError] = useState(null); // 에러 메시지 상태
  const [ipAddress, setIpAddress] = useState("");

  const BASE_URL = process.env.REACT_APP_HOST;
  console.log("base url: ", BASE_URL);

  useEffect(() => {
    setIpAddress(localIp); // 수정된 부분
  }, []);

  // 파일 선택 핸들러
  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("이미지 파일만 업로드할 수 있습니다."); // 파일 형식 검증
        return;
      }
      setFileName(file.name); // 파일명을 상태로 저장
      setImage(file); // 파일 저장 (업로드용)

      // 이미지 미리보기 URL 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setImgPreview(reader.result); // 이미지 미리보기 저장
        setError(null); // 에러 초기화
      };
      reader.readAsDataURL(file);
    }
  };

  // 이미지 업로드 함수
  const uploadImage = async () => {
    if (!image) return;

    const formData = new FormData();
    formData.append("image", image);

    setUploading(true); // 업로드 시작
    setError(null); // 에러 초기화

    try {
      const response = await axios.post(
        `http://${BASE_URL}:5000/upload-image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("이미지 업로드 성공:", response.data);

      // 이미지 생성 함수 호출
      await generateImage();
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      setError("이미지 업로드에 실패했습니다."); // 에러 메시지 설정
    } finally {
      setUploading(false); // 업로드 완료
    }
  };

  // 이미지 생성 함수
  const generateImage = async () => {
    setUploading(true); // 업로드 상태를 생성 중으로 변경
    setError(null); // 에러 초기화

    try {
      const style = "landscape"; // 스타일을 필요에 따라 수정
      const response = await axios.post(
        `http://${BASE_URL}:5000/generate-images/${style}`
      );
      console.log("이미지 생성 성공:", response.data);
      // 여기에서 생성된 이미지를 처리하거나 결과를 보여줄 수 있습니다.
    } catch (error) {
      console.error("이미지 생성 실패:", error);
      setError("이미지 생성에 실패했습니다."); // 에러 메시지 설정
    } finally {
      setUploading(false); // 업로드 완료
    }
  };

  return (
    <div className="upload">
      <div className="upload-container">
        <h1>ARTPICS</h1>

        {/* 이미지 미리보기 */}
        <div className="upload-image">
          {imgPreview ? (
            <img src={imgPreview} alt="미리보기" />
          ) : (
            <ImFilePicture />
          )}
        </div>

        {/* 파일 선택 input 및 업로드 버튼 */}
        <div className="upload-select">
          {/* 커스텀 파일 선택 버튼 */}
          <label
            className={`${image ? "file-selected" : "custom-file-label"}`}
            htmlFor="file-input"
          >
            {fileName}
          </label>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }} // 기본 파일 입력 숨기기
          />

          {imgPreview && (
            <button onClick={uploadImage} disabled={uploading}>
              {uploading ? "업로드 중..." : "이미지 업로드"}
            </button>
          )}
        </div>

        {/* 에러 메시지 표시 */}
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
}
