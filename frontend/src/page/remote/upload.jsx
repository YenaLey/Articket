import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import "../../style/upload.css";
import { ImFilePicture } from "react-icons/im";
import axios from "axios";

export default function Upload() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [imgPreview, setImgPreview] = useState(null);
  const [fileName, setFileName] = useState("사진 선택하기");
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [userName, setUserName] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

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

  // 성별 선택 핸들러
  const handleGenderChange = (event) => {
    setSelectedGender(event.target.value);
  };

  // 이미지 업로드 함수
  const uploadImage = async () => {
    if (!image || !userName || !selectedGender) {
      alert("사용자 이름과 성별이 입력되지 않았습니다.");
      return;
    }

    const formData = new FormData();
    formData.append("image", image);

    setUploading(true);
    setUploadSuccess(false);

    try {
      const response = await axios.post(
        `http://${process.env.REACT_APP_HOST}:5000/upload-image/?name=${userName}&gender=${selectedGender}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("이미지 업로드 성공:", response.data);
      alert("이미지 업로드가 완료되었습니다.");
      setUploadSuccess(true);

      if (socket) {
        socket.emit("uploadStatus", true);
      }

      setTimeout(() => {
        navigate("/remote");
      }, 500);
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
          <p>이름과 성별을 입력해주세요!</p>
          <input
            type="text"
            placeholder="이름 입력"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          {/* 성별 선택 */}
          <div className="gender-selection">
            <label>
              <input
                type="radio"
                value="female"
                checked={selectedGender === "female"}
                onChange={handleGenderChange}
              />
              여자
            </label>
            <label>
              <input
                type="radio"
                value="male"
                checked={selectedGender === "male"}
                onChange={handleGenderChange}
              />
              남자
            </label>
          </div>
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
          {/* 이미지 미리보기 */}
          <div className="upload-image">
            {imgPreview ? (
              <img src={imgPreview} alt="미리보기" />
            ) : (
              <ImFilePicture />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
