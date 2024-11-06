import React, { useState } from "react";
import "../../style/test.css";
import { FaArrowCircleLeft } from "react-icons/fa";
import { FaArrowCircleRight } from "react-icons/fa";

export default function Test() {
    const [selectedOptions, setSelectedOptions] = useState(Array(6).fill(null));
    const [result, setResult] = useState("");
    const [artist, setArtist] = useState("");
    const [error, setError] = useState("");
    const [currentQuestion, setCurrentQuestion] = useState(0);

    // eslint-disable-next-line no-undef
    const BASE_URL = process.env.REACT_APP_HOST;

    const questions = [
        { question: "친구와 함께 시간을 보내는 것과 혼자만의 시간을 갖는 것 중 어떤 것을 더 선호하시나요?", optionA: "a. 친구들과 어울리는 걸 좋아해요.", optionB: "b. 혼자만의 시간이 더 편해요." },
        { question: "새로운 경험이나 변화를 추구하는 편인가요, 아니면 익숙한 환경이 더 좋으신가요?", optionA: "a. 새로운 걸 시도하고 변화하는 걸 좋아해요.", optionB: "b. 익숙한 환경과 안정감을 선호해요." },
        { question: "기분이나 생각을 표현할 때, 어떤 방식이 더 편한가요?", optionA: "a. 솔직하게 감정을 드러내고 표현해요.", optionB: "b. 감정을 잘 드러내지 않고 차분하게 표현하는 편이에요." },
        { question: "아침에 일어나 가장 먼저 하고 싶은 것은?", optionA: "a. 기분 좋게 음악을 들어요.", optionB: "b. 오늘의 계획을 세워요." },
        { question: "어떤 스타일의 영화를 좋아하나요?", optionA: "a. 다채롭고 화려한 뮤지컬이나 코미디를 좋아해요.", optionB: "b. 심오하고 철학적인 영화를 좋아해요." },
        { question: "주말을 보낼 때 가장 하고 싶은 일은?", optionA: "a. 야외에서 사람들과 소통하며 액티비티를 즐겨요.", optionB: "b. 실내에서 편안하게 쉬면서 재충전해요." },
        { question: "2주말을 보낼 때 가장 하고 싶은 일은?", optionA: "a. 야외에서 사람들과 소통하며 액티비티를 즐겨요.", optionB: "b. 실내에서 편안하게 쉬면서 재충전해요." },
        { question: "3주말을 보낼 때 가장 하고 싶은 일은?", optionA: "a. 야외에서 사람들과 소통하며 액티비티를 즐겨요.", optionB: "b. 실내에서 편안하게 쉬면서 재충전해요." },
    ];

    const handleOptionChange = (index, value) => {
        const newSelectedOptions = [...selectedOptions];
        newSelectedOptions[index] = value;
        setSelectedOptions(newSelectedOptions);
        setError("");
    };

    const getPersonalityResult = async (options) => {
        const response = await fetch(`http://${BASE_URL}:5000/get-personality-result/${options.join("")}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }

        return response.json();
    };

    const handleSubmit = async () => {
        if (selectedOptions.some(option => option === null)) {
            setError("모든 질문에 대해 선택지를 체크해야 합니다.");
            setResult("");
            return;
        }

        const resultOptions = selectedOptions.filter(option => option !== null);
        if (resultOptions.length === selectedOptions.length) {
            try {
                const artistData = await getPersonalityResult(resultOptions);
                setArtist(artistData.artist);
            } catch (error) {
                setError("아티스트 정보를 가져오는 데 오류가 발생했습니다.");
            }
        }
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
                <button className="test-previous" onClick={handlePrevious} disabled={currentQuestion === 0}><FaArrowCircleLeft /></button>
                {currentQuestion < questions.length - 1 ? (
                    <button className="test-next" onClick={handleNext} disabled={selectedOptions[currentQuestion] === null}><FaArrowCircleRight /></button>
                ) : (
                    <button className="test-nextpage" onClick={handleSubmit} disabled={selectedOptions[currentQuestion] === null}>결과 확인하기</button>
                )}
            </div>

            {result && <div className="test-result">결과: {result}</div>}
            {artist && <div className="test-artist">아티스트: {artist}</div>}
        </div>
    );
}
