import { useNavigate } from 'react-router-dom'
import './StartScreen.css'

function StartScreen() {
    const navigate = useNavigate()

    const handleStart = () => {
        navigate('/app')
    }

    return (
        <div className="start-screen-full">
            <div 
                className="start-screen-background loaded"
                style={{ backgroundImage: `url(/hope.png)` }}
            />
            <div className="start-screen-container">
                <h1 className="start-title">크리스마스 평안네컷</h1>
                <p className="start-subtitle">나만의 크리스마스 인생네컷을 만들어보세요!</p>
                <button 
                    className="btn btn-start" 
                    onClick={handleStart}
                    onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onTouchMove={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleStart();
                    }}
                >
                    START
                </button>
            </div>
        </div>
    )
}

export default StartScreen

