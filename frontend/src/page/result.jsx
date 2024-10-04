import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../style/result.css';
import HashLoader from 'react-spinners/HashLoader';
import QR from './qr'; // localIp를 가져오지 않음, 필요시 가져오세요.

export default function Result() {
    const navigate = useNavigate();
    const [generatedImages, setGeneratedImages] = useState([]);
    const [loading, setLoading] = useState(false); // 로딩 상태 추가
    const imgSample = [
        {
            name: '요시모토 나라',
            src: '/img/nara.png'
        },
        {
            name: '피카소',
            src: '/img/picasso.png'
        },
        {
            name: '르누아르',
            src: '/img/renoir.png'
        },
        {
            name: '렘브란트',
            src: '/img/rem.png'
        }
    ];

    // 생성된 이미지 가져오기
    const getGeneratedImages = async () => {
        setLoading(true); // 로딩 시작
        try {
            const response = await axios.get(`http://localhost:5000/get-generated-images`); // localIp를 사용
            console.log('생성된 이미지 가져오기 성공:', response.data.images);

            // image_base64를 사용하여 이미지 URL 생성
            const imagesWithBase64 = response.data.images.map(image => ({
                ...image,
                imageSrc: `data:image/png;base64,${image.image_base64}` // Base64 문자열을 URL 형식으로 변환
            }));
            
            setGeneratedImages(imagesWithBase64);
        } catch (error) {
            console.error('이미지 가져오기 실패:', error);
        } finally {
            setLoading(false); // 로딩 종료
        }
    };

    // 컴포넌트가 마운트될 때 생성된 이미지 가져오기
    useEffect(() => {
        getGeneratedImages();
    }, []);

    return (
        <div className="result-container">
            <h1 onClick={() => navigate('/')}>ARTPICS</h1>

            {/* 로딩 중일 때 */}
            {loading ? (
                <div className="loading-container">
                    <div className="loading-img-container">
                        {imgSample.map((element, index) => (
                            <div className="loading-img" key={index}>
                                <img src={element.src} alt={element.name} />
                                <p>{element.name}</p>
                            </div>
                        ))}
                    </div>

                    <div className="loading-loading">
                        <p>아트픽스가 해당 작가 화풍으로 바꾸는 중이에요</p>
                        <HashLoader color="#D8D8D8" size={50} />
                    </div>
                </div>
            ) : (
                <div className="result-result">
                    <div className="result-img-container">
                        {/* 이미지가 있을 때 */}
                        {generatedImages.length > 0 ? (
                            generatedImages.map((image, index) => (
                                <div className="result-img" key={index}>
                                    <img src={image.imageSrc} alt={`generated-${index}`} /> {/* imageSrc 사용 */}
                                    <p>{imgSample[index]?.name}</p> {/* Safe navigation operator 사용 */}
                                </div>
                            ))
                        ) : (
                            <p>생성된 이미지가 없습니다.</p>
                        )}
                    </div>
                    {generatedImages.length > 0 &&
                        <React.Fragment>
                            <div className="result-qr">
                                <p>QR코드를 인식해서 사진을 저장해보세요!</p>
                                <QR pathname='save' />
                                <h4 onClick={() => navigate('/')}>메인 화면으로 가기</h4>
                            </div>
                        </React.Fragment>
                    }
                </div>
            )}
        </div>
    );
}
