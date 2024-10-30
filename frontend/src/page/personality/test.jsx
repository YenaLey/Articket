import React, { useState } from "react";
import "../../style/test.css";

export default function Test() {
    const [selectedOptions, setSelectedOptions] = useState(Array(4).fill(null));
    const [result, setResult] = useState("");
    const [artist, setArtist] = useState("");
    const [error, setError] = useState("");
    
    // eslint-disable-next-line no-undef
    const BASE_URL = process.env.REACT_APP_HOST;

    const questions = [
        {
            question: "1. 주말에 주로 무엇을 하며 시간을 보내나요?",
            optionA: "a. 친구들과 만나 즐겁게 어울리고 시간을 보낸다.",
            optionB: "b. 프로젝트나 아이디어를 구상하며 시간을 보낸다."
        },
        {
            question: "2. 어쩌구 저쩌구?",
            optionA: "a. 답변1.",
            optionB: "b. 답변2."
        },
        {
            question: "3. 블라블라?",
            optionA: "a. 답변3.",
            optionB: "b. 답변4."
        },
        {
            question: "4. 새로운 것을 시도할 때 당신의 태도는?",
            optionA: "a. 도전과 변화를 두려워하지 않고 리드하는 편이다.",
            optionB: "b. 특별하고 독창적인 방식으로 접근해 나만의 스타일을 만든다."
        },
    ];

    const handleOptionChange = (index, value) => {
        const newSelectedOptions = [...selectedOptions];
        newSelectedOptions[index] = value; // 선택된 값을 업데이트
        setSelectedOptions(newSelectedOptions);
        setError(""); // 선택 변경 시 에러 메시지 초기화
    };

    const handleResultClick = () => {
        if (selectedOptions.some(option => option === null)) {
            setError("모든 질문에 대해 선택지를 체크해야 합니다."); // 에러 메시지 설정
            setResult(""); // 결과 초기화
            return;
        }
        const resultString = selectedOptions.join("");
        setResult(resultString);
        setError(""); // 에러 초기화
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
        await handleResultClick(); // 결과 확인 처리
        const resultOptions = selectedOptions.filter(option => option !== null); // null이 아닌 값 필터링
        if (resultOptions.length === selectedOptions.length) {
            try {
                const artistData = await getPersonalityResult(resultOptions); // 결과를 가져옴
                setArtist(artistData.artist); // 아티스트 이름 업데이트
            } catch (error) {
                setError("아티스트 정보를 가져오는 데 오류가 발생했습니다.");
            }
        }
    };

    return (
        <div className="test">
            <div className="test-container">
                <div className="test-title">
                    성격 테스트
                </div>

                <div className="test-test">
                    {questions.map((item, index) => (
                        <div className="test-box" key={index}>
                            <p>{item.question}</p>
                            <label className="checkbox-label">
                                <input
                                    type="radio"
                                    name={`option${index}`}
                                    checked={selectedOptions[index] === "a"}
                                    onChange={() => handleOptionChange(index, "a")}
                                />
                                {item.optionA}
                            </label>
                            <label className="checkbox-label">
                                <input
                                    type="radio"
                                    name={`option${index}`}
                                    checked={selectedOptions[index] === "b"}
                                    onChange={() => handleOptionChange(index, "b")}
                                />
                                {item.optionB}
                            </label>
                        </div>
                    ))}
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="test-submit">
                    <button onClick={handleSubmit}>결과 확인</button>
                </div>

                {selectedOptions.every(option => option !== null) && result && (
                    <div className="result">결과: {result}</div>
                )}

                {artist && <div className="artist">아티스트: {artist}</div>}
            </div>
        </div>
    );
}
