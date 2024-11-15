/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import "../../style/remote.css";
import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";

export default function Remote() {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [chosenOption, setChosenOption] = useState("");
  const [start, setStart] = useState(false);

  useEffect(() => {
    const storedStart = sessionStorage.getItem("start");
    if (storedStart === "true") {
      setStart(true);
    }
  
    const storedOptions = sessionStorage.getItem("selectedOptions");
    if (storedOptions) {
      setSelectedOptions(JSON.parse(storedOptions));
    }
  }, []);
  
  useEffect(() => {
    sessionStorage.setItem("start", start.toString());
  }, [start]);
  
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
        await fetch(`http://${process.env.REACT_APP_HOST}:5000/select-option`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (updatedOptions.length === 8) {
          fetchPersonalityResult(updatedOptions);
        }

        console.log("보낸 배열:", updatedOptions);
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
        console.log("답변 왔어용~", resultData);
      } else {
        console.error("성격 결과를 가져오는 데 실패했습니다.");
      }
    } catch (error) {
      console.error("성격 테스트 결과 API 호출 중 오류가 발생했습니다:", error);
    }
  };


  const handleLeftClick = async () => {
    const updatedOptions = [...selectedOptions];
    updatedOptions.pop();  // 마지막 값 삭제
    setSelectedOptions(updatedOptions);  // 상태 업데이트

    const optionsArray = Array(8).fill(null);
    updatedOptions.forEach((opt, index) => {
      optionsArray[index] = opt;
    });

    // emit-options API 호출
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

    // select-option API 호출
    try {
      await fetch(`http://${process.env.REACT_APP_HOST}:5000/select-option`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("/select-option API 호출 중 오류 발생:", error);
    }
  };

  const handleRightClick = async () => {
    await handleOptionClick("C");
    await handleSelectClick();
  }

  const testStart = async () => {
    handleOptionClick("C");
    setStart(true);
  }

  // const handleResetOptions = async () => {
  //   sessionStorage.removeItem("selectedOptions");
  //   setSelectedOptions([]);
  //   console.log("selectedOptions가 초기화되었습니다.");

  //   try {
  //     await fetch(`http://${process.env.REACT_APP_HOST}:5000/select-option`, {
  //       method: "GET",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //     });
  //   } catch (error) {
  //     console.error("select-option API 호출 중 오류 발생:", error);
  //   }
  // };

  return (
    <div className="remote">
      <div className="remote-container">
        {!start ? (
          <button onClick={() => testStart()} className="remote-start">예술가 유형 검사하기</button>
        ) : (
          <React.Fragment>
            <div className="remote-progress">
              {Array(8).fill(null).map((_, index) => {
                const element = selectedOptions[index] || "";
                return (
                  <div
                    key={index}
                    className={`remote-progress-box ${element === "A" || element === "B" ? "checked" : ""}`}
                  >
                    {index+1}
                  </div>
                );
              })}
            </div>
            <div className="remote-left">
              <button
                onClick={handleLeftClick}
                className="remote-button"
                disabled={selectedOptions.length === 0}
              >
                <IoIosArrowBack />
              </button>
            </div>

            <div className="remote-middle">
              <p>{selectedOptions.length + 1} / 8</p>
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
                  style={{ fontSize: "1.7rem" }}
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
            </div>

            <div className="remote-right">
              <button
                onClick={handleRightClick}
                className="remote-arrow"
                disabled={selectedOptions.length === 7}
              >
                <IoIosArrowForward />
              </button>
            </div>

            {/* 화살표 구현 다하면 이 밑은 지우기 */}
            {/* <button onClick={handleResetOptions} style={{ position: "fixed", top: "30px" }}>옵션 초기화</button> */}
          </React.Fragment>
        )}
      </div>
    </div>
  );
}
