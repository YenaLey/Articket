/* eslint-disable no-undef */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  const [error, setError] = useState("");
  const [now, setNow] = useState(false);
  const timer = useRef(null);
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
      setImages(Object.values(matchingArtists));
      setGenerated(true);
    } catch (error) {
      console.error("데이터 가져오는 중 오류 발생:", error);
      setError("사진 불러오기가 지연되고 있습니다. 다시 시도해주세요");
    }
  };

  useEffect(() => {
    if (uploadStatus || errorStatus) {
      // 타이머를 사용하여 1초 후 작업 실행
      timer.current = setTimeout(async () => {
        if (uploadStatus) {
          setNow(true);
          await fetchMatchingImages();
        } else if (errorStatus) {
          sessionStorage.removeItem("selectedOptions");
          sessionStorage.removeItem("start");
          sessionStorage.removeItem("currentIndex");
          alert("사진 변환에 실패하였습니다.");
          navigate("/upload");
        }
      }, 1000);
    }

    // 클린업 함수
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
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
                {!now ?
                  <p>
                    성격 유형을 분석하여 해당 화가 스타일로
                    <br />
                    이미지를 변환 중이에요
                  </p>
                  : <p>
                    이미지를 가져오고 있어요
                  </p>
                }
                <p>{error}</p>
                <HashLoader color="#D8D8D8" size={30} />
              </div>
            </div>
          ) : (
            // 결과가 나왔을 시
            <div className="mresult-result">
              <h1>RESULT</h1>
              <button onClick={() => downloadAllImages()}>
                이미지 모두 저장하기
              </button>
              <div className="mresult-img-container">
                {Object.entries(matchingImages)
                  .sort(
                    ([keyA], [keyB]) => order.indexOf(keyA) - order.indexOf(keyB)
                  ) // 키 순서대로 정렬
                  .map(([key, { description, image_base64 }]) => (
                    <div className="mresult-img" key={key}>
                      <h1>{matchSample[key]}</h1>
                      <div>
                        <img
                          src={`data:image/png;base64,${image_base64}`}
                          alt={description}
                        />
                      </div>
                      <p>{description}</p>
                    </div>
                  ))}
              </div>

              {/* <button onClick={() => navigate("/total-result")}>
                                성격 유형 결과 확인하기
                            </button> */}
            </div>
          )}
      </div>
    </div>
  );
}
