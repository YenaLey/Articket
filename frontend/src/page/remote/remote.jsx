/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import "../../style/remote.css";
import { useSocket } from "../../context/SocketContext";

export default function Remote() {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [result, setResult] = useState(null); // 성격 결과 상태
  const [artist, setArtist] = useState(null); // 화가 이름 상태
  const { selectAB, setSelectAB, currentQuestion } = useSocket();

  // 컴포넌트가 처음 로드될 때 localStorage에서 selectedOptions 불러오기
  useEffect(() => {
    const storedOptions = localStorage.getItem("selectedOptions");
    if (storedOptions) {
      setSelectedOptions(JSON.parse(storedOptions));
    }
  }, []);

  // selectedOptions가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem("selectedOptions", JSON.stringify(selectedOptions));
  }, [selectedOptions]);

  const handleABClick = (option) => {
    setSelectAB((preList) => {
      const newSelectAB = [...preList];
      newSelectAB[currentQuestion] = option;
      console.log("Updated selectAB:", newSelectAB);
      return newSelectAB;
    });
  };
  // 옵션 선택 시 select-option API 호출과 함께 상태 업데이트
  const handleSelectClick = async (option) => {
    if (selectedOptions.length < 8) {
      // 선택된 옵션 추가
      const updatedOptions = [...selectedOptions, option];
      setSelectedOptions(updatedOptions);

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
          const resultResponse = await fetch(
            `http://${
              process.env.REACT_APP_HOST
            }:5000/get-personality-result/${updatedOptions.join("")}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            }
          );

          if (resultResponse.ok) {
            const resultData = await resultResponse.json();
            console.log("답변 왔어용~");
            setResult(resultData.mbti); // 성격 결과 상태 저장
            setArtist(resultData.artist); // 화가 이름 상태 저장
          } else {
            console.error("성격 결과를 가져오는 데 실패했습니다.");
          }
        }
      } catch (error) {
        console.error("API 호출 중 오류가 발생했습니다:", error);
      }
    } else {
      console.log("모든 옵션이 이미 선택되었습니다.");
    }
  };

  // selectedOptions 초기화 버튼 클릭 시 동작
  const handleResetOptions = () => {
    localStorage.removeItem("selectedOptions"); // localStorage에서 selectedOptions 제거
    setSelectedOptions([]); // 상태 초기화
    console.log("selectedOptions가 초기화되었습니다.");
  };

  return (
    <div className="remote">
      <div className="remote-container">
        <p>현재 질문 번호: {currentQuestion}</p>
        <button onClick={() => handleABClick("A")}>옵션 A</button>
        <button onClick={() => handleABClick("B")}>옵션 B</button>
        <button onClick={() => handleSelectClick(selectAB)}>선택</button>
        <button onClick={handleResetOptions}>옵션 초기화</button>{" "}
        {/* 초기화 버튼 추가 */}
        <p>{selectedOptions}</p>
        {/* 성격 결과와 화가 이름을 화면에 출력 */}
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
