import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

// JavaScript 코드 추가
function updateVH() {
  // 현재 뷰포트 높이에서 1% 높이 값을 계산
  let vh = window.innerHeight * 0.01;
  // `--vh` 변수를 업데이트하여 주소창을 제외한 높이 사용
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

// 페이지 로드와 창 크기 변경 시 `updateVH` 함수를 호출
window.addEventListener("resize", updateVH);
window.addEventListener("load", updateVH);

// 기본적으로 실행
updateVH();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
