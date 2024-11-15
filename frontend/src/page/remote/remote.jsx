/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import "../../style/remote.css";

export default function Remote() {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [chosenOption, setChosenOption] = useState("");
  const [result, setResult] = useState(null); // 성격 결과 상태
  const [artist, setArtist] = useState(null); // 화가 이름 상태

  useEffect(() => {
    const storedOptions = sessionStorage.getItem("selectedOptions");
    if (storedOptions) {
      setSelectedOptions(JSON.parse(storedOptions));
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("selectedOptions", JSON.stringify(selectedOptions));
  }, [selectedOptions]);

  const handleOptionClick = async (option) => {
    setChosenOption(option);

    const optionsArray = Array(8).fill(null);
    selectedOptions.forEach((opt, index) => {
      optionsArray[index] = opt;
    });
    optionsArray[selectedOptions.length] = option;

    try {
      const response = await fetch(`http://${process.env.REACT_APP_HOST}:5000/emit-options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ options: optionsArray }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("emit-options 응답:", data.message, data.options);
      } else {
        console.error("/emit-options API 호출에 실패했습니다.");
      }
    } catch (error) {
      console.error("/emit-options API 호출 중 오류 발생:", error);
    }
  };

  const handleSelectClick = async () => {
    if (selectedOptions.length < 8) {
      const updatedOptions = [...selectedOptions, `${chosenOption}`];
      setSelectedOptions(updatedOptions);
      setChosenOption("");

      try {
        // select-option API 호출 (반환값은 필요 없음)
        await fetch(`http://${process.env.REACT_APP_HOST}:5000/select-option`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        // 8개의 옵션이 모두 선택되면 성격 테스트 결과 API 호출
        if (updatedOptions.length === 8) {
          fetchPersonalityResult(updatedOptions);
        }
      } catch (error) {
        console.error("select-option API 호출 중 오류 발생:", error);
      }
    }
  };

  const fetchPersonalityResult = async (updatedOptions) => {
    try {
      const resultResponse = await fetch(
        `http://${process.env.REACT_APP_HOST}:5000/get-personality-result/${updatedOptions.join("")}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (resultResponse.ok) {
        const resultData = await resultResponse.json();
        console.log("답변 왔어용~");
        setResult(resultData.mbti);
        setArtist(resultData.artist);
      } else {
        console.error("성격 결과를 가져오는 데 실패했습니다.");
      }
    } catch (error) {
      console.error("성격 테스트 결과 API 호출 중 오류가 발생했습니다:", error);
    }
  };

  const handleResetOptions = async () => {
    sessionStorage.removeItem("selectedOptions");
    setSelectedOptions([]);
    console.log("selectedOptions가 초기화되었습니다.");

    try {
      // select-option API 호출 (반환값은 필요 없음)
      await fetch(`http://${process.env.REACT_APP_HOST}:5000/select-option`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("select-option API 호출 중 오류 발생:", error);
    }
  };

  return (
    <div className="remote">
      <div className="remote-container">
        <div className="remote-button-container">
          <button 
            onClick={() => handleOptionClick("A")}
            className={`remote-button ${chosenOption === "A" ? "checked" : ""}`}
          >
            A
          </button>
          <button 
            onClick={handleSelectClick}
            className="remote-button"
            style={{fontSize:"30px"}}
          >
            선택
          </button>
          <button 
            onClick={() => handleOptionClick("B")}
            className={`remote-button ${chosenOption === "B" ? "checked" : ""}`}
          >
            B
          </button>
        </div>
        <button onClick={handleResetOptions}>옵션 초기화</button>
        <p>{selectedOptions.join(", ")}</p>
        {result && (
          <div className="result">
            <p>성격 결과: {result}</p>
            <p>추천된 화가: {artist}</p>
          </div>
        )}
      </div>
    </div>
  );
}
