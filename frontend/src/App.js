import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import "./App.css";
import QR from "./page/qr";
import Main from "./page/main";
import Result from "./page/result";
import Upload from './page/upload'; 
import Save from "./page/save";

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

            {/* 결과 페이지 경로 */}
            <Route path="/result" element={<Result />} />

            {/* 사진 저장 페이지 경로 */}
            <Route path="/save" element={<Save />} />
          </Routes>

          {/* 링크로 페이지 이동 */}
          {/* <nav>
            <Link to="/">Home</Link> | <Link to="/qr">QR Code</Link>
          </nav> */}
        </header>
      </div>
    </Router>
  );
}

export default App;
