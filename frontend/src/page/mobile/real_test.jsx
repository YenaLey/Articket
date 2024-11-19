import React, { useState, useEffect } from "react";
import JSZip from "jszip"; // ZIP 파일 생성 라이브러리
import { dummy } from "../base64_test";

export default function RealTest() {
    const [images, setImages] = useState([]);

    useEffect(() => {
        setImages(Object.values(dummy.matching_artists));
        console.log("데이터 가져옴", dummy);
    }, []);

    const shibal = () => {
        sessionStorage.removeItem("selectedOptions");
        sessionStorage.removeItem("start");
        sessionStorage.removeItem("currentIndex");
        localStorage.setItem("done", "false");
        localStorage.setItem("generated", "false");
    };

    const downloadAllImages = async () => {
        console.log("ZIP 파일 생성 시작");
        const zip = new JSZip();

        try {
            if (Array.isArray(images)) {
                // ZIP 파일에 각 이미지를 추가
                images.forEach((image, index) => {
                    const binary = atob(image.image_base64); // Base64 문자열 디코딩
                    const arrayBuffer = new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i));
                    zip.file(`${image.description || `image_${index}`}.png`, arrayBuffer);
                });

                // ZIP 파일 생성 및 다운로드
                const zipBlob = await zip.generateAsync({ type: "blob" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(zipBlob);
                link.download = "images.zip";
                link.click();
                console.log("ZIP 파일 다운로드 완료");
                URL.revokeObjectURL(link.href); // 메모리 해제
            }
        } catch (error) {
            console.error("이미지 다운로드 중 오류 발생:", error);
        }
    };

    return (
        <div className="realtest-container">
            <button onClick={() => downloadAllImages()}>이미지 다운로드</button>
            <button onClick={() => shibal()}>초기화하기</button>
        </div>
    );
}
