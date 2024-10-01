import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import "./App.css";
import QR from "./page/qr";
import Main from "./page/main";

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <Routes>
            {/* 기본 페이지 경로 */}
            <Route path="/" element={<Main />} />

            {/* QR 코드 페이지 경로 */}
            <Route path="/qr" element={<QR />} />
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
