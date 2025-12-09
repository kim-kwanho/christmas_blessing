import { useState } from 'react'
import './PhotoCandidateScreen.css'

function PhotoCandidateScreen({ photos, onSelectComplete }) {
    const [selectedIndices, setSelectedIndices] = useState([])

    const handlePhotoClick = (index) => {
        if (selectedIndices.includes(index)) {
            // 이미 선택된 경우 제거
            setSelectedIndices(selectedIndices.filter(i => i !== index))
        } else {
            // 선택되지 않은 경우 추가 (최대 4장)
            if (selectedIndices.length < 4) {
                setSelectedIndices([...selectedIndices, index])
            } else {
                alert('최대 4장까지만 선택할 수 있습니다.')
            }
        }
    }

    const handleConfirm = () => {
        if (selectedIndices.length !== 4) {
            alert('정확히 4장을 선택해주세요.')
            return
        }

        // 선택한 순서대로 사진 배열 생성
        const selectedPhotos = selectedIndices.map(index => photos[index])
        onSelectComplete(selectedPhotos)
    }

    const handleRetake = () => {
        if (window.confirm('다시 촬영하시겠습니까? 현재 선택한 사진이 모두 사라집니다.')) {
            // MainApp에서 처리하도록 콜백 전달
            onSelectComplete(null) // null을 전달하면 다시 촬영
        }
    }

    return (
        <div className="photo-candidate-screen">
            <div className="candidate-container">
                <div className="candidate-header">
                    <h2>사진 선택</h2>
                    <p className="candidate-subtitle">
                        프레임에 사용할 4장을 선택해주세요
                        {selectedIndices.length > 0 && (
                            <span className="selected-count">
                                ({selectedIndices.length}/4 선택됨)
                            </span>
                        )}
                    </p>
                </div>

                <div className="candidate-grid">
                    {photos.map((photo, index) => {
                        const isSelected = selectedIndices.includes(index)
                        const selectionOrder = selectedIndices.indexOf(index) + 1

                        return (
                            <div
                                key={index}
                                className={`candidate-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => handlePhotoClick(index)}
                            >
                                <img 
                                    src={photo} 
                                    alt={`후보 ${index + 1}`}
                                    className="candidate-image"
                                />
                                {isSelected && (
                                    <div className="selection-badge">
                                        {selectionOrder}
                                    </div>
                                )}
                                <div className="candidate-overlay">
                                    {isSelected ? (
                                        <div className="selected-icon">✓</div>
                                    ) : (
                                        <div className="select-hint">클릭하여 선택</div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="candidate-controls">
                    <button 
                        className="btn btn-secondary"
                        onClick={handleRetake}
                    >
                        다시 촬영
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleConfirm}
                        disabled={selectedIndices.length !== 4}
                    >
                        선택 완료 ({selectedIndices.length}/4)
                    </button>
                </div>
            </div>
        </div>
    )
}

export default PhotoCandidateScreen

