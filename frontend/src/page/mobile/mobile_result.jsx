/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../style/mobile_result.css";
import HashLoader from "react-spinners/HashLoader";
import { useSocket } from "../../context/SocketContext";

export default function MobileResult() {
    const navigate = useNavigate();
    const [done, setDone] = useState(false);
    const { uploadStatus, errorStatus } = useSocket();
    const imgSample = [
        { src: "/img/르누아르.png", artist: "르누아르", color: "#036B82" },
        { src: "/img/고흐.png", artist: "고흐", color: "#E37900" },
        { src: "/img/리히텐슈타인.png", artist: "리히텐슈타인", color: "#1A5934" },
        { src: "/img/피카소.png", artist: "피카소", color: "#CA0000" },
    ];

    // localStorage로부터 체험완료 여부 가져옴
    useEffect(() => {
        const storedDone = localStorage.getItem("done");
        if (storedDone === "true") {
            setDone(true);
        }
    }, []);

    // 화면 로드 2초 후 실행
    useEffect(() => {
        const timer = setTimeout(() => {
            // 변환된 이미지가 모니터에 로드되었으면 로딩 끝. localStorage에 저장
            if (uploadStatus) {
                console.log("이미지 변환이 완료됐대요!");
                setDone(true);
                localStorage.setItem("done", false);
            }

            // 이미지 변환 중 오류 발생 시 storage 초기화 후 upload 페이지로 navigate
            else if (errorStatus) {
                const handleErrorAndNavigate = async () => {
                    sessionStorage.removeItem("selectedOptions");
                    sessionStorage.removeItem("start");
                    sessionStorage.removeItem("currentIndex");
                    localStorage.setItem("hasParticipated", "false");
                    alert("사진 변환에 실패하였습니다.")

                    await new Promise((resolve) => setTimeout(resolve, 0));

                    navigate("/upload");
                }
                handleErrorAndNavigate();
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [uploadStatus, errorStatus, navigate]);


    return (
        <div className="mresult">
            <div className="mresult-container">
                {!done ? (
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
                            <p>성격 유형을 분석하여 해당 화가 스타일로<br />이미지를 변환 중이에요</p>
                            <HashLoader color="#D8D8D8" size={30} />
                        </div>
                    </div>)
                    : (
                        <div className="mresult-result">
                            <h1>ATOO</h1>
                            <h4>ARTICKET</h4>
                            {/* <button onClick={() => navigate('/total-result')}>성격 유형 결과 확인하기</button> */}
                            <button onClick={() => localStorage.setItem("done", false)}>성격 유형 결과 확인하기</button>
                        </div>
                    )
                }
            </div>
        </div>
    )
}