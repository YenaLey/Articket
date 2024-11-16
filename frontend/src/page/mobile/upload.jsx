/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import "../../style/upload.css";
import { ImFilePicture } from "react-icons/im";
import { IoMdFemale } from "react-icons/io";
import { IoMdMale } from "react-icons/io";
import axios from "axios";

export default function Upload() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [imgPreview, setImgPreview] = useState(null);
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [userName, setUserName] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [hasParticipated, setHasParticipated] = useState(false);

  // 참여 여부 확인
  useEffect(() => {
    const participated = localStorage.getItem("hasParticipated");
    if (participated === "true") {
      setHasParticipated(true);
    }
  }, []);

  // 파일 선택 핸들러
  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 업로드할 수 있습니다.");
        return;
      }
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
      alert("이름, 성별, 이미지를 모두 입력해주세요.");
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
      localStorage.setItem("hasParticipated", "true");
      setHasParticipated(true);
      setUploadSuccess(true);

      if (socket && response.data.image_path) {
        socket.emit("operation_status", {
          success: true,
          image_path: response.data.image_path,
        });
        console.log(response.data.image_path);
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
    <div className="upload-container">
      <h1>ARTICKET</h1>

      {/* 사용자 이름 입력 */}
      <div className="upload-name">
        <p>티켓에 출력될 이름을 입력해주세요</p>
        <input
          type="text"
          placeholder="이름 입력"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          disabled={hasParticipated}
        />
        <p>사진 주인공의 성별을 선택해주세요</p>
        <div className="upload-gender-selection">
          <label
            className={`gender-option ${
              selectedGender === "female" ? "selected" : ""
            }`}
          >
            <input
              type="radio"
              value="female"
              checked={selectedGender === "female"}
              onChange={handleGenderChange}
              style={{ display: "none" }}
              disabled={hasParticipated}
            />
            <IoMdFemale />
            &nbsp;여자
          </label>
          <label
            className={`gender-option ${
              selectedGender === "male" ? "selected" : ""
            }`}
          >
            <input
              type="radio"
              value="male"
              checked={selectedGender === "male"}
              onChange={handleGenderChange}
              style={{ display: "none" }}
              disabled={hasParticipated}
            />
            <IoMdMale />
            &nbsp;남자
          </label>
        </div>
      </div>

      {/* 파일 선택 input 및 업로드 버튼 */}
      <div className="upload-select">
        <input
          id="file-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
          disabled={hasParticipated}
        />

        {/* label 요소로 파일 선택 트리거 */}
        <label
          className={`upload-image ${hasParticipated ? "disabled" : ""}`}
          htmlFor="file-input"
        >
          {imgPreview ? (
            <img src={imgPreview} alt="미리보기" />
          ) : (
            <>
              <ImFilePicture />
              <p>갤러리에서 선택하기</p>
            </>
          )}
        </label>

        <button
          onClick={uploadImage}
          disabled={
            uploading || uploadSuccess || !imgPreview || hasParticipated
          }
        >
          {hasParticipated
            ? "참여 완료"
            : uploading
            ? "업로드 중..."
            : uploadSuccess
            ? "업로드 완료"
            : "사진 선택 완료"}
        </button>
      </div>
    </div>
  );
}
