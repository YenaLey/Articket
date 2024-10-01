import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../style/result.css'

export default function Result() {
    const [generatedImages, setGeneratedImages] = useState([]);

    // 이미지 생성 함수
    const generateImages = async (style) => {
        try {
        const response = await axios.post(`http://localhost:5000/generate-images/${style}`);
        console.log('이미지 생성 성공:', response.data.generated_images);
        setGeneratedImages(response.data.generated_images);
        } catch (error) {
        console.error('이미지 생성 실패:', error);
        }
    }

    // 생성된 이미지 가져오기
    const getGeneratedImages = async () => {
        try {
        const response = await axios.get('http://localhost:5000/get-generated-images');
        console.log('생성된 이미지 가져오기 성공:', response.data.images);
        setGeneratedImages(response.data.images);
        } catch (error) {
        console.error('이미지 가져오기 실패:', error);
        }
    }


    return (
        <div className="result-container">
            결과페이지입니다.
        </div>
    )
}