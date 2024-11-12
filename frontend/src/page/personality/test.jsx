/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../style/test.css";
import { IoIosArrowDroprightCircle } from "react-icons/io";
import { IoIosArrowDropleftCircle } from "react-icons/io";
import { useSocket } from "../../context/SocketContext";

export default function Test() {
    const navigate = useNavigate();
    const [selectedOptions, setSelectedOptions] = useState(Array(6).fill(null));
    const [error, setError] = useState("");
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const { uploadStatus, setUploadStatus } = useSocket();

    const questions = [
        { question: "당신은 미술관에 방문했습니다. 누구와 함께 왔나요?👥", optionA: "친구나 가족이랑 함께 관람하러 왔어요.", optionB: "혼자서 조용히 작품을 감상하러 왔어요." },
        { question: "미술관에 도착했을 때, 가장 먼저 하고 싶은 것은 무엇인가요?🏛️", optionA: "안내 책자를 살펴보며 전시관의 흐름을 계획할래요.", optionB: "자유롭게 돌아다니며 눈길 가는 작품을 즉흥적으로 감상할래요." },
        { question: "어떤 종류의 작품이 당신의 눈길을 끌었나요?🖼️👀", optionA: "상상력을 자극하는 추상적인 작품이 좋아요.", optionB: "현실을 그대로 표현한 구체적인 작품이 좋아요." },
        { question: "저기 도슨트💁‍♀️가 작품을 차례차례 설명하고 있네요!", optionA: "도슨트의 자세한 설명을 들어볼래요. 작품을 깊이 있게 이해하고 싶어요.", optionB: "나만의 방식으로 작품을 감상하며, 스스로 느껴보고 싶어요." },
        { question: "미술관에서 생각지 못한 감동을 받았어요.🥺 당신의 반응은?", optionA: "왜 그런 감정을 느꼈는지 이유를 논리적으로 분석해봐요.", optionB: "그 감정을 마음속에 담아 두고 여운을 음미해요." },
        { question: "기념품샵에 왔어요! 볼거리가 많아 보여요.😊🎵", optionA: "가격과 품질을 비교하고 신중하게 결정해요.", optionB: "마음에 드는 것이 있으면 바로 구매해요." },
        { question: "전시를 보고 나오는 길이에요. 이 경험을 어떻게 간직하고 싶나요?📝", optionA: "SNS에 후기를 올려 다른 사람들과 공유할래요.", optionB: "조용히 혼자만의 추억으로 간직하고 싶어요." },
        { question: "친구가 전시가 어땠냐고 물어보네요. 당신은 어떻게 대답할까요?", optionA: "작품의 내용이나 작가의 배경 등 흥미로운 정보를 중심으로 설명해요.", optionB: "전시를 통해 느꼈던 감정과 분위기를 중심으로 설명해요." }
    ];

    useEffect(() => {
        if (uploadStatus) {
            if (currentQuestion !== 7) {
                setCurrentQuestion((prev) => prev + 1); // currentQuestion을 증가시킴
                setUploadStatus(false); // uploadStatus를 false로 초기화
            }
        }
    }, [uploadStatus, setUploadStatus]);


    const handleOptionChange = (index, value) => {
        const newSelectedOptions = [...selectedOptions];
        newSelectedOptions[index] = value;
        setSelectedOptions(newSelectedOptions);
        setError("");
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) setCurrentQuestion(currentQuestion + 1);
    };

    const progressWidth = `${((currentQuestion + 1) / questions.length) * 84}%`;

    return (
        <div className="test-container">
            <div className="test-bar">
                <div className="test-bar-lower" />
                <div
                    className="test-bar-upper"
                    style={{ width: progressWidth }}
                />
            </div>

            <div className="test-test">
                <div className="test-q"><span>Q</span></div>

                <div className="test-box">
                    <p>{currentQuestion + 1}/8</p>
                    <p>{uploadStatus ? "true" : "false"}</p>
                    <h1>{questions[currentQuestion].question}</h1>
                    <label className={`checkbox-label ${selectedOptions[currentQuestion] === "A" ? "checked" : ""}`}>
                        <input
                            type="radio"
                            name={`option${currentQuestion}`}
                            checked={selectedOptions[currentQuestion] === "A"}
                            onChange={() => handleOptionChange(currentQuestion, "A")}
                        />
                        {questions[currentQuestion].optionA}
                    </label>
                    <label className={`checkbox-label ${selectedOptions[currentQuestion] === "B" ? "checked" : ""}`}>
                        <input
                            type="radio"
                            name={`option${currentQuestion}`}
                            checked={selectedOptions[currentQuestion] === "B"}
                            onChange={() => handleOptionChange(currentQuestion, "B")}
                        />
                        {questions[currentQuestion].optionB}
                    </label>
                </div>
            </div>

            {error && <div className="test-error-message">{error}</div>}

            <div className="test-navigation">
                <button className="test-previous" onClick={handlePrevious} disabled={currentQuestion === 0}><IoIosArrowDropleftCircle /></button>
                {currentQuestion < questions.length - 1 ? (
                    <button className="test-next" onClick={handleNext} disabled={selectedOptions[currentQuestion] === null}><IoIosArrowDroprightCircle /></button>
                ) : (
                    <button className="test-nextpage" onClick={() => {navigate('/result')}} disabled={selectedOptions[currentQuestion] === null}>결과 확인하기</button>
                )}
            </div>

        </div>
    );
}
