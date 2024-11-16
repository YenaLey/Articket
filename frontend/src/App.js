import React, { useState } from "react";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import "./App.css";
import Main from "./page/main";
import Upload from "./page/mobile/upload";
import TotalResult from "./page/mobile/total_result/total_result";
import Test from "./page/test";
import Result from "./page/result";
import ErrorPage from "./page/error";
import Remote from "./page/mobile/remote";
import MobileResult from "./page/mobile/mobile_result";

function App() {
  return (
    <Router>
      <SocketProvider>
        <div className="App">
          <header className="App-header">
            <Routes>
              {/* 기본 페이지 경로 */}
              <Route path="/" element={<Main />} />

              {/* 이미지 업로드 페이지 경로 */}
              <Route path="/upload" element={<Upload />} />

              {/* 성격 검사 페이지 remote 경로 */}
              <Route path="/remote" element={<Remote />} />

              {/* 결과 페이지 remote 경로 */}
              <Route path="/m-result" element={<MobileResult />} />

              {/* 성격 검사 페이지 경로 */}
              <Route path="/test" element={<Test />} />

              {/* 유형 설명 페이지 경로 */}
              <Route path="/total-result" element={<TotalResult />} />

              {/* 결과 페이지 경로 */}
              <Route path="/result" element={<Result />} />

              {/* 에러 페이지 경로 */}
              <Route path="/*" element={<ErrorPage />} />
              <Route path="/error" element={<ErrorPage />} />
            </Routes>
          </header>
        </div>
      </SocketProvider>
    </Router>
  );
}

export default App;
