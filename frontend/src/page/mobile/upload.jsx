/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import "../../style/upload.css";
import { ImFilePicture } from "react-icons/im";
import { IoMdFemale } from "react-icons/io";
import { IoMdMale } from "react-icons/io";
import axios from "axios";

export default function Upload() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const location = useLocation();
  const [imgPreview, setImgPreview] = useState(null);
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [userName, setUserName] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const queryParams = new URLSearchParams(location.search);
  const room = queryParams.get("room");

  useEffect(() => {
    if (!socket) return;

    if (!room) {
      navigate("/error");
      return;
    }

    socket.emit("join", { room });

    const initializeSession = async () => {
      try {
        await axios.get(`${process.env.REACT_APP_BACKEND_URL}/set-cookie`, {
          withCredentials: true,
          credentials: "include",
        });
      } catch (error) {
        console.error("세션 초기화 실패:", error);
      }
    };

    initializeSession();
  }, [socket, room, navigate]);

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

  const handleGenderChange = (event) => {
    setSelectedGender(event.target.value);
  };

  // 이미지 업로드 함수
  const uploadImage = async () => {
    if (!image || !userName || !selectedGender) {
      alert("내용를 모두 입력해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("image", image);

    setUploading(true);
    setUploadSuccess(false);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/upload-image?name=${userName}&gender=${selectedGender}&room=${room}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
          credentials: "include",
        }
      );
      console.log("이미지 업로드 성공:", response.data);
      alert("이미지 업로드가 완료되었습니다.");
      setUploadSuccess(true);

      setTimeout(() => {
        navigate("/remote", { replace: true });
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
        />

        {/* label 요소로 파일 선택 트리거 */}
        <label className={`upload-image`} htmlFor="file-input">
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
          disabled={uploading || uploadSuccess || !imgPreview}
        >
          {uploading
            ? "업로드 중..."
            : uploadSuccess
            ? "업로드 완료"
            : "사진 선택 완료"}
        </button>
      </div>
    </div>
  );
}
