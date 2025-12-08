import { useState, useEffect, useRef } from 'react'
import { initDB, savePhotoToDB, loadPhotosFromDB } from '../lib/database'
import { frames } from '../lib/frames'
import FrameSelectScreen from '../components/FrameSelectScreen'
import PhotoSelectScreen from '../components/PhotoSelectScreen'
import ResultScreen from '../components/ResultScreen'
import SideMenu from '../components/common/SideMenu'
import Header from '../components/common/Header'
import './MainApp.css'

function MainApp() {
    const [currentScreen, setCurrentScreen] = useState('frameSelect')
    const [selectedFrame, setSelectedFrame] = useState(null)
    const [selectedPhotos, setSelectedPhotos] = useState([null, null, null, null])
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

    const handleFrameSelect = (frame) => {
        setSelectedFrame(frame)
        setCurrentScreen('photoSelect')
        // 사진 선택 초기화
        setSelectedPhotos([null, null, null, null])
        setPhotoTransforms([
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 }
        ])
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
        setCurrentScreen('frameSelect')
        setSelectedFrame(null)
        setSelectedPhotos([null, null, null, null])
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

