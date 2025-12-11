import { useState, useEffect } from 'react'
import { getAllPhotosFromServer } from '../../lib/api'
import './AdminPage.css'

function AdminPage() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [printQuantities, setPrintQuantities] = useState({}) // { photoId: quantity }

  // 사진 목록 로드
  const loadPhotos = async () => {
    try {
      setLoading(true)
      
      const loadedPhotos = await getAllPhotosFromServer()
      setPhotos(loadedPhotos || [])
      
      // 프린트 수량 초기화
      const quantities = {}
      loadedPhotos?.forEach(photo => {
        quantities[photo.id] = printQuantities[photo.id] || 1
      })
      setPrintQuantities(quantities)
    } catch (error) {
      console.error('사진 목록 로드 실패:', error)
      // alert('사진 목록을 불러오는데 실패했습니다: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPhotos()
    
    // 5초마다 자동 새로고침
    const interval = setInterval(loadPhotos, 5000)
    return () => clearInterval(interval)
  }, [])

  // 프린트 수량 변경
  const handleQuantityChange = (photoId, quantity) => {
    const num = parseInt(quantity) || 1
    setPrintQuantities(prev => ({
      ...prev,
      [photoId]: Math.max(1, Math.min(100, num)) // 1~100 사이로 제한
    }))
  }

  // 프린트 실행
  const handlePrint = async (photo) => {
    const quantity = printQuantities[photo.id] || 1
    
    if (!confirm(`인생네컷을 ${quantity}장 프린트하시겠습니까?`)) {
      return
    }

    try {
      // TODO: 실제 프린터 API 호출
      // 여기서는 시뮬레이션
      console.log('프린트 요청:', {
        photoId: photo.id,
        imageData: photo.data,
        quantity: quantity
      })

      alert(`✅ 프린트 요청이 전송되었습니다!\n\n수량: ${quantity}장`)
      
      // 실제 구현 시:
      // await printImage(photo.data, quantity)
    } catch (error) {
      console.error('프린트 실패:', error)
      alert('프린트에 실패했습니다: ' + error.message)
    }
  }

  // 사진 삭제
  const handleDelete = async (photo) => {
    if (!confirm('이 인생네컷을 삭제하시겠습니까? (서버에는 유지됨)')) {
      return
    }

    try {
        // 현재 서버 삭제 API가 없으므로 클라이언트 상태에서만 제거
        setPhotos(prev => prev.filter(p => p.id !== photo.id))
        alert('✅ 목록에서 제거되었습니다.')
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제에 실패했습니다: ' + error.message)
    }
  }

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString || '날짜 정보 없음'
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>저장된 인생네컷 관리</h1>
        <p className="admin-description">
          저장된 인생네컷을 확인하고 프린트할 수 있습니다.
        </p>
        <button className="btn-refresh" onClick={loadPhotos} disabled={loading}>
          {loading ? '로딩 중...' : '🔄 새로고침'}
        </button>
      </div>

      <div className="admin-content">
        {loading && photos.length === 0 ? (
          <div className="loading-message">
            <div className="loading-spinner"></div>
            <p>사진 목록을 불러오는 중...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="empty-message">
            <p>📷 저장된 사진이 없습니다.</p>
            <p>인생네컷을 만들고 저장하면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <div className="photos-grid">
            {photos.map((photo) => (
              <div key={photo.id} className="photo-card">
                <div className="photo-image">
                  <img 
                    src={photo.imageUrl ? (photo.imageUrl.startsWith('http') ? photo.imageUrl : `${import.meta.env.VITE_API_URL ? '' : 'http://localhost:3001'}${photo.imageUrl}`) : photo.data} 
                    alt="인생네컷"
                    loading="lazy"
                  />
                </div>
                <div className="photo-info">
                  <h3 className="photo-name">#{photo.id.slice(0, 8)}...</h3>
                  <p className="photo-date">
                    {formatDate(photo.timestamp)}
                  </p>
                </div>
                <div className="photo-actions">
                  <div className="print-controls">
                    <label>프린트 수량:</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={printQuantities[photo.id] || 1}
                      onChange={(e) => handleQuantityChange(photo.id, e.target.value)}
                      className="quantity-input"
                    />
                    <button
                      className="btn-print"
                      onClick={() => handlePrint(photo)}
                    >
                      🖨️ 프린트
                    </button>
                  </div>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(photo)}
                  >
                    🗑️ 삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPage
