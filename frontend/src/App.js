import React from "react";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import "./App.css";
import Main from "./page/main";
import Upload from "./page/mobile/upload";
import Result from "./page/result";
import ErrorPage from "./page/error";
import Remote from "./page/mobile/remote";
import MobileResult from "./page/mobile/mobile_result";

function generateRoomId() {
  return Math.random().toString(36).substring(2, 10);
}

function App() {
  const room = generateRoomId();

  return (
    <Router>
      <SocketProvider>
        <div className="App">
          <header className="App-header">
            <Routes>
              {/* 기본 페이지 경로 */}
              <Route path="/" element={<Main room={room} />} />

              {/* 이미지 업로드 페이지 경로 */}
              <Route path="/upload" element={<Upload />} />

              {/* 성격 검사 페이지 remote 경로 */}
              <Route path="/remote" element={<Remote />} />

              {/* 결과 페이지 remote 경로 */}
              <Route path="/m-result" element={<MobileResult />} />

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
