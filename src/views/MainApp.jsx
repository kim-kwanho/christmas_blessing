import { useState, useEffect, useRef } from 'react'
import { initDB, savePhotoToDB, loadPhotosFromDB } from '../lib/database'
import { frames } from '../lib/frames'
import CameraScreen from '../components/CameraScreen'
import FrameSelectScreen from '../components/FrameSelectScreen'
import PhotoSelectScreen from '../components/PhotoSelectScreen'
import ResultScreen from '../components/ResultScreen'
import SideMenu from '../components/common/SideMenu'
import Header from '../components/common/Header'
import './MainApp.css'

function MainApp() {
    const [currentScreen, setCurrentScreen] = useState('camera') // 'camera'로 시작
    const [selectedPhotos, setSelectedPhotos] = useState([null, null, null, null]) // 촬영한 4장
    const [selectedFrame, setSelectedFrame] = useState(null)
    const [photoTransforms, setPhotoTransforms] = useState([
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 }
    ])
    const [savedPhotos, setSavedPhotos] = useState([])
    const [db, setDb] = useState(null)
    const [sideMenuOpen, setSideMenuOpen] = useState(false)

    // IndexedDB 초기화
    useEffect(() => {
        initDB()
            .then((database) => {
                setDb(database)
                return loadPhotosFromDB(database)
            })
            .then((photos) => {
                setSavedPhotos(photos)
            })
            .catch((error) => {
                console.error('IndexedDB 초기화 실패:', error)
            })
    }, [])

    // 촬영 완료 (4장)
    const handleCaptureComplete = (photos) => {
        if (photos && photos.length === 4) {
            // 촬영한 4장을 순서대로 selectedPhotos에 배치
            const newSelectedPhotos = [...photos]
            // 4장이 안 찍혔을 경우를 대비해 null로 채움
            while (newSelectedPhotos.length < 4) {
                newSelectedPhotos.push(null)
            }
            
            setSelectedPhotos(newSelectedPhotos.slice(0, 4))
            setSelectedFrame(frames[0]) // 기본 프레임 사용
            setPhotoTransforms([
                { x: 0, y: 0 },
                { x: 0, y: 0 },
                { x: 0, y: 0 },
                { x: 0, y: 0 }
            ])
            // 프레임 선택 화면을 거치지 않고 바로 사진 배치 화면으로
            setCurrentScreen('photoSelect')
        }
    }

    const handleFrameSelect = (frame) => {
        setSelectedFrame(frame)
        setCurrentScreen('photoSelect')
        // 사진 선택 초기화하지 않음 (이미 선택된 사진 유지)
    }

    const handlePhotoSelect = (index, photoSrc) => {
        const newPhotos = [...selectedPhotos]
        newPhotos[index] = photoSrc
        setSelectedPhotos(newPhotos)
    }

    const handlePhotoRemove = (index) => {
        const newPhotos = [...selectedPhotos]
        newPhotos[index] = null
        setSelectedPhotos(newPhotos)
        
        const newTransforms = [...photoTransforms]
        newTransforms[index] = { x: 0, y: 0 }
        setPhotoTransforms(newTransforms)
    }

    const handleCompose = () => {
        if (!selectedFrame || selectedPhotos.some(photo => !photo)) {
            alert('모든 사진을 선택해주세요.')
            return
        }
        setCurrentScreen('result')
    }

    const handleSave = async () => {
        if (!db) return
        
        try {
            const resultCanvas = document.getElementById('resultCanvas')
            if (!resultCanvas) return
            
            const imageData = resultCanvas.toDataURL('image/png')
            const photoData = {
                id: Date.now(),
                data: imageData,
                timestamp: new Date().toISOString()
            }
            
            await savePhotoToDB(db, photoData)
            setSavedPhotos([...savedPhotos, photoData])
            alert('인생네컷이 저장되었습니다! 📸')
        } catch (error) {
            console.error('저장 실패:', error)
            alert('저장 중 오류가 발생했습니다: ' + error.message)
        }
    }

    const handleNewPhoto = () => {
        // 처음부터 다시 시작
        setCurrentScreen('camera')
        setSelectedPhotos([null, null, null, null])
        setSelectedFrame(null)
        setPhotoTransforms([
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 }
        ])
    }

    return (
        <div className="main-container">
            <Header onMenuClick={() => setSideMenuOpen(true)} />
            <SideMenu 
                isOpen={sideMenuOpen}
                onClose={() => setSideMenuOpen(false)}
                savedPhotos={savedPhotos}
            />
            
            {currentScreen === 'camera' && (
                <CameraScreen 
                    onCaptureComplete={handleCaptureComplete}
                />
            )}

            {currentScreen === 'frameSelect' && (
                <FrameSelectScreen 
                    frames={frames}
                    onFrameSelect={handleFrameSelect}
                />
            )}
            
            {currentScreen === 'photoSelect' && selectedFrame && (
                <PhotoSelectScreen
                    frame={selectedFrame}
                    selectedPhotos={selectedPhotos}
                    photoTransforms={photoTransforms}
                    onPhotoSelect={handlePhotoSelect}
                    onPhotoRemove={handlePhotoRemove}
                    onPhotoTransformChange={(index, transform) => {
                        const newTransforms = [...photoTransforms]
                        newTransforms[index] = transform
                        setPhotoTransforms(newTransforms)
                    }}
                    onBack={() => setCurrentScreen('frameSelect')}
                    onCompose={handleCompose}
                    allowPhotoChange={false} // 후보지에서 선택한 사진은 변경 불가
                />
            )}
            
            {currentScreen === 'result' && selectedFrame && (
                <ResultScreen
                    frame={selectedFrame}
                    selectedPhotos={selectedPhotos}
                    photoTransforms={photoTransforms}
                    onSave={handleSave}
                    onNewPhoto={handleNewPhoto}
                />
            )}
        </div>
    )
}

export default MainApp

