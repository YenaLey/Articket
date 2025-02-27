/* eslint-disable no-undef */
import React, { useState, useRef } from "react";
import "../../../style/total_result.css";
import { adata } from "./artist_data";
import { GoMoveToTop } from "react-icons/go";

export default function TotalResult() {
  const [index, setIndex] = useState(0);

  const color = [
    // 고흐
    { backgroundColor: "#261400", charColor: "#E37900", lineColor: "#522E05" },
    // 리히텐슈타인
    { backgroundColor: "#00210D", charColor: "#519801", lineColor: "#1A5934" },
    // 피카소
    { backgroundColor: "#330000", charColor: "#FF4848", lineColor: "#7B0000" },
    // 르누아르
    { backgroundColor: "#002D37", charColor: "#0196B7", lineColor: "#00647A" },
  ];

  const gradients = [
    "linear-gradient(to bottom, #e37900, #261400)",
    "linear-gradient(to bottom, #00682B, #00210D)",
    "linear-gradient(to bottom, #ca0000, #330000)",
    "linear-gradient(to bottom, #0196b7, #002D37)",
  ];

  const scrollToTopRef = useRef(null);

  const scrollToTop = () => {
    scrollToTopRef.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="total">
      <div
        className="total-container"
        style={{ backgroundColor: color[index].backgroundColor }}
      >
        <div ref={scrollToTopRef} className="total-top" />
        <button className="total-floating" onClick={scrollToTop}>
          <GoMoveToTop />
        </button>
        <div className="total-button-container">
          {adata.map((element, num) => (
            <button
              className={`total-button ${index === num ? "checked" : ""}`}
              onClick={() => setIndex(num)}
              key={num}
            >
              {element.name}
            </button>
          ))}
        </div>

        <div
          className="total-dc-container"
          style={{ background: `${gradients[index]}` }}
        >
          <img
            src={process.env.PUBLIC_URL + adata[index].img}
            alt="background"
          />
          <h1>{adata[index].summary}</h1>
          <p>{adata[index].description}</p>
        </div>

        <div className="total-work-container">
          <h1>작품 소개</h1>
          {adata[index].artwork.map((work, num) => (
            <div className="total-work" key={num}>
              <img src={process.env.PUBLIC_URL + work.img} alt={work.title} />
              <h4 style={{ color: `${color[index].charColor}` }}>
                {work.summary}
              </h4>
              <p style={{ fontSize: "1rem" }}>{work.title}</p>
              <p>{work.description}</p>
            </div>
          ))}
        </div>

        {/* <div className="total-ProsAndCons">
          <hr
            style={{
              backgroundColor: `${color[index].charColor}`,
              marginBottom: "30px",
            }}
          />
          <h1>당신의 긍정적인 영향과 주의할 점</h1>
          <p>{adata[index].pros_and_cons}</p>
          <hr
            style={{
              backgroundColor: `${color[index].charColor}`,
              marginTop: "30px",
            }}
          />
        </div> */}

        <div className="total-match-container">
          <div className="total-match good">
            <h1>이 화가의 찰떡조합은?</h1>
            <img
              src={process.env.PUBLIC_URL + adata[index].good_artist.img}
              alt="찰떡"
              style={{
                borderColor: `${
                  color[adata[index].good_artist.artist_num].charColor
                }`,
              }}
            />
            <p
              style={{
                color: `${
                  color[adata[index].good_artist.artist_num].charColor
                }`,
              }}
            >
              {adata[index].good_artist.summary}
            </p>
            <p style={{ fontSize: "1rem" }}>
              {adata[index].good_artist.description}
            </p>
          </div>
          <div className="total-match bad">
            <h1>이 화가의 상극조합은?</h1>
            <img
              src={process.env.PUBLIC_URL + adata[index].bad_artist.img}
              alt="상극"
              style={{
                borderColor: `${
                  color[adata[index].bad_artist.artist_num].charColor
                }`,
              }}
            />
            <p
              style={{
                color: `${color[adata[index].bad_artist.artist_num].charColor}`,
              }}
            >
              {adata[index].bad_artist.summary}
            </p>
            <p style={{ fontSize: "1rem" }}>
              {adata[index].bad_artist.description}
            </p>
            <hr
              style={{
                backgroundColor: `${color[index].charColor}`,
                marginTop: "30px",
              }}
            />
          </div>
        </div>

        <div className="total-footer">
          <p onClick={scrollToTop}>ATOO</p>
          <h1 onClick={scrollToTop}>ARTICKET</h1>
        </div>
      </div>
    </div>
  );
}
