import React from "react";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import Main from "./page/main";
import Upload from "./page/upload";
import TotalResult from "./page/personality/total_result";
import Test from "./page/personality/test";

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <Routes>
            {/* 기본 페이지 경로 */}
            <Route path="/" element={<Main />} />

            {/* QR 코드 페이지 경로 */}
            <Route path="/upload" element={<Upload />} />

            {/* 성격 검사 페이지 경로 */}
            <Route path="/test" element={<Test />} />

            {/* 유형 설명 페이지 경로 */}
            <Route path="/total-result" element={<TotalResult />} />

          </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;
