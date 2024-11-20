/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import JSZip from "jszip";
import "../../style/mobile_result.css";
import HashLoader from "react-spinners/HashLoader";
import { useSocket } from "../../context/SocketContext";

export default function MobileResult() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [images, setImages] = useState([]);
  const [matchingImages, setMatchingImages] = useState({});
  const { uploadStatus, errorStatus } = useSocket();
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

  // localStorage로부터 체험완료 여부 가져옴
  useEffect(() => {
    const storedDone = localStorage.getItem("done");
    if (storedDone === "true") {
      setDone(true);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 이미지 변환 완료
        if (uploadStatus) {
          console.log("이미지 변환이 완료됐대요!");
          const response = await axios.get(
            `${process.env.REACT_APP_BACKEND_URL}/get-matching-images`
          );
          console.log("데이터 가져옴", response);

          // 데이터 검증 후 상태 업데이트
          const matchingArtists = response.data.matching_artists;
          if (!matchingArtists) {
            throw new Error("API 응답에 matching_artists가 없습니다.");
          }

          setMatchingImages(matchingArtists);
          setImages(Object.values(matchingArtists));
          setGenerated(true);
        }
        // 이미지 변환 실패
        else if (errorStatus) {
          sessionStorage.removeItem("selectedOptions");
          sessionStorage.removeItem("start");
          sessionStorage.removeItem("currentIndex");
          alert("사진 변환에 실패하였습니다.");
          navigate("/upload");
        }
      } catch (error) {
        console.error("데이터 가져오는 중 오류 발생:", error);
      }
    };

    fetchData();

    // 클린업 함수
    return () => {
      clearTimeout(); // setTimeout은 직접 사용하지 않으므로 타이머 관리 필요 없음
    };
  }, [uploadStatus, errorStatus, navigate]);

  const downloadAllImages = async () => {
    console.log("ZIP 파일 생성 시작");
    const zip = new JSZip();

    try {
      if (Array.isArray(images)) {
        // ZIP 파일에 각 이미지를 추가
        images.forEach((image, index) => {
          const binary = atob(image.image_base64); // Base64 문자열 디코딩
          const arrayBuffer = new Uint8Array(binary.length).map((_, i) =>
            binary.charCodeAt(i)
          );
          zip.file(`${image.description || `image_${index}`}.png`, arrayBuffer);
        });

        // ZIP 파일 생성 및 다운로드
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(zipBlob);
        link.download = "Articket.zip";
        link.click();
        console.log("ZIP 파일 다운로드 완료");
        URL.revokeObjectURL(link.href); // 메모리 해제
      }
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
        {/* 체험이 모두 끝났을 시 */}
        {done ? (
          <div className="mdone-done">
            <h1>ATOO</h1>
            <h4>ARTICKET</h4>
            <button onClick={() => navigate("/total-result")}>
              성격 유형 결과 확인하기
            </button>
          </div>
        ) : // 로딩 중일 시
        !generated ? (
          <div className="mloading-container">
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
            <div className="mloading-loading">
              <p>
                성격 유형을 분석하여 해당 화가 스타일로
                <br />
                이미지를 변환 중이에요
              </p>
              <HashLoader color="#D8D8D8" size={30} />
            </div>
          </div>
        ) : (
          // 결과가 나왔을 시
          <div className="mresult-result">
            <h1>RESULT</h1>
            {Object.entries(matchingImages)
              .sort(
                ([keyA], [keyB]) => order.indexOf(keyA) - order.indexOf(keyB)
              ) // 키 순서대로 정렬
              .map(([key, { description, image_base64 }]) => (
                <div className="mresult-img-container" key={key}>
                  <h1>{matchSample[key]}</h1>
                  <div className="mresult-img">
                    <img
                      src={`data:image/png;base64,${image_base64}`}
                      alt={description}
                    />
                  </div>
                  <p>{description}</p>
                </div>
              ))}
            <button onClick={() => downloadAllImages()}>
              이미지 모두 저장하기
            </button>

            {/* <button onClick={() => navigate("/total-result")}>
                                성격 유형 결과 확인하기
                            </button> */}
          </div>
        )}
      </div>
    </div>
  );
}
