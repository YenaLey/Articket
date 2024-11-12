/* eslint-disable no-undef */
import React, { useState } from "react";
import { useSocket } from "../../context/SocketContext"; // socketContext 사용
import "../../style/upload.css";
import { ImFilePicture } from "react-icons/im";
import axios from 'axios';

export default function Upload() {
  const { socket } = useSocket(); // useSocket을 통해 socket 객체 가져오기
  const [imgPreview, setImgPreview] = useState(null);
  const [fileName, setFileName] = useState("사진 선택하기");
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [userName, setUserName] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false); // 업로드 성공 상태

  // 파일 선택 핸들러
  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 업로드할 수 있습니다.");
        return;
      }
      setFileName(file.name);
      setImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImgPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 이미지 업로드 함수
  const uploadImage = async () => {
    if (!image || !userName) {
      alert("사용자 이름이 입력되지 않았습니다.");
      return;
    }

    const formData = new FormData();
    formData.append("image", image);

    setUploading(true);
    setUploadSuccess(false); // 업로드 성공 상태 초기화

    try {
      const response = await axios.post(
        `http://${process.env.REACT_APP_HOST}:5000/upload-image/${userName}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("이미지 업로드 성공:", response.data);
      alert("이미지 업로드가 완료되었습니다.");
      setUploadSuccess(true); // 업로드 성공 상태 업데이트

      // 업로드 성공 시 소켓을 통해 상태 업데이트
      if (socket) {
        socket.emit("uploadStatus", true); // 업로드 성공 상태를 소켓을 통해 전달
      }
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload">
      <div className="upload-container">
        
        <h1>ARTICKET</h1>

        {/* 사용자 이름 입력 */}
        <div className="upload-name">
          <p>티켓에 출력될 이름을 입력해주세요!</p>
          <input
            type="text"
            placeholder="이름 입력"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>

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
            style={{ display: "none" }}
          />

          {imgPreview && (
            <button onClick={uploadImage} disabled={uploading || uploadSuccess}>
              {uploading
                ? "업로드 중..."
                : uploadSuccess
                  ? "업로드 완료"
                  : "이미지 업로드"}
            </button>
          )}

        </div>

      </div>
    </div>
  );
}
