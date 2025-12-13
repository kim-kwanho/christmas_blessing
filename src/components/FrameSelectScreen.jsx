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

        // 프레임 테두리 먼저 그리기
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
        const bottomY = height - bottomHeight
        ctx.fillStyle = frame.layout.frameColor || '#333'
        // 프레임 테두리 안쪽부터 하단 영역 채우기
        ctx.fillRect(frameBorderWidth, bottomY, width - (frameBorderWidth * 2), bottomHeight)

        // 하단 텍스트 또는 이미지
        if (frame.layout.bottomImage) {
            // 하단 이미지 (로고)
            const logoImg = new Image()
            logoImg.crossOrigin = 'anonymous'
            logoImg.onload = () => {
                // 이미지 비율 유지하면서 하단 영역에 맞춤
                const imgAspect = logoImg.width / logoImg.height
                const bottomAspect = width / bottomHeight
                
                let drawWidth, drawHeight
                if (imgAspect > bottomAspect) {
                    // 이미지가 더 넓음 - 너비에 맞춤
                    drawWidth = width * 0.9 // 여백 5%씩
                    drawHeight = drawWidth / imgAspect
                } else {
                    // 이미지가 더 높음 - 높이에 맞춤
                    drawHeight = bottomHeight * 0.8 // 여백 10%씩
                    drawWidth = drawHeight * imgAspect
                }
                
                const drawX = (width - drawWidth) / 2
                const drawY = bottomY + (bottomHeight - drawHeight) / 2
                
                ctx.drawImage(logoImg, drawX, drawY, drawWidth, drawHeight)
            }
            logoImg.src = frame.layout.bottomImage
        } else if (frame.layout.bottomText) {
            // 하단 텍스트
            ctx.fillStyle = frame.layout.textColor || '#ffffff'
            
            // 1번 프레임 로고 스타일
            if (frame.layout.logoStyle) {
                const lines = frame.layout.bottomText.split('\n')
                const centerX = width / 2
                // 텍스트를 아래로 내려서 다 보이게
                const centerY = bottomY + bottomHeight * 0.55
                
                // "Hope" 텍스트 (큰 크기)
                const hopeFontSize = 10
                const fontFamily = frame.layout.fontFamily || 'Inter, sans-serif'
                ctx.font = `bold ${hopeFontSize}px ${fontFamily}`
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                
                // "Hope" 텍스트 크기 측정
                const hopeMetrics = ctx.measureText(lines[0])
                const hopeWidth = hopeMetrics.width
                const hopeHeight = hopeFontSize
                
                // 타원형 테두리 그리기
                ctx.strokeStyle = ctx.fillStyle
                ctx.lineWidth = 1.5
                const ellipseWidth = hopeWidth * 1.3
                const ellipseHeight = hopeHeight * 1.8
                ctx.beginPath()
                ctx.ellipse(centerX, centerY, ellipseWidth / 2, ellipseHeight / 2, 0, 0, 2 * Math.PI)
                ctx.stroke()
                
                // 별 모양 장식 (왼쪽 상단, 오른쪽 하단)
                const starSize = 3
                const drawStar = (x, y, size) => {
                    ctx.beginPath()
                    for (let i = 0; i < 5; i++) {
                        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
                        const px = x + size * Math.cos(angle)
                        const py = y + size * Math.sin(angle)
                        if (i === 0) ctx.moveTo(px, py)
                        else ctx.lineTo(px, py)
                    }
                    ctx.closePath()
                    ctx.fill()
                }
                drawStar(centerX - ellipseWidth / 2 - starSize * 2, centerY - hopeHeight * 0.4, starSize)
                drawStar(centerX + ellipseWidth / 2 + starSize * 2, centerY + hopeHeight * 0.4, starSize)
                
                // "Hope" 텍스트 그리기
                ctx.fillText(lines[0], centerX, centerY)
                
                // "Builders" 텍스트 (작은 크기)
                if (lines[1]) {
                    const buildersFontSize = 6
                    ctx.font = `bold ${buildersFontSize}px ${fontFamily}`
                    ctx.fillText(lines[1], centerX, centerY + hopeHeight * 0.3)
                }
            } else {
                // 일반 텍스트 렌더링
                // 3번 프레임은 세리프 폰트 사용 (크기 조정)
                const fontSize = frame.layout.fontFamily ? 9 : 12
                const fontFamily = frame.layout.fontFamily || 'Inter, "Noto Sans KR", sans-serif'
                ctx.font = `bold ${fontSize}px ${fontFamily}`
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                
                // 여러 줄 텍스트 지원
                const lines = frame.layout.bottomText.split('\n')
                const lineHeight = fontSize * 1.3
                const totalHeight = lines.length * lineHeight
                const startY = bottomY + (bottomHeight - totalHeight) / 2 + lineHeight / 2
                
                lines.forEach((line, index) => {
                    ctx.fillText(line, width / 2, startY + index * lineHeight)
                })
            }
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

        // 슬롯 영역 계산 (네컷처럼 프레임 내부 영역을 완전히 채우도록)
        let x = frameInnerX + (slot.x * frameInnerWidth)
        let y = frameInnerY + (slot.y * frameInnerHeight)
        let slotWidth = slot.width * frameInnerWidth
        let slotHeight = slot.height * frameInnerHeight
        
        // 하단 슬롯(3, 4번째)의 경우 높이를 정확히 계산하여 frameInnerHeight까지 완전히 채우기
        if (slot.y + slot.height >= 1.0) {
            const frameBottom = frameInnerY + frameInnerHeight
            slotHeight = frameBottom - y
        }
        
        // 우측 슬롯(2, 4번째)의 경우 너비를 정확히 계산하여 frameInnerWidth까지 완전히 채우기
        if (slot.x + slot.width >= 1.0) {
            const frameRight = frameInnerX + frameInnerWidth
            slotWidth = frameRight - x
        }
        
        // 첫 번째 슬롯(좌상)이 정확히 frameInnerX, frameInnerY에서 시작하도록
        if (slot.x === 0 && slot.y === 0) {
            x = frameInnerX
            y = frameInnerY
        }
        
        // 정수로 변환 (반올림 오차 최소화)
        x = Math.floor(x)
        y = Math.floor(y)
        slotWidth = Math.ceil(slotWidth)
        slotHeight = Math.ceil(slotHeight)
        
        // 마지막 슬롯이 프레임 경계까지 정확히 채우도록 (하단 슬롯이 잘리지 않도록)
        if (slot.x + slot.width >= 1.0) {
            slotWidth = (frameInnerX + frameInnerWidth) - x
        }
        if (slot.y + slot.height >= 1.0) {
            const frameBottom = frameInnerY + frameInnerHeight
            slotHeight = frameBottom - y
            // 높이가 음수가 되지 않도록 보장
            if (slotHeight < 0) slotHeight = 0
        }
        
        // 슬롯이 프레임 경계를 넘지 않도록 보장
        if (x + slotWidth > frameInnerX + frameInnerWidth) {
            slotWidth = (frameInnerX + frameInnerWidth) - x
        }
        if (y + slotHeight > frameInnerY + frameInnerHeight) {
            slotHeight = (frameInnerY + frameInnerHeight) - y
        }

        if (slotWidth === 0 || slotHeight === 0) return

        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        img.onload = () => {
            if (!canvas) return

            // 슬롯 배경색 그리기 (흰색 여백 방지)
            ctx.fillStyle = frame.layout.slotColor || '#ffffff'
            ctx.fillRect(x, y, slotWidth, slotHeight)

            ctx.save()
            ctx.beginPath()
            ctx.rect(x, y, slotWidth, slotHeight)
            ctx.clip()

            const imgAspect = img.width / img.height
            const slotAspect = slotWidth / slotHeight

            let drawWidth, drawHeight, drawX, drawY

            const isBottomSlot = slot.y + slot.height >= 1.0
            
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
            
            // 하단 슬롯의 경우 높이를 더 크게 그려서 슬롯을 완전히 채우기
            if (isBottomSlot) {
                drawHeight = drawHeight + 2
                drawY = y
            } else {
                drawWidth = drawWidth + 2
                drawHeight = drawHeight + 2
                drawX = drawX - 1
                drawY = drawY - 1
            }

            // 이미지 그리기 (슬롯을 완전히 채우도록)
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
                // 상단 영역 높이를 줄이기 (하단 영역은 유지)
        const frameInnerHeight = height - frameBorderWidth - bottomHeight - (height * 0.05)
                
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

