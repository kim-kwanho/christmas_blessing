import { useEffect, useRef, useState, useCallback } from 'react'
import './PhotoSelectScreen.css'

function PhotoSelectScreen({
    frame,
    selectedPhotos,
    photoTransforms,
    onPhotoSelect,
    onPhotoRemove,
    onPhotoTransformChange,
    onBack,
    onCompose
}) {
    const frameCanvasRef = useRef(null)
    const slotCanvasRefs = useRef([null, null, null, null])
    const [isComposing, setIsComposing] = useState(false)
    const [slotPositions, setSlotPositions] = useState([null, null, null, null])

    const drawFrameBackground = useCallback(() => {
        const canvas = frameCanvasRef.current
        if (!canvas || !frame) return

        const ctx = canvas.getContext('2d')
        const rect = canvas.getBoundingClientRect()
        const width = rect.width
        const height = rect.height

        if (width === 0 || height === 0) return

        canvas.width = width
        canvas.height = height

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

        // 슬롯 배경색 (프레임 내부 영역 기준)
        if (frame.layout.slotColor && frame.layout.slots) {
            frame.layout.slots.forEach((slot) => {
                const x = Math.floor(frameInnerX + (slot.x * frameInnerWidth))
                const y = Math.floor(frameInnerY + (slot.y * frameInnerHeight))
                const w = Math.floor(slot.width * frameInnerWidth)
                const h = Math.floor(slot.height * frameInnerHeight)
                ctx.fillStyle = frame.layout.slotColor
                ctx.fillRect(x, y, w, h)
            })
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

        // 하단 텍스트
        if (frame.layout.bottomText) {
            ctx.fillStyle = frame.layout.frameColor || '#333'
            ctx.fillRect(0, height * 0.92, width, height * 0.08)
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 20px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText(frame.layout.bottomText, width / 2, height - 15)
        }
    }, [frame])

    const calculateSlotPositions = useCallback(() => {
        if (!frameCanvasRef.current || !frame) return
        
        const positions = frame.layout.slots.map((slot) => {
            const frameRect = frameCanvasRef.current.getBoundingClientRect()
            const frameWidth = frameRect.width
            const frameHeight = frameRect.height
            
            if (frameWidth === 0 || frameHeight === 0) return null
            
            const frameBorderWidth = frame.layout.frameWidth || 15
            const bottomHeight = frameHeight * 0.08
            const frameInnerX = frameBorderWidth
            const frameInnerY = frameBorderWidth
            const frameInnerWidth = frameWidth - (frameBorderWidth * 2)
            const frameInnerHeight = frameHeight - frameBorderWidth - bottomHeight
            
            const x = Math.floor(frameInnerX + (slot.x * frameInnerWidth))
            const y = Math.floor(frameInnerY + (slot.y * frameInnerHeight))
            const width = Math.floor(slot.width * frameInnerWidth)
            const height = Math.floor(slot.height * frameInnerHeight)
            
            return { x, y, width, height }
        }).filter(p => p !== null)
        
        if (positions.length > 0) {
            setSlotPositions(positions)
        }
    }, [frame])

    const drawPhotoInSlot = useCallback((index, photoSrc) => {
        const canvas = slotCanvasRefs.current[index]
        if (!canvas || !frameCanvasRef.current) return

        const ctx = canvas.getContext('2d')
        const slot = frame.layout.slots[index]
        const frameRect = frameCanvasRef.current.getBoundingClientRect()
        const frameWidth = frameRect.width
        const frameHeight = frameRect.height

        const frameBorderWidth = frame.layout.frameWidth || 15
        const bottomHeight = frameHeight * 0.08
        const frameInnerX = frameBorderWidth
        const frameInnerY = frameBorderWidth
        const frameInnerWidth = frameWidth - (frameBorderWidth * 2)
        const frameInnerHeight = frameHeight - frameBorderWidth - bottomHeight

        const x = Math.floor(frameInnerX + (slot.x * frameInnerWidth))
        const y = Math.floor(frameInnerY + (slot.y * frameInnerHeight))
        const width = Math.floor(slot.width * frameInnerWidth)
        const height = Math.floor(slot.height * frameInnerHeight)

        const devicePixelRatio = window.devicePixelRatio || 2
        canvas.width = width * devicePixelRatio
        canvas.height = height * devicePixelRatio
        canvas.style.width = width + 'px'
        canvas.style.height = height + 'px'
        canvas.style.left = `${x}px`
        canvas.style.top = `${y}px`
        canvas.style.position = 'absolute'

        ctx.scale(devicePixelRatio, devicePixelRatio)

        const img = new Image()
        img.onload = () => {
            ctx.clearRect(0, 0, width, height)
            ctx.save()
            ctx.beginPath()
            ctx.rect(0, 0, width, height)
            ctx.clip()

            const imgAspect = img.width / img.height
            const slotAspect = width / height
            const transform = photoTransforms[index] || { x: 0, y: 0 }

            let drawWidth, drawHeight, drawX, drawY

            if (imgAspect > slotAspect) {
                drawHeight = height
                drawWidth = height * imgAspect
                drawX = (width - drawWidth) / 2 + transform.x
                drawY = transform.y
            } else {
                drawWidth = width
                drawHeight = width / imgAspect
                drawX = transform.x
                drawY = (height - drawHeight) / 2 + transform.y
            }

            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
            ctx.restore()
        }
        img.onerror = () => {
            console.error('이미지 로드 실패:', photoSrc)
        }
        img.src = photoSrc
    }, [frame, photoTransforms, slotPositions])

    useEffect(() => {
        if (!frame) return
        
        drawFrameBackground()
        // 프레임이 그려진 후 슬롯 위치 계산
        const timer = setTimeout(() => {
            calculateSlotPositions()
        }, 100)
        
        // 윈도우 리사이즈 시 위치 재계산
        const handleResize = () => {
            drawFrameBackground()
            setTimeout(() => {
                calculateSlotPositions()
            }, 50)
        }
        
        window.addEventListener('resize', handleResize)
        
        return () => {
            clearTimeout(timer)
            window.removeEventListener('resize', handleResize)
        }
    }, [frame, calculateSlotPositions, drawFrameBackground])

    useEffect(() => {
        if (!frame || slotPositions.every(p => p === null)) return
        
        selectedPhotos.forEach((photo, index) => {
            if (photo && slotPositions[index]) {
                drawPhotoInSlot(index, photo)
            }
        })
    }, [selectedPhotos, photoTransforms, frame, slotPositions, drawPhotoInSlot])

    const handleFileSelect = (index, event) => {
        const file = event.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            onPhotoSelect(index, e.target.result)
        }
        reader.readAsDataURL(file)
    }

    const allPhotosSelected = selectedPhotos.every(photo => photo !== null)

    // 슬롯 위치 스타일 계산
    const getSlotStyle = (index) => {
        const position = slotPositions[index]
        if (!position) {
            return { visibility: 'hidden' }
        }
        
        return {
            position: 'absolute',
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: `${position.width}px`,
            height: `${position.height}px`
        }
    }

    return (
        <div className="screen active">
            <div className="photo-select-container">
                <h2>프레임에 맞춰 사진을 선택하세요</h2>
                <p className="photo-select-hint">각 슬롯을 클릭하여 사진을 추가하세요</p>
                <div className="frame-preview-background">
                    <canvas
                        ref={frameCanvasRef}
                        id="frameOverlayCanvas"
                        className="frame-overlay"
                    />
                    <div className="photo-slots-container">
                        {[0, 1, 2, 3].map((index) => {
                            const slotStyle = getSlotStyle(index)
                            return (
                                <div 
                                    key={index} 
                                    className="photo-slot" 
                                    data-index={index}
                                    style={slotStyle}
                                >
                                    <input
                                        type="file"
                                        id={`photoInput${index}`}
                                        accept="image/*"
                                        capture="environment"
                                        style={{ display: 'none' }}
                                        onChange={(e) => handleFileSelect(index, e)}
                                    />
                                    <label htmlFor={`photoInput${index}`} className="photo-slot-label">
                                        {!selectedPhotos[index] ? (
                                            <div className="slot-placeholder">
                                                <span className="slot-number">{index + 1}</span>
                                                <span className="slot-text">사진 선택</span>
                                            </div>
                                        ) : (
                                            <canvas
                                                ref={(el) => (slotCanvasRefs.current[index] = el)}
                                                className="slot-canvas"
                                            />
                                        )}
                                    </label>
                                    {selectedPhotos[index] && (
                                        <button
                                            className="slot-remove"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onPhotoRemove(index)
                                            }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className="photo-select-controls">
                    <button className="btn btn-secondary" onClick={onBack}>
                        프레임 다시 선택
                    </button>
                    <button
                        className="btn btn-primary"
                        disabled={!allPhotosSelected || isComposing}
                        onClick={() => {
                            setIsComposing(true)
                            onCompose()
                        }}
                    >
                        {isComposing ? '처리 중...' : '인생네컷 만들기'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default PhotoSelectScreen

