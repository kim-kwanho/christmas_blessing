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
        // 외곽 프레임 테두리
        ctx.strokeStyle = frame.layout.frameColor || '#808080'
        ctx.lineWidth = frame.layout.frameWidth || 15
        ctx.strokeRect(
            frame.layout.frameWidth / 2,
            frame.layout.frameWidth / 2,
            canvasWidth - frame.layout.frameWidth,
            canvasHeight - frame.layout.frameWidth
        )

        // 하단 텍스트 영역
        const bottomHeight = canvasHeight * 0.08
        const bottomY = canvasHeight - bottomHeight
        ctx.fillStyle = frame.layout.frameColor || '#808080'
        ctx.fillRect(0, bottomY, canvasWidth, bottomHeight)

        // 하단 텍스트
        if (frame.layout.bottomText) {
            ctx.fillStyle = frame.layout.textColor || '#ffffff'
            // FrameSelectScreen과 동일한 비율로 텍스트 크기 조정 (12px * (canvasWidth/200))
            const fontSize = Math.round(12 * (canvasWidth / 200))
            ctx.font = `bold ${fontSize}px sans-serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(frame.layout.bottomText, canvasWidth / 2, bottomY + bottomHeight / 2)
        }

        // 십자가 선 그리기 (사진 위에 그려지도록 마지막에 그리기)
        const frameBorderWidth = frame.layout.frameWidth || 15
        const frameInnerX = frameBorderWidth
        const frameInnerY = frameBorderWidth
        const frameInnerWidth = canvasWidth - (frameBorderWidth * 2)
        const frameInnerHeight = canvasHeight - frameBorderWidth - bottomHeight
        
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
                const bottomHeight = canvasHeight * 0.08
                const frameInnerX = frameBorderWidth
                const frameInnerY = frameBorderWidth
                const frameInnerWidth = canvasWidth - (frameBorderWidth * 2)
                const frameInnerHeight = canvasHeight - frameBorderWidth - bottomHeight

                // 슬롯 영역 계산
                const x = Math.floor(frameInnerX + (slot.x * frameInnerWidth))
                const y = Math.floor(frameInnerY + (slot.y * frameInnerHeight))
                const width = Math.floor(slot.width * frameInnerWidth)
                const height = Math.floor(slot.height * frameInnerHeight)

                // 클리핑 영역 설정 (십자가 선이 그려질 수 있도록 주의)
                ctx.save()
                ctx.beginPath()
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

                // 사진 그리기
                ctx.drawImage(
                    img,
                    sourceX, sourceY, sourceWidth, sourceHeight,
                    x, y, width, height
                )

                ctx.restore()

                // 사진 테두리 제거 (십자가 선으로 대체)

                loadedCount++

                // 모든 사진이 로드되면 프레임 테두리 그리기
                if (loadedCount === totalPhotos) {
                    drawFrameBorder(ctx, canvasWidth, canvasHeight)
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
        composeLifecut()
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

    // QR 코드 생성
    const handleGenerateQR = async () => {
        const canvas = canvasRef.current
        if (!canvas) return

        setIsGeneratingQR(true)

        try {
            // 고유 ID 생성
            const uniqueId = `lifecut_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

            // 현재 결과물을 이미지로 변환
            const imageData = canvas.toDataURL('image/png')

            // 서버에 저장 (다른 기기에서도 접근 가능하도록)
            const result = await savePhotoToServer({
                id: uniqueId,
                imageData: imageData,
                timestamp: new Date().toISOString()
            })

            // 해시값 저장
            setPhotoHash(result.hash)

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

            // QR 코드 URL 생성 (배포된 도메인 + 해시값)
            // 로컬/배포 환경 상관없이 항상 배포된 주소로 연결하여 외부 접근 가능하게 함
            const deployUrl = 'https://christmas-liard-eight.vercel.app'
            const qrUrl = `${deployUrl}/result/${result.hash}`

            setQrModalOpen(true)
            
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

        } catch (error) {
            console.error('QR 코드 생성 실패:', error)
            const errorMessage = error.message || '알 수 없는 오류가 발생했습니다.'
            
            // 서버 연결 오류인 경우 더 명확한 안내
            if (errorMessage.includes('서버에 연결할 수 없습니다') || 
                errorMessage.includes('Failed to fetch') ||
                errorMessage.includes('NetworkError')) {
                alert(
                    '⚠️ 서버 연결 실패\n\n' +
                    'QR 코드 기능을 사용하려면 백엔드 서버가 실행되어 있어야 합니다.\n\n' +
                    '다음 명령어로 서버를 실행해주세요:\n' +
                    'npm run dev:server\n\n' +
                    '또는 프론트엔드와 백엔드를 동시에 실행:\n' +
                    'npm run dev:all'
                )
            } else {
                alert(`QR 코드 생성에 실패했습니다.\n\n오류: ${errorMessage}`)
            }
        } finally {
            setIsGeneratingQR(false)
        }
    }




    return (
        <div className="screen active">
            <div className="result-container">
                <h2>완성된 인생네컷</h2>
                <div className="result-image">
                    <canvas ref={canvasRef} id="resultCanvas" />
                </div>
                <div className="result-controls">
                    <button className="btn btn-primary" onClick={onSave}>
                        💾 저장하기
                    </button>
                    <button className="btn btn-secondary" onClick={handleDownload}>
                        📥 다운로드
                    </button>
                    <button 
                        className="btn btn-secondary" 
                        onClick={handleGenerateQR}
                        disabled={isGeneratingQR}
                    >
                        {isGeneratingQR ? '⏳ QR 생성 중...' : '📱 QR 생성'}
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
                            <p className="qr-url">{window.location.origin}/result/{photoHash}</p>
                            <p style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
                                💡 같은 네트워크에 연결된 기기에서 접근 가능합니다
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ResultScreen
