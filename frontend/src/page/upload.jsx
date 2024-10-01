import React, { useState } from "react";
import axios from "axios";
import '../style/upload.css';

export default function Upload() {
    const [imgPreview, setImgPreview] = useState(null);
    const [fileName, setFileName] = useState('사진 선택'); // 초기 파일 선택 문구
    const [image, setImage] = useState(null);

    // 파일 선택 핸들러
    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (file) {
            setFileName(file.name);  // 파일명을 상태로 저장
            setImage(file);  // 파일 저장 (업로드용)

            // 이미지 미리보기 URL 생성
            const reader = new FileReader();
            reader.onloadend = () => {
                setImgPreview(reader.result);  // 이미지 미리보기 저장
            };
            reader.readAsDataURL(file);
        }
    };

    // 이미지 업로드 함수
    const uploadImage = async () => {
        const formData = new FormData();
        formData.append('image', image);

        try {
            const response = await axios.post('http://localhost:5000/upload-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            console.log('이미지 업로드 성공:', response.data);
        } catch (error) {
            console.error('이미지 업로드 실패:', error);
        }
    };

    return (
        <div className="upload">
            <div className="upload-container">
                <h1>ARTPICS</h1>
                
                {/* 이미지 미리보기 */}
                <div className="upload-image">
                    {imgPreview && <img src={imgPreview} alt="미리보기" />}
                </div>

                {/* 파일 선택 input 및 업로드 버튼 */}
                <div className="upload-select">
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: imgPreview ? "none" : "block" }} // 이미지 업로드 후에는 숨기기
                    />

                    {imgPreview && (
                        <>
                            <p>{fileName}</p>
                            <button onClick={uploadImage}>이미지 업로드</button>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
