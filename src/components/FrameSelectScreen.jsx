import { useEffect, useRef } from 'react'
import './FrameSelectScreen.css'

function FrameSelectScreen({ frames, onFrameSelect }) {
    const canvasRefs = useRef({})

    useEffect(() => {
        // 각 프레임의 미리보기 그리기
        frames.forEach((frame) => {
            const canvas = canvasRefs.current[frame.id]
            if (!canvas) return

            const ctx = canvas.getContext('2d')
            const width = canvas.width
            const height = canvas.height

            // 배경
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, width, height)

            // 슬롯 배경색
            if (frame.layout.slotColor) {
                frame.layout.slots.forEach((slot) => {
                    const x = Math.floor(slot.x * width)
                    const y = Math.floor(slot.y * height)
                    const w = Math.floor(slot.width * width)
                    const h = Math.floor(slot.height * height)
                    ctx.fillStyle = frame.layout.slotColor
                    ctx.fillRect(x, y, w, h)
                })
            }

            // 프레임 테두리
            if (frame.layout.frameColor) {
                ctx.strokeStyle = frame.layout.frameColor
                ctx.lineWidth = frame.layout.frameWidth || 15
                ctx.strokeRect(0, 0, width, height)
            }

            // 하단 텍스트
            if (frame.layout.bottomText) {
                ctx.fillStyle = '#333'
                ctx.font = 'bold 20px sans-serif'
                ctx.textAlign = 'center'
                ctx.fillText(frame.layout.bottomText, width / 2, height - 20)
            }
        })
    }, [frames])

    return (
        <div className="screen active">
            <div className="frame-select-container">
                <h2>프레임을 선택하세요</h2>
                <div className="frame-list">
                    {frames.map((frame) => (
                        <div
                            key={frame.id}
                            className="frame-item"
                            onClick={() => onFrameSelect(frame)}
                        >
                            <div className="frame-preview">
                                <div className="frame-preview-image">
                                    <canvas
                                        ref={(el) => (canvasRefs.current[frame.id] = el)}
                                        width={200}
                                        height={267}
                                    />
                                </div>
                                <p className="frame-name">{frame.name}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default FrameSelectScreen

