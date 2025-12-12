import { useEffect, useRef, useCallback } from 'react'
import './FrameSelectScreen.css'

function FrameSelectScreen({ frames, onFrameSelect, selectedPhotos = [] }) {
    const canvasRefs = useRef({})

    const drawFramePreview = useCallback((frame) => {
        const canvas = canvasRefs.current[frame.id]
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        const width = canvas.width
        const height = canvas.height

        // 배경
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)

        // 프레임 내부 영역 계산 (슬롯이 배치될 영역)
        const frameBorderWidth = frame.layout.frameWidth || 15
        const bottomHeight = height * 0.08
        const frameInnerX = frameBorderWidth
        const frameInnerY = frameBorderWidth
        const frameInnerWidth = width - (frameBorderWidth * 2)
        const frameInnerHeight = height - frameBorderWidth - bottomHeight

        // 슬롯 배경색 제거 (사진이 슬롯을 완전히 채우도록)

        // 십자가 선 그리기 (슬롯들 사이의 간격)
        if (frame.layout.frameColor) {
            ctx.strokeStyle = frame.layout.frameColor
            ctx.lineWidth = 10
            
            // 가로선 (중앙)
            const centerY = frameInnerY + (frameInnerHeight / 2)
            ctx.beginPath()
            ctx.moveTo(frameInnerX, centerY)
            ctx.lineTo(frameInnerX + frameInnerWidth, centerY)
            ctx.stroke()
            
            // 세로선 (중앙)
            const centerX = frameInnerX + (frameInnerWidth / 2)
            ctx.beginPath()
            ctx.moveTo(centerX, frameInnerY)
            ctx.lineTo(centerX, frameInnerY + frameInnerHeight)
            ctx.stroke()
        }

        // 프레임 테두리
        if (frame.layout.frameColor) {
            ctx.strokeStyle = frame.layout.frameColor
            ctx.lineWidth = frame.layout.frameWidth || 15
            ctx.strokeRect(
                frameBorderWidth / 2,
                frameBorderWidth / 2,
                width - frameBorderWidth,
                height - frameBorderWidth
            )
        }

        // 하단 영역 배경
        const bottomY = height * 0.92
        ctx.fillStyle = frame.layout.frameColor || '#333'
        ctx.fillRect(0, bottomY, width, bottomHeight)

        // 하단 텍스트
        if (frame.layout.bottomText) {
            // 하단 텍스트
            ctx.fillStyle = frame.layout.textColor || '#ffffff'
            ctx.font = 'bold 12px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText(frame.layout.bottomText, width / 2, height - 8)
        }
    }, [])

    const drawPhotoInSlot = useCallback((frame, slotIndex, photoSrc) => {
        const canvas = canvasRefs.current[frame.id]
        if (!canvas || !photoSrc) return

        const ctx = canvas.getContext('2d')
        const width = canvas.width
        const height = canvas.height

            const slot = frame.layout.slots[slotIndex]
            if (!slot) return

            const frameBorderWidth = frame.layout.frameWidth || 15
            const bottomHeightRatio = frame.layout.bottomHeight || 0.08
            const bottomHeight = height * bottomHeightRatio
        const frameInnerX = frameBorderWidth
        const frameInnerY = frameBorderWidth
        const frameInnerWidth = width - (frameBorderWidth * 2)
        const frameInnerHeight = height - frameBorderWidth - bottomHeight

        const x = Math.floor(frameInnerX + (slot.x * frameInnerWidth))
        const y = Math.floor(frameInnerY + (slot.y * frameInnerHeight))
        const slotWidth = Math.floor(slot.width * frameInnerWidth)
        const slotHeight = Math.floor(slot.height * frameInnerHeight)

        if (slotWidth === 0 || slotHeight === 0) return

        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        img.onload = () => {
            if (!canvas) return

            // 슬롯 배경색 제거 (사진이 슬롯을 완전히 채우도록)

            ctx.save()
            ctx.beginPath()
            ctx.rect(x, y, slotWidth, slotHeight)
            ctx.clip()

            const imgAspect = img.width / img.height
            const slotAspect = slotWidth / slotHeight

            let drawWidth, drawHeight, drawX, drawY

            if (imgAspect > slotAspect) {
                // 이미지가 더 넓음 - 높이에 맞춤
                drawHeight = slotHeight
                drawWidth = slotHeight * imgAspect
                drawX = x + (slotWidth - drawWidth) / 2
                drawY = y
            } else {
                // 이미지가 더 높음 - 너비에 맞춤
                drawWidth = slotWidth
                drawHeight = slotWidth / imgAspect
                drawX = x
                drawY = y + (slotHeight - drawHeight) / 2
            }

            // 이미지 그리기
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
            ctx.restore()

            // 사진을 그린 후 십자가 선 다시 그리기 (사진 위에 표시)
            if (frame.layout.frameColor) {
                ctx.strokeStyle = frame.layout.frameColor
                ctx.lineWidth = 10
                
                // 가로선 (중앙)
                const centerY = frameInnerY + (frameInnerHeight / 2)
                ctx.beginPath()
                ctx.moveTo(frameInnerX, centerY)
                ctx.lineTo(frameInnerX + frameInnerWidth, centerY)
                ctx.stroke()
                
                // 세로선 (중앙)
                const centerX = frameInnerX + (frameInnerWidth / 2)
                ctx.beginPath()
                ctx.moveTo(centerX, frameInnerY)
                ctx.lineTo(centerX, frameInnerY + frameInnerHeight)
                ctx.stroke()
            }
        }
        
        img.onerror = () => {
            console.error('이미지 로드 실패:', photoSrc)
        }
        
        img.src = photoSrc
    }, [])

    useEffect(() => {
        // 각 프레임의 미리보기 그리기
        frames.forEach((frame) => {
            drawFramePreview(frame)
            
            // 사진이 있으면 각 슬롯에 사진 그리기
            if (selectedPhotos && selectedPhotos.length > 0) {
                selectedPhotos.forEach((photo, index) => {
                    if (photo && frame.layout.slots[index]) {
                        // 약간의 딜레이를 두고 그리기 (이미지 로드 시간 확보)
                        setTimeout(() => {
                            drawPhotoInSlot(frame, index, photo)
                        }, index * 50)
                    }
                })
            }
        })
    }, [frames, selectedPhotos, drawFramePreview, drawPhotoInSlot])

    // 모든 사진이 로드된 후 십자가 선 다시 그리기
    useEffect(() => {
        if (!selectedPhotos || selectedPhotos.length === 0) return
        
        // 사진이 모두 선택되었는지 확인
        const hasAllPhotos = selectedPhotos.every(photo => photo !== null)
        if (!hasAllPhotos) return
        
        // 사진 로딩을 기다린 후 십자가 선 다시 그리기
        const timer = setTimeout(() => {
            frames.forEach((frame) => {
                const canvas = canvasRefs.current[frame.id]
                if (!canvas) return
                
                const ctx = canvas.getContext('2d')
                if (!ctx) return
                
                const width = canvas.width
                const height = canvas.height
                
                if (width === 0 || height === 0) return
                
                const frameBorderWidth = frame.layout.frameWidth || 15
                const bottomHeight = height * 0.08
                const frameInnerX = frameBorderWidth
                const frameInnerY = frameBorderWidth
                const frameInnerWidth = width - (frameBorderWidth * 2)
                const frameInnerHeight = height - frameBorderWidth - bottomHeight
                
                // 십자가 선 다시 그리기
                if (frame.layout.frameColor) {
                    ctx.strokeStyle = frame.layout.frameColor
                    ctx.lineWidth = 10
                    
                    // 가로선 (중앙)
                    const centerY = frameInnerY + (frameInnerHeight / 2)
                    ctx.beginPath()
                    ctx.moveTo(frameInnerX, centerY)
                    ctx.lineTo(frameInnerX + frameInnerWidth, centerY)
                    ctx.stroke()
                    
                    // 세로선 (중앙)
                    const centerX = frameInnerX + (frameInnerWidth / 2)
                    ctx.beginPath()
                    ctx.moveTo(centerX, frameInnerY)
                    ctx.lineTo(centerX, frameInnerY + frameInnerHeight)
                    ctx.stroke()
                }
            })
        }, 1000)
        
        return () => {
            clearTimeout(timer)
        }
    }, [selectedPhotos, frames])

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

