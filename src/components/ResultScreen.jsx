import { useEffect, useRef, useCallback, useState } from 'react'
import QRCodeStyling from 'qr-code-styling'
import { savePhotoToServer } from '../lib/api'
import './ResultScreen.css'

function ResultScreen({ frame, selectedPhotos, photoTransforms, onSave, onNewPhoto }) {
    const canvasRef = useRef(null)
    const qrRef = useRef(null)
    const [qrModalOpen, setQrModalOpen] = useState(false)
    const [photoHash, setPhotoHash] = useState(null)
    const [isGeneratingQR, setIsGeneratingQR] = useState(false)
    
    // 자동 저장 상태 관리
    const [isAutoSaved, setIsAutoSaved] = useState(false)
    const [autoSaveHash, setAutoSaveHash] = useState(null)
    const isSavedRef = useRef(false) // 중복 호출 방지용 ref
    const saveTimeoutRef = useRef(null) // 저장 타이머 ref (중복 방지)

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

    const clampMove = useCallback((value, min, max) => {
        return Math.max(min, Math.min(max, value))
    }, [])

    const drawFrameBorder = useCallback((ctx, canvasWidth, canvasHeight) => {
        // 외곽 프레임 테두리 (캔버스 크기에 비례하여 조정)
        const frameBorderWidth = frame.layout.frameWidth || 15
        const scaledFrameWidth = frameBorderWidth * (canvasWidth / 200) // 200px 기준으로 비율 조정
        
        // 프레임 테두리 먼저 그리기
        ctx.strokeStyle = frame.layout.frameColor || '#808080'
        ctx.lineWidth = scaledFrameWidth
        ctx.strokeRect(
            scaledFrameWidth / 2,
            scaledFrameWidth / 2,
            canvasWidth - scaledFrameWidth,
            canvasHeight - scaledFrameWidth
        )

        // 하단 텍스트 영역
        const bottomHeight = canvasHeight * 0.08
        const bottomY = canvasHeight - bottomHeight
        ctx.fillStyle = frame.layout.frameColor || '#808080'
        // 프레임 테두리 안쪽부터 하단 영역 채우기
        ctx.fillRect(scaledFrameWidth, bottomY, canvasWidth - (scaledFrameWidth * 2), bottomHeight)

        // 하단 텍스트 또는 이미지
        if (frame.layout.bottomImage) {
            // 하단 이미지 (로고)
            const logoImg = new Image()
            logoImg.crossOrigin = 'anonymous'
            logoImg.onload = () => {
                // 이미지 비율 유지하면서 하단 영역에 맞춤
                const imgAspect = logoImg.width / logoImg.height
                const bottomAspect = canvasWidth / bottomHeight
                
                let drawWidth, drawHeight
                if (imgAspect > bottomAspect) {
                    // 이미지가 더 넓음 - 너비에 맞춤
                    drawWidth = canvasWidth * 0.9 // 여백 5%씩
                    drawHeight = drawWidth / imgAspect
                } else {
                    // 이미지가 더 높음 - 높이에 맞춤
                    drawHeight = bottomHeight * 0.8 // 여백 10%씩
                    drawWidth = drawHeight * imgAspect
                }
                
                const drawX = (canvasWidth - drawWidth) / 2
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
                const centerX = canvasWidth / 2
                // 텍스트를 아래로 내려서 다 보이게
                const centerY = bottomY + bottomHeight * 0.55
                
                // "Hope" 텍스트 (큰 크기)
                const hopeFontSize = Math.round(10 * (canvasWidth / 200))
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
                ctx.lineWidth = Math.max(1, Math.round(2 * (canvasWidth / 200)))
                const ellipseWidth = hopeWidth * 1.3
                const ellipseHeight = hopeHeight * 1.8
                ctx.beginPath()
                ctx.ellipse(centerX, centerY, ellipseWidth / 2, ellipseHeight / 2, 0, 0, 2 * Math.PI)
                ctx.stroke()
                
                // 별 모양 장식 (왼쪽 상단, 오른쪽 하단)
                const starSize = Math.max(3, Math.round(4 * (canvasWidth / 200)))
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
                    const buildersFontSize = Math.round(6 * (canvasWidth / 200))
                    ctx.font = `bold ${buildersFontSize}px ${fontFamily}`
                    ctx.fillText(lines[1], centerX, centerY + hopeHeight * 0.3)
                }
            } else {
                // 일반 텍스트 렌더링
                // 3번 프레임은 세리프 폰트 사용 (크기 조정)
                const baseFontSize = frame.layout.fontFamily ? 9 : 12
                const fontSize = Math.round(baseFontSize * (canvasWidth / 200))
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
                    ctx.fillText(line, canvasWidth / 2, startY + index * lineHeight)
                })
            }
        }

        // 십자가 선 그리기 (사진 위에 그려지도록 마지막에 그리기)
        // scaledFrameWidth는 이미 위에서 계산됨
        const frameInnerX = scaledFrameWidth
        const frameInnerY = scaledFrameWidth
        const frameInnerWidth = canvasWidth - (scaledFrameWidth * 2)
        const frameInnerHeight = canvasHeight - scaledFrameWidth - bottomHeight
        
        ctx.strokeStyle = frame.layout.frameColor || '#808080'
        // FrameSelectScreen과 동일한 비율로 선 굵기 조정 (10px * (canvasWidth/200))
        ctx.lineWidth = 10 * (canvasWidth / 200)
        
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
    }, [frame])

    // 자동 저장 함수 (내부용)
    const handleAutoSave = async () => {
        const canvas = canvasRef.current
        if (!canvas) return

        // 이미 저장 중이거나 저장 완료된 경우 중복 방지
        if (isSavedRef.current) {
            console.log('이미 저장되었거나 저장 중입니다. 중복 저장 방지.')
            return
        }

        // 저장 시작 표시
        isSavedRef.current = true

        try {
            console.log('자동 저장 시작...')
            // 고유 ID 생성
            const uniqueId = `lifecut_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

            // 현재 결과물을 이미지로 변환
            const imageData = canvas.toDataURL('image/png')

            // 서버에 저장
            const result = await savePhotoToServer({
                id: uniqueId,
                imageData: imageData,
                timestamp: new Date().toISOString()
            })

            // 해시값 저장
            setAutoSaveHash(result.hash)
            setPhotoHash(result.hash)
            setIsAutoSaved(true)

            // 로컬 IndexedDB에도 저장 (백업)
            try {
                const { initDB, savePhotoToDB } = await import('../lib/database')
                const db = await initDB()
                const photoData = {
                    id: uniqueId,
                    data: imageData,
                    timestamp: new Date().toISOString()
                }
                await savePhotoToDB(db, photoData)
            } catch (localError) {
                console.warn('로컬 저장 실패 (무시):', localError)
            }

            console.log('자동 저장 완료:', result.hash)
            // onSave() // 부모 컴포넌트에 알림 (필요한 경우)

        } catch (error) {
            console.error('자동 저장 실패:', error)
            // 저장 실패 시 다시 시도할 수 있도록 플래그 리셋
            isSavedRef.current = false
            // 자동 저장 실패는 사용자에게 알리지 않고 조용히 넘어감 (QR 생성 시 다시 시도하므로)
        }
    }

    const composeLifecut = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        // 캔버스 크기 설정 (인생네컷 비율: 3:4, 고해상도)
        const devicePixelRatio = window.devicePixelRatio || 2
        const displayWidth = 400 // 화면 표시 크기
        const displayHeight = 533 // 3:4 비율
        const renderWidth = 1200 // 실제 렌더링 크기 (고해상도)
        const renderHeight = 1600

        canvas.width = renderWidth * devicePixelRatio
        canvas.height = renderHeight * devicePixelRatio
        canvas.style.width = displayWidth + 'px'
        canvas.style.height = displayHeight + 'px'

        const ctx = canvas.getContext('2d')
        ctx.scale(devicePixelRatio, devicePixelRatio)

        const canvasWidth = renderWidth
        const canvasHeight = renderHeight

        // 배경
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)

        // 슬롯 배경색 제거 (사진이 슬롯을 완전히 채우도록)

        // 사진 배치 (비동기 처리)
        let loadedCount = 0
        const totalPhotos = selectedPhotos.filter(p => p).length

        if (totalPhotos === 0) {
            drawFrameBorder(ctx, canvasWidth, canvasHeight)
            return
        }

        selectedPhotos.forEach((photoSrc, index) => {
            if (!photoSrc) {
                loadedCount++
                if (loadedCount === totalPhotos) {
                    drawFrameBorder(ctx, canvasWidth, canvasHeight)
                }
                return
            }

            const slot = frame.layout.slots[index]
            const img = new Image()

            img.onload = () => {
                // 프레임 내부 영역 기준으로 슬롯 영역 계산
                const frameBorderWidth = frame.layout.frameWidth || 15
                const scaledFrameWidth = frameBorderWidth * (canvasWidth / 200) // 200px 기준으로 비율 조정
                const bottomHeight = canvasHeight * 0.08
                const frameInnerX = scaledFrameWidth
                const frameInnerY = scaledFrameWidth
                const frameInnerWidth = canvasWidth - (scaledFrameWidth * 2)
                const frameInnerHeight = canvasHeight - scaledFrameWidth - bottomHeight

                // 슬롯 영역 계산 (네컷처럼 프레임 내부 영역을 완전히 채우도록)
                let x = frameInnerX + (slot.x * frameInnerWidth)
                let y = frameInnerY + (slot.y * frameInnerHeight)
                let width = slot.width * frameInnerWidth
                let height = slot.height * frameInnerHeight
                
                // 하단 슬롯(3, 4번째)의 경우 높이를 정확히 계산하여 frameInnerHeight까지 완전히 채우기
                if (slot.y + slot.height >= 1.0) {
                    const frameBottom = frameInnerY + frameInnerHeight
                    height = frameBottom - y
                }
                
                // 우측 슬롯(2, 4번째)의 경우 너비를 정확히 계산하여 frameInnerWidth까지 완전히 채우기
                if (slot.x + slot.width >= 1.0) {
                    const frameRight = frameInnerX + frameInnerWidth
                    width = frameRight - x
                }
                
                // 첫 번째 슬롯(좌상)이 정확히 frameInnerX, frameInnerY에서 시작하도록
                if (slot.x === 0 && slot.y === 0) {
                    x = frameInnerX
                    y = frameInnerY
                }
                
                // 정수로 변환 (반올림 오차 최소화)
                x = Math.floor(x)
                y = Math.floor(y)
                width = Math.ceil(width)
                height = Math.ceil(height)
                
                // 마지막 슬롯이 프레임 경계까지 정확히 채우도록 (하단 슬롯이 잘리지 않도록)
                if (slot.x + slot.width >= 1.0) {
                    width = (frameInnerX + frameInnerWidth) - x
                }
                if (slot.y + slot.height >= 1.0) {
                    const frameBottom = frameInnerY + frameInnerHeight
                    height = frameBottom - y
                    // 높이가 음수가 되지 않도록 보장
                    if (height < 0) height = 0
                }
                
                // 슬롯이 프레임 경계를 넘지 않도록 보장
                if (x + width > frameInnerX + frameInnerWidth) {
                    width = (frameInnerX + frameInnerWidth) - x
                }
                if (y + height > frameInnerY + frameInnerHeight) {
                    height = (frameInnerY + frameInnerHeight) - y
                }

                // 슬롯 배경색 그리기 (흰색 여백 방지)
                ctx.fillStyle = frame.layout.slotColor || '#ffffff'
                ctx.fillRect(x, y, width, height)

                // 클리핑 영역 설정 (십자가 선이 그려질 수 있도록 주의, 하단 슬롯이 잘리지 않도록)
                ctx.save()
                ctx.beginPath()
                // 클리핑 영역을 약간 크게 설정하여 사진이 잘리지 않도록
                ctx.rect(x, y, width, height)
                ctx.clip()

                // 사진을 슬롯에 맞게 그리기
                const imgAspect = img.width / img.height
                const slotAspect = width / height
                const transform = photoTransforms[index] || { x: 0, y: 0 }

                // 이동 범위 계산
                const limits = getMoveLimits(img, width, height)

                // 이동 값 제한
                const offsetX = clampMove(transform.x || 0, limits.minMoveX, limits.maxMoveX)
                const offsetY = clampMove(transform.y || 0, limits.minMoveY, limits.maxMoveY)

                // 이미지 소스 영역 계산 (크롭)
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

                // 이동에 따른 소스 영역 조정
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

                // 사진 그리기 (슬롯을 완전히 채우도록, 하단 슬롯이 잘리지 않도록)
                const isBottomSlot = slot.y + slot.height >= 1.0
                const drawWidth = width + 2
                // 하단 슬롯의 경우 높이를 더 크게 그려서 슬롯을 완전히 채우기
                const drawHeight = isBottomSlot ? height + 3 : height + 2
                // 하단 슬롯의 경우 y 위치를 약간 위로 조정하여 슬롯을 완전히 채우기
                const drawX = isBottomSlot ? x - 1 : x - 1
                const drawY = isBottomSlot ? y - 1 : y - 1
                ctx.drawImage(
                    img,
                    sourceX, sourceY, sourceWidth, sourceHeight,
                    drawX, drawY, drawWidth, drawHeight
                )

                ctx.restore()

                // 사진 테두리 제거 (십자가 선으로 대체)

                loadedCount++

                // 모든 사진이 로드되면 프레임 테두리 그리기 및 자동 저장 트리거
                if (loadedCount === totalPhotos) {
                    drawFrameBorder(ctx, canvasWidth, canvasHeight)
                    
                    // 렌더링 완료 후 자동 저장 (중복 방지)
                    // 저장이 아직 안 되었고, 타이머가 설정되지 않았을 때만 저장
                    if (!isSavedRef.current && !saveTimeoutRef.current) {
                        saveTimeoutRef.current = setTimeout(() => {
                            // 타이머 실행 시점에 다시 한 번 체크 (다른 타이머가 실행했을 수 있음)
                            if (!isSavedRef.current) {
                                handleAutoSave()
                            }
                            saveTimeoutRef.current = null
                        }, 500) // 0.5초 후 저장 (안전한 렌더링 보장)
                    }
                }
            }

            img.onerror = () => {
                console.error(`사진 ${index + 1} 로드 실패`)
                loadedCount++
                if (loadedCount === totalPhotos) {
                    drawFrameBorder(ctx, canvasWidth, canvasHeight)
                }
            }

            img.src = photoSrc
        })
    }, [frame, selectedPhotos, photoTransforms, getMoveLimits, clampMove, drawFrameBorder])

    useEffect(() => {
        // composeLifecut 호출 전에 저장 플래그 리셋 (새로운 렌더링 시작)
        // 단, 이미 저장이 완료된 경우는 리셋하지 않음 (사용자가 새로 만들기를 누른 경우만)
        // isSavedRef.current = false // 이건 주석 처리 - 한 번 저장되면 계속 유지
        
        // 기존 타이머 취소
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
            saveTimeoutRef.current = null
        }
        
        composeLifecut()
        
        // 컴포넌트 언마운트 시 타이머 정리
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
                saveTimeoutRef.current = null
            }
        }
    }, [composeLifecut])

    const handleDownload = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const imageData = canvas.toDataURL('image/png')
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

        if (isMobile && navigator.share) {
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `인생네컷_${Date.now()}.png`, { type: 'image/png' })
                    navigator.share({
                        title: '인생네컷',
                        text: '인생네컷을 공유합니다',
                        files: [file]
                    }).catch(() => {
                        downloadImageDirectly(imageData)
                    })
                } else {
                    downloadImageDirectly(imageData)
                }
            }, 'image/png')
        } else {
            downloadImageDirectly(imageData)
        }
    }

    const downloadImageDirectly = (imageData) => {
        const downloadFilename = `인생네컷_${Date.now()}.png`
        fetch(imageData)
            .then(res => res.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.download = downloadFilename
                link.href = url
                link.style.display = 'none'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                setTimeout(() => URL.revokeObjectURL(url), 100)
            })
            .catch(() => {
                const link = document.createElement('a')
                link.download = downloadFilename
                link.href = imageData
                link.click()
            })
    }

    // QR 코드 생성 (이제 이미 저장된 해시 사용)
    const handleGenerateQR = async () => {
        const canvas = canvasRef.current
        if (!canvas) return

        // 자동 저장이 아직 안 끝났으면 잠시 대기
        if (!autoSaveHash && !photoHash) {
            setIsGeneratingQR(true)
            // 2초 정도 대기해보고 없으면 수동 저장 시도
            try {
                await new Promise(resolve => setTimeout(resolve, 2000))
                if (!autoSaveHash && !photoHash) {
                    await handleAutoSave() // 수동 저장 시도
                }
            } catch (e) {
                console.error(e)
            }
            setIsGeneratingQR(false)
        }

        const finalHash = autoSaveHash || photoHash
        if (!finalHash) {
            alert('아직 저장이 완료되지 않았습니다. 잠시 후 다시 시도해주세요.')
            return
        }

        setQrModalOpen(true)
        
        // QR 코드 URL 생성 (배포된 도메인 + 해시값)
        const deployUrl = 'https://christmas-liard-eight.vercel.app'
        const qrUrl = `${deployUrl}/result/${finalHash}`
        
        // 모달이 열린 후 QR 코드 생성 및 렌더링
        setTimeout(() => {
            if (qrRef.current) {
                qrRef.current.innerHTML = '' // 기존 QR 코드 제거
                
                const qrCode = new QRCodeStyling({
                    width: 300,
                    height: 300,
                    type: "svg",
                    data: qrUrl,
                    // image: "/favicon.svg", // 로고 제거
                    dotsOptions: {
                        color: "#000000",
                        type: "rounded"
                    },
                    backgroundOptions: {
                        color: "#ffffff",
                    },
                    imageOptions: {
                        crossOrigin: "anonymous",
                        margin: 10
                    }
                })
                
                qrCode.append(qrRef.current)
            }
        }, 100)
    }




    return (
        <div className="screen active">
            <div className="result-container">
                <h2>완성된 인생네컷</h2>
                <div className="result-image">
                    <canvas ref={canvasRef} id="resultCanvas" />
                </div>
                <div className="result-controls">
                    {/* 저장 버튼 제거 (자동 저장됨) */}
                    <button className="btn btn-secondary" onClick={handleDownload}>
                        📥 다운로드
                    </button>
                    <button 
                        className="btn btn-secondary" 
                        onClick={handleGenerateQR}
                        // disabled={isGeneratingQR}
                    >
                        {isGeneratingQR ? '⏳ 처리 중...' : '📱 QR 보기'}
                    </button>
                    <button className="btn btn-secondary" onClick={onNewPhoto}>
                        새로 만들기
                    </button>
                </div>

                {/* QR 코드 모달 */}
                {qrModalOpen && (
                    <div className="qr-modal-overlay" onClick={() => setQrModalOpen(false)}>
                        <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
                            <button 
                                className="qr-modal-close"
                                onClick={() => setQrModalOpen(false)}
                            >
                                ✕
                            </button>
                            <h3>📱 QR 코드</h3>
                            <p style={{ marginBottom: '10px' }}>
                                이 QR 코드를 스캔하면<br />
                                <strong>다른 기기에서도 결과물을 다운로드</strong>할 수 있습니다.
                            </p>
                            <div className="qr-code-image" ref={qrRef}>
                                {/* QR 코드가 여기에 렌더링됩니다 */}
                            </div>
                            <p className="qr-url">
                                {`https://christmas-liard-eight.vercel.app/result/${photoHash || autoSaveHash}`}
                            </p>
                            <p style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
                                💡 LTE/5G 환경에서도 접근 가능합니다
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ResultScreen
