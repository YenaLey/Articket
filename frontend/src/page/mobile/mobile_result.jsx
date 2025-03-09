/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import JSZip from "jszip";
import "../../style/mobile_result.css";
import HashLoader from "react-spinners/HashLoader";
import { useSocket } from "../../context/SocketContext";
import html2canvas from "html2canvas";
import { IoTicketOutline } from "react-icons/io5";

export default function MobileResult() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const { socket } = useSocket();
  const [generatedImageUrls, setGeneratedImageUrls] = useState([]);
  const [loading, setLoading] = useState(true);

  const imgSample = [
    { src: "/img/르누아르.png", artist: "르누아르", color: "#036B82" },
    { src: "/img/고흐.png", artist: "고흐", color: "#E37900" },
    { src: "/img/리히텐슈타인.png", artist: "리히텐슈타인", color: "#1A5934" },
    { src: "/img/피카소.png", artist: "피카소", color: "#CA0000" },
  ];

  const getFormattedDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0"); // 월 (01~12)
    const day = String(today.getDate()).padStart(2, "0"); // 일 (01~31)

    return `${year}.${month}.${day}`;
  };

  useEffect(() => {
    if (!socket || !socket.connected) return;

    const handleUpdateStatus = (data) => {
      if (data.error_status) {
        navigate("/#upload", { replace: true });
        return;
      }

      if (data.success) {
        setUserName(data.user_name || "");

        if (Array.isArray(data.generated_image)) {
          setGeneratedImageUrls(data.generated_image);
        } else {
          setGeneratedImageUrls(
            data.generated_image ? [data.generated_image] : []
          );
        }

        setLoading(false);
      }
    };

    socket.on("get_generate_images", handleUpdateStatus);

    return () => {
      socket.off("get_generate_images", handleUpdateStatus);
    };
  }, [socket, navigate]);

  const newImageUrl = (url = "") => {
    if (url.startsWith("wss://")) return url.replace("wss://", "https://");
    if (url.startsWith("ws://")) return url.replace("ws://", "https://");
    return url;
  };

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
        resultContainer.style.transform = "scale(0.65)";
        resultContainer.style.borderRadius = "0px";
        ticketBottomContainer.style.borderRadius = "0px";

        // ✅ 모든 이미지가 로딩될 때까지 기다림
        const images = resultContainer.querySelectorAll("img");
        await Promise.all(
          [...images].map((img) => {
            return new Promise((resolve, reject) => {
              if (img.complete) resolve();
              img.onload = resolve;
              img.onerror = reject;
            });
          })
        );

        // 📌 html2canvas 실행 (이미지가 로드된 후)
        const canvas = await html2canvas(resultContainer, {
          useCORS: true, // CORS 문제 방지
          scale: 4, // 고해상도
        });

        // 📌 캡처 후 원래 스타일 복구
        resultContainer.style.transform = originalTransform;
        resultContainer.style.borderRadius = originalBorderRadius;
        ticketBottomContainer.style.borderRadius = originalTicketBottomStyle;

        const resultImage = canvas.toDataURL("image/png");
        zip.file("quipu_ticket.png", resultImage.split(",")[1], {
          base64: true,
        });
      }

      // ✅ 추가할 이미지 (public/img/huchu.jpeg)
      const huchuImagePath = `${process.env.PUBLIC_URL}/img/quipu_say.jpeg`;
      const response = await fetch(huchuImagePath);
      if (!response.ok) {
        throw new Error("추가 이미지 불러오기 실패");
      }
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      zip.file("quipu_say.jpeg", arrayBuffer); // ZIP 파일에 추가

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
    }
  };

  return (
    <div className="mresult">
      <div className="mresult-container">
        {loading ? (
          <div className="mloading-container">
            <HashLoader color="#D8D8D8" size={35} />
            <div className="mloading-loading">
              <p>
                화가 스타일로
                <br />
                이미지를 변환 중이에요
              </p>
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
              {generatedImageUrls.map((url, index) => (
                <div className="mresult-img" key={index}>
                  <img
                    src={newImageUrl(url)}
                    alt={`image_${index}`}
                    crossOrigin="anonymous"
                  />
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
        {!loading && (
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
