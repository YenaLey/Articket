/* eslint-disable no-undef */
import axios from 'axios';
import { useState, useEffect } from 'react';

export const useMatchingImages = () => {
    const [matchingImages, setMatchingImages] = useState({}); // 데이터 저장
    const [error, setError] = useState(null); // 에러 저장
    const [loading, setLoading] = useState(true); // 로딩 상태

    useEffect(() => {
        // API 호출
        const fetchMatchingImages = async () => {
            try {
                const response = await axios.get(`http://${process.env.REACT_APP_HOST}:5000/get-matching-images`); // API 호출
                setMatchingImages(response.data.matching_artists); // 데이터 저장
                setLoading(false);
            } catch (error) {
                console.log("에러남");
                setError(error.response ? error.response.data.error : 'Unknown Error');
                setLoading(false);
            }
        };
        fetchMatchingImages();
    }, []);
    
    return { matchingImages, error, loading };
};