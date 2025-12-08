import { useEffect, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

// PDF.js Worker 설정
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const CACHE_VERSION = '3.0' // 버전 업데이트로 캐시 강제 갱신

// 캐시에서 이미지 가져오기 (모바일/PC 구분)
function getCachedImage(isMobile) {
    try {
        const cacheKey = isMobile ? 'pdf_background_cache_mobile' : 'pdf_background_cache_desktop'
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
            const { version, image, timestamp } = JSON.parse(cached)
            // 24시간 캐시 유효
            if (version === CACHE_VERSION && Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                return image
            }
        }
    } catch (e) {
        console.warn('캐시 읽기 실패:', e)
    }
    return null
}

// 이미지를 캐시에 저장 (모바일/PC 구분)
function setCachedImage(image, isMobile) {
    try {
        const cacheKey = isMobile ? 'pdf_background_cache_mobile' : 'pdf_background_cache_desktop'
        const cacheData = {
            version: CACHE_VERSION,
            image: image,
            timestamp: Date.now()
        }
        localStorage.setItem(cacheKey, JSON.stringify(cacheData))
    } catch (e) {
        console.warn('캐시 저장 실패:', e)
    }
}

// 모바일 기기 감지
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768)
}

export function usePdfBackground(pdfPath) {
    const [backgroundImage, setBackgroundImage] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let isMounted = true
        
        async function loadPdf() {
            try {
                if (!isMounted) return
                setLoading(true)
                setError(null)

                const isMobile = isMobileDevice()
                
                // 캐시에서 먼저 확인 (모바일/PC 구분)
                const cachedImage = getCachedImage(isMobile)
                if (cachedImage) {
                    if (!isMounted) return
                    setBackgroundImage(cachedImage)
                    setLoading(false)
                    return
                }
                
                // PDF 로드
                const loadingTask = pdfjsLib.getDocument({
                    url: pdfPath,
                    // 모바일에서는 메모리 최적화
                    disableAutoFetch: isMobile,
                    disableStream: isMobile
                })
                const pdf = await loadingTask.promise

                // 첫 페이지 가져오기
                const page = await pdf.getPage(1)
                
                // 화면 크기에 맞는 적절한 스케일 계산
                const screenWidth = window.innerWidth
                const screenHeight = window.innerHeight
                const pageViewport = page.getViewport({ scale: 1.0 })
                const pageWidth = pageViewport.width
                const pageHeight = pageViewport.height
                
                // 모바일과 PC에 따라 다른 렌더링 전략
                let canvasWidth, canvasHeight, viewport, cropX, cropY, cropWidth, cropHeight
                
                if (isMobile) {
                    // 모바일: 세로 화면에 맞춰 가운데 영역 자르기
                    const mobileAspect = screenHeight / screenWidth // 모바일은 세로가 길음
                    const pageAspect = pageHeight / pageWidth
                    
                    // 모바일 화면 비율에 맞게 PDF에서 가운데 영역 추출
                    if (pageAspect > mobileAspect) {
                        // PDF가 더 세로로 길면, 가로를 자름
                        cropHeight = pageHeight
                        cropWidth = pageHeight / mobileAspect
                        cropX = (pageWidth - cropWidth) / 2 // 가운데 정렬
                        cropY = 0
                    } else {
                        // PDF가 더 가로로 길면, 세로를 자름
                        cropWidth = pageWidth
                        cropHeight = pageWidth * mobileAspect
                        cropX = 0
                        cropY = (pageHeight - cropHeight) / 2 // 가운데 정렬
                    }
                    
                    // 모바일 화면 크기에 맞게 스케일 계산
                    const scaleX = screenWidth / cropWidth
                    const scaleY = screenHeight / cropHeight
                    const scale = Math.min(scaleX, scaleY) // 전체가 보이도록
                    
                    canvasWidth = screenWidth
                    canvasHeight = screenHeight
                    
                    // 자른 영역을 화면 크기로 렌더링
                    viewport = page.getViewport({ scale: scale * 1.5 }) // 고해상도
                } else {
                    // PC: 가로 화면에 맞춰 가운데 영역 자르기
                    const desktopAspect = screenWidth / screenHeight // PC는 가로가 길음
                    const pageAspect = pageWidth / pageHeight
                    
                    // PC 화면 비율에 맞게 PDF에서 가운데 영역 추출
                    if (pageAspect > desktopAspect) {
                        // PDF가 더 가로로 길면, 세로를 자름
                        cropWidth = pageWidth
                        cropHeight = pageWidth / desktopAspect
                        cropX = 0
                        cropY = (pageHeight - cropHeight) / 2 // 가운데 정렬
                    } else {
                        // PDF가 더 세로로 길면, 가로를 자름
                        cropHeight = pageHeight
                        cropWidth = pageHeight * desktopAspect
                        cropX = (pageWidth - cropWidth) / 2 // 가운데 정렬
                        cropY = 0
                    }
                    
                    // PC 화면 크기에 맞게 스케일 계산
                    const scaleX = screenWidth / cropWidth
                    const scaleY = screenHeight / cropHeight
                    const scale = Math.min(scaleX, scaleY) // 전체가 보이도록
                    
                    canvasWidth = screenWidth
                    canvasHeight = screenHeight
                    
                    // 자른 영역을 화면 크기로 렌더링
                    viewport = page.getViewport({ scale: scale * 2.0 }) // 고해상도
                }

                // 1단계: PDF를 고해상도로 임시 캔버스에 렌더링
                const tempScale = isMobile ? 2.0 : 3.0
                const tempViewport = page.getViewport({ scale: tempScale })
                const tempCanvas = document.createElement('canvas')
                const tempCtx = tempCanvas.getContext('2d')
                tempCanvas.width = tempViewport.width
                tempCanvas.height = tempViewport.height
                
                const tempRenderContext = {
                    canvasContext: tempCtx,
                    viewport: tempViewport
                }
                
                await page.render(tempRenderContext).promise
                
                // 2단계: 자른 영역을 추출
                const cropScale = tempScale
                const tempCropX = cropX * cropScale
                const tempCropY = cropY * cropScale
                const tempCropWidth = cropWidth * cropScale
                const tempCropHeight = cropHeight * cropScale
                
                // 3단계: 최종 캔버스에 자른 영역을 화면 크기에 맞게 렌더링
                const finalCanvas = document.createElement('canvas')
                const finalCtx = finalCanvas.getContext('2d')
                finalCanvas.width = canvasWidth
                finalCanvas.height = canvasHeight
                
                // 배경을 검은색으로 채우기
                finalCtx.fillStyle = '#000000'
                finalCtx.fillRect(0, 0, canvasWidth, canvasHeight)
                
                // 자른 영역을 화면 크기에 맞게 스케일링
                const finalScaleX = canvasWidth / cropWidth
                const finalScaleY = canvasHeight / cropHeight
                const finalScale = Math.min(finalScaleX, finalScaleY)
                
                const finalWidth = cropWidth * finalScale
                const finalHeight = cropHeight * finalScale
                const finalOffsetX = (canvasWidth - finalWidth) / 2
                const finalOffsetY = (canvasHeight - finalHeight) / 2
                
                // 임시 캔버스에서 자른 영역을 추출하여 최종 캔버스에 그리기
                finalCtx.drawImage(
                    tempCanvas,
                    tempCropX, tempCropY, tempCropWidth, tempCropHeight,
                    finalOffsetX, finalOffsetY, finalWidth, finalHeight
                )
                
                // 임시 캔버스 메모리 정리
                tempCanvas.width = 0
                tempCanvas.height = 0
                
                // 최종 캔버스를 사용
                const canvas = finalCanvas
                const context = finalCtx

                // Canvas를 이미지로 변환 (모바일에서는 더 낮은 품질)
                const quality = isMobile ? 0.75 : 0.85
                const imageData = canvas.toDataURL('image/jpeg', quality)
                
                // 메모리 정리
                canvas.width = 0
                canvas.height = 0
                
                if (!isMounted) return
                
                setBackgroundImage(imageData)
                setCachedImage(imageData, isMobile) // 캐시에 저장 (모바일/PC 구분)
                setLoading(false)
            } catch (err) {
                if (!isMounted) return
                
                console.error('PDF 로드 실패:', err)
                console.error('에러 상세:', {
                    message: err.message,
                    stack: err.stack,
                    pdfPath: pdfPath
                })
                setError(err)
                setLoading(false)
                // 에러 발생 시 기본 배경 사용
                setBackgroundImage(null)
            }
        }

        if (pdfPath) {
            loadPdf()
        }
        
        return () => {
            isMounted = false
        }
    }, [pdfPath])

    return { backgroundImage, loading, error }
}

