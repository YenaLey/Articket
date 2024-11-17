/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../style/remote.css";
import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";

export default function Remote() {
  const navigate = useNavigate();
  const [selectedOptions, setSelectedOptions] = useState(Array(8).fill(null));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [chosenOption, setChosenOption] = useState("");
  const [start, setStart] = useState(false);
  const [done, setDone] = useState(false);

  // session storage 설정
  useEffect(() => {
    const storedDone = localStorage.getItem("done");
    if (storedDone === "true") {
      setDone(true);
    }
  
    const storedStart = sessionStorage.getItem("start");
    if (storedStart === "true") {
      setStart(true);
    }
  
    const storedOptions = sessionStorage.getItem("selectedOptions");
    if (storedOptions) {
      setSelectedOptions(JSON.parse(storedOptions));
    }

    const storedIndex = sessionStorage.getItem("currentIndex");
    if (storedIndex === undefined || storedIndex === null) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex(Number(storedIndex));
    }
    
  }, []);

  useEffect(() => {
    sessionStorage.setItem("start", start.toString());
  }, [start]);

  useEffect(() => {
    sessionStorage.setItem("selectedOptions", JSON.stringify(selectedOptions));
  }, [selectedOptions]);

  useEffect(()=> {
    sessionStorage.setItem("currentIndex", JSON.stringify(currentIndex));
  }, [currentIndex]);

  // 옵션 A or B 클릭 시 /emit-options 호출
  const handleOptionClick = async (option) => {
    setChosenOption(option);

    const optionsArray = [...selectedOptions];
    optionsArray[currentIndex] = option;

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

  // "선택" 클릭 시 /select-option 호출
  const handleSelectClick = async () => {
    if (selectedOptions.includes("") || selectedOptions.includes(null)) {
      const updatedOptions = [...selectedOptions];
      updatedOptions[currentIndex] = chosenOption;
      setSelectedOptions(updatedOptions);
      setChosenOption("");
  
      try {
        await fetch(`http://${process.env.REACT_APP_HOST}:5000/select-option`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
  
        if (currentIndex !== null && currentIndex !== 7) {
          let newIndex = currentIndex;
          if (currentIndex !== 7) {
            newIndex = newIndex + 1;
            setCurrentIndex(currentIndex + 1);
          }
          const response = await fetch(`http://${process.env.REACT_APP_HOST}:5000/emit_index`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ index_status: newIndex }),
          });
  
          if (response.ok) {
            const responseData = await response.json();
            console.log("인덱스 보냈습니다:", responseData.index_status);
          } else {
            console.error("인덱스 전송 실패:", response.statusText);
          }
        }
  
        if (!updatedOptions.includes("") && !updatedOptions.includes(null)) {
          setSelectedOptions(Array(8).fill(null));
          await fetchPersonalityResult(updatedOptions);
          navigate('/m-result');
        }
      } catch (error) {
        console.error("select-option API 호출 중 오류 발생:", error);
      }
    }
  };
  
  // 모두 선택 시 성격검사api 호출
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
  

  // 왼쪽 방향키 클릭
  const handleLeftClick = async () => {
    if (currentIndex !== null && currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(currentIndex - 1);
      try {
        const response = await fetch(`http://${process.env.REACT_APP_HOST}:5000/emit_index`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ index_status: newIndex }),
        });
        if (response.ok) {
          const responseData = await response.json();
          console.log("인덱스 감소, 새 인덱스:", responseData.index_status);
        } else {
          console.error("인덱스 전송 실패:", response.statusText);
        }
      } catch (error) {
        console.error("API 호출 중 오류 발생:", error);
      }
    }
  };

  // 오른쪽 방향키 클릭
  const handleRightClick = async () => {
    if (currentIndex !== null && currentIndex < 7) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(currentIndex + 1);
      try {
        const response = await fetch(`http://${process.env.REACT_APP_HOST}:5000/emit_index`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ index_status: newIndex }),
        });
        if (response.ok) {
          const responseData = await response.json();
          console.log("인덱스 증가, 새 인덱스:", responseData.index_status);
        } else {
          console.error("인덱스 전송 실패:", response.statusText);
        }
      } catch (error) {
        console.error("API 호출 중 오류 발생:", error);
      }
    }
  };

  // 테스트 시작
  const testStart = async () => {
    handleOptionClick("C");
    setStart(true);
  }

  if (done) {
    return (
      <div className="remote-completed">
        <p>체험이 완료되었습니다.</p>
        <button onClick={() => navigate('/total-result')}>성격 유형 검사 결과 확인하기</button>
      </div>
    )
  }
  else {
    return (
      <div className="remote">
        <div className="remote-container">
          {!start ? (
            <button onClick={() => testStart()} className="remote-start">예술가 유형 검사하기</button>
          ) : (
            <React.Fragment>
              <p className="remote-progress-dc">답변완료된 질문박스가 칠해집니다{currentIndex}{selectedOptions}</p>
              <div className="remote-progress"> 
                {Array(8).fill(null).map((_, index) => {
                  const element = selectedOptions[index] || "";
                  return (
                    <div
                      key={index}
                      className={`remote-progress-box ${element === "A" || element === "B" ? "checked" : ""}`}
                    >
                      {index + 1}
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
                <p>현재 질문:<br />{currentIndex + 1} / 8</p>
                <div className="remote-button-container">
                  <button
                    onClick={() => handleOptionClick("A")}
                    className={`remote-button ${selectedOptions[currentIndex] === "A" || chosenOption === "A" ? "checked" : ""}`}
                  >
                    A
                  </button>
                  <button
                    onClick={handleSelectClick}
                    className="remote-button"
                    disabled={chosenOption === "" || chosenOption === "C"}
                    style={{ fontSize: "1.7rem" }}
                  >
                    선택
                  </button>
                  <button
                    onClick={() => handleOptionClick("B")}
                    className={`remote-button ${selectedOptions[currentIndex] === "B" || chosenOption === "B" ? "checked" : ""}`}
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
}
