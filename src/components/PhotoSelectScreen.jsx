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
    onCompose,
    allowPhotoChange = true
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

        // 배경 제거 (투명하게 - 사진이 보이도록)
        // ctx.fillStyle = '#ffffff'
        // ctx.fillRect(0, 0, width, height)

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
            const width = Math.ceil(slot.width * frameInnerWidth)
            const height = Math.ceil(slot.height * frameInnerHeight)
            
            return { x, y, width, height }
        }).filter(p => p !== null)
        
        if (positions.length > 0) {
            setSlotPositions(positions)
        }
    }, [frame])

    // ResultScreen과 동일한 이동 범위 계산 함수
    const getMoveLimits = useCallback((img, slotWidth, slotHeight) => {
        const imgAspect = img.width / img.height
        const slotAspect = slotWidth / slotHeight

        let drawWidth, drawHeight

        if (imgAspect > slotAspect) {
            drawHeight = slotHeight
            drawWidth = slotHeight * imgAspect
        } else {
            drawWidth = slotWidth
            drawHeight = slotWidth / imgAspect
        }

        const minMoveX = slotWidth - drawWidth
        const maxMoveX = 0
        const minMoveY = slotHeight - drawHeight
        const maxMoveY = 0

        return { minMoveX, maxMoveX, minMoveY, maxMoveY }
    }, [])

    // ResultScreen과 동일한 이동 값 제한 함수
    const clampMove = useCallback((value, min, max) => {
        return Math.max(min, Math.min(max, value))
    }, [])

    const drawPhotoInSlot = useCallback((index, photoSrc) => {
        const canvas = slotCanvasRefs.current[index]
        if (!canvas || !frameCanvasRef.current || !frame) return

        const slot = frame.layout.slots[index]
        if (!slot) return

        // canvas의 부모 요소(.photo-slot) 찾기
        const slotElement = canvas.closest('.photo-slot')
        if (!slotElement) return

        // 부모 요소의 크기 사용 (이미 올바른 위치에 배치되어 있음)
        const slotRect = slotElement.getBoundingClientRect()
        const width = slotRect.width
        const height = slotRect.height

        if (width === 0 || height === 0) return

        const devicePixelRatio = window.devicePixelRatio || 2
        const canvasWidth = width * devicePixelRatio
        const canvasHeight = height * devicePixelRatio

        // Canvas 크기 설정 (부모 요소 기준으로 위치 설정)
        canvas.width = canvasWidth
        canvas.height = canvasHeight
        canvas.style.width = width + 'px'
        canvas.style.height = height + 'px'
        canvas.style.left = '0px'
        canvas.style.top = '0px'
        canvas.style.position = 'absolute'

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // 초기화
        ctx.clearRect(0, 0, canvasWidth, canvasHeight)
        ctx.scale(devicePixelRatio, devicePixelRatio)

        const img = new Image()
        // data URL이나 같은 도메인 이미지인 경우 crossOrigin 설정 불필요
        if (photoSrc && !photoSrc.startsWith('data:')) {
            img.crossOrigin = 'anonymous'
        }
        
        img.onload = () => {
            // 다시 한번 확인 (컴포넌트가 언마운트되었을 수 있음)
            if (!canvas) return

            // 부모 요소의 크기 재확인
            const slotElement = canvas.closest('.photo-slot')
            if (!slotElement) return

            const slotRect = slotElement.getBoundingClientRect()
            const currentWidth = slotRect.width
            const currentHeight = slotRect.height

            if (currentWidth === 0 || currentHeight === 0) return

            // Canvas 크기 재설정
            const currentCanvasWidth = currentWidth * devicePixelRatio
            const currentCanvasHeight = currentHeight * devicePixelRatio

            canvas.width = currentCanvasWidth
            canvas.height = currentCanvasHeight
            canvas.style.width = currentWidth + 'px'
            canvas.style.height = currentHeight + 'px'
            canvas.style.left = '0px'
            canvas.style.top = '0px'

            const ctx = canvas.getContext('2d')
            if (!ctx) return

            // Context 초기화
            ctx.setTransform(1, 0, 0, 1, 0, 0) // Transform 리셋
            ctx.clearRect(0, 0, currentCanvasWidth, currentCanvasHeight)
            ctx.scale(devicePixelRatio, devicePixelRatio)

            // 슬롯 배경색 제거 (사진이 슬롯을 완전히 채우도록)

            ctx.save()
            ctx.beginPath()
            ctx.rect(0, 0, currentWidth, currentHeight)
            ctx.clip()

            // ResultScreen과 동일한 로직 사용
            const imgAspect = img.width / img.height
            const slotAspect = currentWidth / currentHeight
            const transform = photoTransforms[index] || { x: 0, y: 0 }

            // 이동 범위 계산 (ResultScreen과 동일)
            const limits = getMoveLimits(img, currentWidth, currentHeight)

            // 이동 값 제한 (ResultScreen과 동일)
            const offsetX = clampMove(transform.x || 0, limits.minMoveX, limits.maxMoveX)
            const offsetY = clampMove(transform.y || 0, limits.minMoveY, limits.maxMoveY)

            // 이미지 소스 영역 계산 (크롭) - ResultScreen과 동일
            let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height

            if (imgAspect > slotAspect) {
                const cropWidth = img.height * slotAspect
                sourceX = (img.width - cropWidth) / 2
                sourceWidth = cropWidth
            } else {
                const cropHeight = img.width / slotAspect
                sourceY = (img.height - cropHeight) / 2
                sourceHeight = cropHeight
            }

            // 이동에 따른 소스 영역 조정 - ResultScreen과 동일
            if (limits.maxMoveX > 0) {
                const moveRatio = offsetX / limits.maxMoveX
                const maxCropX = (img.width - sourceWidth) / 2
                sourceX = (img.width - sourceWidth) / 2 - moveRatio * maxCropX
                sourceX = Math.max(0, Math.min(img.width - sourceWidth, sourceX))
            }

            if (limits.maxMoveY > 0) {
                const moveRatio = offsetY / limits.maxMoveY
                const maxCropY = (img.height - sourceHeight) / 2
                sourceY = (img.height - sourceHeight) / 2 - moveRatio * maxCropY
                sourceY = Math.max(0, Math.min(img.height - sourceHeight, sourceY))
            }

            // 이미지 그리기 (ResultScreen과 동일) - 슬롯을 완전히 채우도록
            ctx.drawImage(
                img,
                sourceX, sourceY, sourceWidth, sourceHeight,
                0, 0, currentWidth, currentHeight
            )
            ctx.restore()

            // 사진을 그린 후 십자가 선 다시 그리기 (사진 위에 표시)
            if (frameCanvasRef.current && frame) {
                setTimeout(() => {
                    const frameCanvas = frameCanvasRef.current
                    if (!frameCanvas) return
                    
                    const frameCtx = frameCanvas.getContext('2d')
                    if (!frameCtx) return
                    
                    const frameRect = frameCanvas.getBoundingClientRect()
                    const frameWidth = frameRect.width
                    const frameHeight = frameRect.height
                    
                    if (frameWidth === 0 || frameHeight === 0) return
                    
                    const frameBorderWidth = frame.layout.frameWidth || 15
                    const bottomHeight = frameHeight * 0.08
                    const frameInnerX = frameBorderWidth
                    const frameInnerY = frameBorderWidth
                    const frameInnerWidth = frameWidth - (frameBorderWidth * 2)
                    const frameInnerHeight = frameHeight - frameBorderWidth - bottomHeight
                    
                    // 십자가 선 다시 그리기
                    frameCtx.strokeStyle = frame.layout.frameColor || '#808080'
                    frameCtx.lineWidth = 10
                    
                    // 가로선 (중앙)
                    const centerY = frameInnerY + (frameInnerHeight / 2)
                    frameCtx.beginPath()
                    frameCtx.moveTo(frameInnerX, centerY)
                    frameCtx.lineTo(frameInnerX + frameInnerWidth, centerY)
                    frameCtx.stroke()
                    
                    // 세로선 (중앙)
                    const centerX = frameInnerX + (frameInnerWidth / 2)
                    frameCtx.beginPath()
                    frameCtx.moveTo(centerX, frameInnerY)
                    frameCtx.lineTo(centerX, frameInnerY + frameInnerHeight)
                    frameCtx.stroke()
                }, 50)
            }
        }
        
        img.onerror = (error) => {
            console.error('이미지 로드 실패:', photoSrc, error)
            // 에러 발생 시 빈 캔버스로 표시
            if (canvas) {
                const ctx = canvas.getContext('2d')
                if (ctx) {
                    ctx.fillStyle = '#f0f0f0'
                    ctx.fillRect(0, 0, canvas.width, canvas.height)
                    ctx.fillStyle = '#999'
                    ctx.font = '14px sans-serif'
                    ctx.textAlign = 'center'
                    ctx.fillText('이미지 로드 실패', canvas.width / 2, canvas.height / 2)
                }
            }
        }
        
        // 이미지 소스 설정 (에러 핸들러 설정 후)
        if (photoSrc) {
            img.src = photoSrc
        } else {
            console.warn('사진 소스가 없습니다:', index)
        }
    }, [frame, photoTransforms, getMoveLimits, clampMove])

    useEffect(() => {
        if (!frame) return
        
        // 프레임 배경 그리기
        drawFrameBackground()
        
        // 프레임이 그려진 후 슬롯 위치 계산
        const timer1 = setTimeout(() => {
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
            clearTimeout(timer1)
            window.removeEventListener('resize', handleResize)
        }
    }, [frame, calculateSlotPositions, drawFrameBackground])


    useEffect(() => {
        if (!frame) return
        
        // 프레임이 완전히 그려진 후 사진을 그리기 위해 약간의 딜레이
        const timer = setTimeout(() => {
            // 프레임이 제대로 그려졌는지 확인
            if (!frameCanvasRef.current) return
            
            const frameRect = frameCanvasRef.current.getBoundingClientRect()
            if (frameRect.width === 0 || frameRect.height === 0) {
                // 프레임이 아직 그려지지 않았으면 재시도
                setTimeout(() => {
                    selectedPhotos.forEach((photo, index) => {
                        if (photo) {
                            drawPhotoInSlot(index, photo)
                        }
                    })
                }, 200)
                return
            }
            
            // 각 슬롯에 사진 배치
            selectedPhotos.forEach((photo, index) => {
                if (photo) {
                    // 각 사진을 약간의 간격을 두고 그리기
                    setTimeout(() => {
                        drawPhotoInSlot(index, photo)
                    }, index * 100)
                }
            })
        }, 600) // 프레임 렌더링 후 충분한 시간 대기
        
        return () => {
            clearTimeout(timer)
        }
    }, [selectedPhotos, photoTransforms, frame, drawPhotoInSlot])

    // 모든 사진이 로드된 후 십자가 선 다시 그리기
    useEffect(() => {
        if (!frame || !frameCanvasRef.current) return
        
        // 사진이 모두 선택되었는지 확인
        const hasAllPhotos = selectedPhotos.every(photo => photo !== null)
        if (!hasAllPhotos) return
        
        // 사진 로딩을 기다린 후 십자가 선 다시 그리기
        const timer = setTimeout(() => {
            const frameCanvas = frameCanvasRef.current
            if (!frameCanvas) return
            
            const frameCtx = frameCanvas.getContext('2d')
            if (!frameCtx) return
            
            const frameRect = frameCanvas.getBoundingClientRect()
            const frameWidth = frameRect.width
            const frameHeight = frameRect.height
            
            if (frameWidth === 0 || frameHeight === 0) return
            
            const frameBorderWidth = frame.layout.frameWidth || 15
            const bottomHeight = frameHeight * 0.08
            const frameInnerX = frameBorderWidth
            const frameInnerY = frameBorderWidth
            const frameInnerWidth = frameWidth - (frameBorderWidth * 2)
            const frameInnerHeight = frameHeight - frameBorderWidth - bottomHeight
            
            // 십자가 선 다시 그리기
            frameCtx.strokeStyle = frame.layout.frameColor || '#808080'
            frameCtx.lineWidth = 10
            
            // 가로선 (중앙)
            const centerY = frameInnerY + (frameInnerHeight / 2)
            frameCtx.beginPath()
            frameCtx.moveTo(frameInnerX, centerY)
            frameCtx.lineTo(frameInnerX + frameInnerWidth, centerY)
            frameCtx.stroke()
            
            // 세로선 (중앙)
            const centerX = frameInnerX + (frameInnerWidth / 2)
            frameCtx.beginPath()
            frameCtx.moveTo(centerX, frameInnerY)
            frameCtx.lineTo(centerX, frameInnerY + frameInnerHeight)
            frameCtx.stroke()
        }, 1000)
        
        return () => {
            clearTimeout(timer)
        }
    }, [selectedPhotos, frame])

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
                <h2>프레임에 맞춰 사진을 확인하세요</h2>
                <p className="photo-select-hint">
                    {allowPhotoChange 
                        ? '각 슬롯을 클릭하여 사진을 추가하세요' 
                        : '사진 위치를 조정할 수 있습니다'}
                </p>
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
                                    {allowPhotoChange && (
                                        <input
                                            type="file"
                                            id={`photoInput${index}`}
                                            accept="image/*"
                                            capture="environment"
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleFileSelect(index, e)}
                                        />
                                    )}
                                    <label 
                                        htmlFor={allowPhotoChange ? `photoInput${index}` : undefined}
                                        className="photo-slot-label"
                                        style={{ cursor: allowPhotoChange ? 'pointer' : 'default' }}
                                    >
                                        {!selectedPhotos[index] ? (
                                            allowPhotoChange ? (
                                                <div className="slot-placeholder">
                                                    <span className="slot-number">{index + 1}</span>
                                                    <span className="slot-text">사진 선택</span>
                                                </div>
                                            ) : null
                                        ) : (
                                            <canvas
                                                ref={(el) => (slotCanvasRefs.current[index] = el)}
                                                className="slot-canvas"
                                            />
                                        )}
                                    </label>
                                    {selectedPhotos[index] && allowPhotoChange && (
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

