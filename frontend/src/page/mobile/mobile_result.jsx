/* eslint-disable no-undef */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import JSZip from "jszip";
import "../../style/mobile_result.css";
import HashLoader from "react-spinners/HashLoader";
import { useSocket } from "../../context/SocketContext";
import html2canvas from "html2canvas";
import { IoTicketOutline } from "react-icons/io5";

export default function MobileResult() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [images, setImages] = useState([]);
  const [matchingImages, setMatchingImages] = useState([]);
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(false);
  const timer = useRef(null);
  const { uploadStatus, errorStatus, imageStatus } = useSocket();
  const imgSample = [
    { src: "/img/르누아르.png", artist: "르누아르", color: "#036B82" },
    { src: "/img/고흐.png", artist: "고흐", color: "#E37900" },
    { src: "/img/리히텐슈타인.png", artist: "리히텐슈타인", color: "#1A5934" },
    { src: "/img/피카소.png", artist: "피카소", color: "#CA0000" },
  ];
  const order = ["match", "good", "bad", "neutral"];
  const matchSample = {
    match: "💁‍♀️ 나의 화가 유형",
    good: "☺️ 나와 잘 맞는 화가",
    bad: "😵 나와 상극인 화가",
    neutral: "😛 나와 중립인 화가",
  };
  const artists = ["피카소", "르누아르", "리히텐슈타인", "고흐"];

  // localStorage로부터 체험완료 여부 가져옴
  useEffect(() => {
    const storedDone = localStorage.getItem("done");
    if (storedDone === "true") {
      setDone(true);
    }
  }, []);

  const getFormattedDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0"); // 월 (01~12)
    const day = String(today.getDate()).padStart(2, "0"); // 일 (01~31)

    return `${year}.${month}.${day}`;
  };

  const fetchMatchingImages = async () => {
    try {
      console.log("이미지 변환이 완료됐대요!");
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/get-matching-images`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        // 응답이 실패한 경우 (예: 404, 500)
        const errorText = await response.text(); // 오류 메시지 확인
        setError("사진 불러오기가 지연되고 있습니다. 다시 시도해주세요");
        throw new Error(
          `API 응답 실패: ${response.status}, 내용: ${errorText}`
        );
      }

      // 응답이 JSON 형식이 아닌 경우 예외 처리
      const contentType = response.headers.get("Content-Type");
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text(); // 응답 본문을 텍스트로 출력
        setError("사진 불러오기가 지연되고 있습니다. 다시 시도해주세요");
        throw new Error(
          `응답이 JSON 형식이 아닙니다. 응답 내용: ${responseText}`
        );
      }

      // JSON 데이터 처리
      const data = await response.json();
      console.log("데이터 가져옴", data);

      const matchingArtists = data.matching_artists;
      if (!matchingArtists) {
        setError("사진 불러오기가 지연되고 있습니다. 다시 시도해주세요");
        throw new Error("API 응답에 matching_artists가 없습니다.");
      }

      // 상태 업데이트
      setMatchingImages(matchingArtists);
      setUserName(data.user_name);
      setImages(Object.values(matchingArtists));
      setGenerated(true);
    } catch (error) {
      console.error("데이터 가져오는 중 오류 발생:", error);
      setError("사진 불러오기가 지연되고 있습니다. 다시 시도해주세요");
    }
  };

  useEffect(() => {
    if (imageStatus) {
      const fetchImages = async () => {
        try {
          const response = await fetch(
            `${process.env.REACT_APP_BACKEND_URL}/get-generated-images`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}), // ✅ 빈 객체라도 body에 추가하여 요청 형식 맞춤
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch generated images");
          }

          const generatedResult = await response.json();
          console.log("이미지 데이터 가져오기 성공:", generatedResult);

          const {
            user_name,
            artist,
            matching_artists,
            original_image,
            generated_image,
          } = generatedResult;

          if (!generated_image || !Array.isArray(generated_image)) {
            throw new Error("Invalid image data format");
          }

          setMatchingImages(generated_image);
          setUserName(user_name);
          setGenerated(true);
        } catch (error) {
          console.error("🚨 이미지 데이터 가져오기 오류:", error);
        }
      };

      fetchImages(); // ✅ 즉시 실행 함수 호출
    }
  }, [imageStatus]);

  // const getImageUrl = async () => {};

  // useEffect(() => {
  //   if (uploadStatus || errorStatus) {
  //     timer.current = setTimeout(() => {
  //       if (uploadStatus) {
  //         setNow(true);
  //         getImageUrl();
  //       } else if (errorStatus) {
  //         sessionStorage.removeItem("selectedOptions");
  //         sessionStorage.removeItem("start");
  //         sessionStorage.removeItem("currentIndex");
  //         alert("사진 변환에 실패하였습니다.");
  //         navigate("/upload", { replace: true });
  //       }
  //     }, 1000);
  //   }

  //   return () => {
  //     if (timer.current) {
  //       clearTimeout(timer.current);
  //       timer.current = null;
  //     }
  //   };
  // }, [uploadStatus, errorStatus, navigate]);

  const downloadAllImages = async () => {
    console.log("ZIP 파일 생성 시작");
    const zip = new JSZip();

    try {
      const resultContainer = document.querySelector(".mresult-result");
      const ticketBottomContainer = document.querySelector(
        ".mresult-ticket-bottom"
      );

      if (resultContainer && ticketBottomContainer) {
        // 📌 기존 스타일 저장
        const originalTransform = resultContainer.style.transform;
        const originalBorderRadius = resultContainer.style.borderRadius;
        const originalTicketBottomStyle =
          ticketBottomContainer.style.borderRadius;

        // 📌 캡처 전에 스타일 초기화
        resultContainer.style.transform = "scale(0.85)";
        resultContainer.style.borderRadius = "0px";
        ticketBottomContainer.style.borderRadius = "0px";

        const canvas = await html2canvas(resultContainer, {
          useCORS: true, // CORS 문제 방지
          scale: 2, // 고해상도
        });

        // 📌 캡처 후 원래 스타일 복구
        resultContainer.style.transform = originalTransform;
        resultContainer.style.borderRadius = originalBorderRadius;
        ticketBottomContainer.style.borderRadius = originalTicketBottomStyle;

        const resultImage = canvas.toDataURL("image/png");
        zip.file("ticket.png", resultImage.split(",")[1], { base64: true });
      }

      if (Array.isArray(images)) {
        images.forEach((image, index) => {
          const binary = atob(image.image_base64);
          const arrayBuffer = new Uint8Array(binary.length).map((_, i) =>
            binary.charCodeAt(i)
          );
          zip.file(`${image.description || `image_${index}`}.png`, arrayBuffer);
        });
      }

      // ✅ 추가할 이미지 (public/img/huchu.jpeg)
      const huchuImagePath = `${process.env.PUBLIC_URL}/img/huchu.jpeg`;

      // 📌 Fetch를 사용해 이미지 가져오기
      const response = await fetch(huchuImagePath);
      if (!response.ok) {
        throw new Error("추가 이미지 불러오기 실패");
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      zip.file("huchu.jpeg", arrayBuffer); // ZIP 파일에 추가

      // 📌 ZIP 파일 생성 및 다운로드
      const zipBlob = await zip.generateAsync({ type: "blob" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = "Articket.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("ZIP 파일 다운로드 완료");
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("이미지 다운로드 중 오류 발생:", error);
    } finally {
      setDone(true);
      localStorage.setItem("done", "true");
    }
  };

  return (
    <div className="mresult">
      <div className="mresult-container">
        {!generated ? (
          <div className="mloading-container">
            <HashLoader color="#D8D8D8" size={35} />
            <div className="mloading-loading">
              {!now ? (
                <p>
                  화가 스타일로
                  <br />
                  이미지를 변환 중이에요
                </p>
              ) : (
                <p>이미지를 가져오고 있어요</p>
              )}
              <p>{error}</p>
            </div>
            {imgSample.map((element, index) => (
              <div className="mloading-img" key={index}>
                <div
                  className="mloading-overlay"
                  style={{ backgroundColor: element.color }}
                />
                <p>{element.artist}</p>
                <img
                  src={process.env.PUBLIC_URL + element.src}
                  alt={element.artist}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="mresult-result">
            <p>당신의 사진이 예술이 되는 곳</p>
            <h1>ARTICKET</h1>
            <div className="mresult-img-container">
              {matchingImages.map((url, index) => (
                <div className="mresult-img" key={index}>
                  <img src={url} alt={`image_${index}`} />
                </div>
              ))}
            </div>

            {/* <button onClick={() => navigate("/total-result")}>
                                성격 유형 결과 확인하기
                            </button> */}
            <div className="mresult-ticket-bottom">
              <div style={{ justifyContent: "flex-end", gap: "20px" }}>
                <span>
                  {userName} | {getFormattedDate()}
                </span>
              </div>
              <div style={{ justifyContent: "space-between" }}>
                <p>
                  Where your<br></br>photos become art
                </p>
                <p>QUIPU</p>
              </div>
            </div>
          </div>
        )}
        {generated && (
          <button
            className="download-button"
            onClick={() => downloadAllImages()}
          >
            티켓 발급하기 <IoTicketOutline />
          </button>
        )}
      </div>
    </div>
  );
}
