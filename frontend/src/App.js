import React from "react";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import "./App.css";
import Main from "./page/main";
import Upload from "./page/remote/upload";
import TotalResult from "./page/remote/total_result";
import Test from "./page/personality/test";
import Result from "./page/result";
import Remote from "./page/remote/remote";

function App() {
  return (
    <SocketProvider>
      <Router>
        <div className="App">
          <header className="App-header">
            <Routes>
              {/* 기본 페이지 경로 */}
              <Route path="/" element={<Main />} />

              {/* 이미지 업로드 페이지 경로 */}
              <Route path="/upload" element={<Upload />} />

              {/* 성격 검사 페이지 remote 경로 */}
              <Route path="/remote" element={<Remote />} />

                {/* 성격 검사 페이지 경로 */}
              <Route path="/test" element={<Test />} />

              {/* 유형 설명 페이지 경로 */}
              <Route path="/total-result" element={<TotalResult />} />

              {/* 결과 페이지 경로 */}
              <Route path="/result" element={<Result />} />

            </Routes>
          </header>
        </div>
      </Router>
    </SocketProvider>
  );
}

export default App;
