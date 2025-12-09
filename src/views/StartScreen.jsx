import { useNavigate } from 'react-router-dom'
import { useRef, useEffect, useCallback } from 'react'
import './StartScreen.css'

function StartScreen() {
    const navigate = useNavigate()
    const buttonRef = useRef(null)

    const handleStart = useCallback(() => {
        navigate('/app')
    }, [navigate])

    useEffect(() => {
        const button = buttonRef.current
        if (!button) return

        // passive: false로 이벤트 리스너 등록
        const handleTouchStart = (e) => {
            e.preventDefault()
            e.stopPropagation()
        }

        const handleTouchMove = (e) => {
            e.preventDefault()
            e.stopPropagation()
        }

        const handleTouchEnd = (e) => {
            e.preventDefault()
            e.stopPropagation()
            handleStart()
        }

        button.addEventListener('touchstart', handleTouchStart, { passive: false })
        button.addEventListener('touchmove', handleTouchMove, { passive: false })
        button.addEventListener('touchend', handleTouchEnd, { passive: false })

        return () => {
            button.removeEventListener('touchstart', handleTouchStart)
            button.removeEventListener('touchmove', handleTouchMove)
            button.removeEventListener('touchend', handleTouchEnd)
        }
    }, [handleStart])

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
                    ref={buttonRef}
                    className="btn btn-start" 
                    onClick={handleStart}
                >
                    START
                </button>
            </div>
        </div>
    )
}

export default StartScreen

