import { useState } from 'react'
import './SideMenu.css'

function SideMenu({ isOpen, onClose, savedPhotos }) {
    const handleImageClick = (photo) => {
        // 이미지 보기 팝업 표시 (추후 구현)
        console.log('이미지 클릭:', photo)
    }

    return (
        <>
            {isOpen && <div className="side-menu-overlay" onClick={onClose} />}
            <div className={`side-menu ${isOpen ? 'active' : ''}`}>
                <div className="side-menu-header">
                    <h2>저장된 인생네컷</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>
                <div className="gallery">
                    {savedPhotos.length === 0 ? (
                        <p className="empty-message">저장된 사진이 없습니다.</p>
                    ) : (
                        savedPhotos.slice().reverse().map((photo) => (
                            <div 
                                key={photo.id} 
                                className="gallery-item"
                                onClick={() => handleImageClick(photo)}
                            >
                                <img src={photo.data} alt="저장된 인생네컷" />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    )
}

export default SideMenu

