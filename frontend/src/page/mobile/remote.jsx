import { useNavigate } from "react-router-dom";
import "../../style/remote.css";
import axios from "axios";

export default function Remote() {
  const navigate = useNavigate();

  const generateImages = async () => {
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/generate-images`,
        {},
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
    } catch (error) {
      console.error("/generate-images API 호출 중 오류 발생:", error);
    }
  };

  const makeImageStart = async () => {
    navigate("/m-result", { replace: true });
    await generateImages();
  };

  return (
    <div className="remote">
      <div className="remote-container">
        <button onClick={() => makeImageStart()} className="remote-start">
          이미지 변환하기
        </button>
      </div>
    </div>
  );
}
