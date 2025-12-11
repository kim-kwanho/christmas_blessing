import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPhotoFromServer } from '../lib/api'
import './ResultViewPage.css'

function ResultViewPage() {
    const { id: hash } = useParams() // URL의 :id 파라미터가 실제로는 hash값임
    const [photoData, setPhotoData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const loadPhoto = async () => {
            try {
                setLoading(true)
                
                // 서버에서 조회 시도 (해시 기반)
                const result = await getPhotoFromServer(hash)
                setPhotoData({
                    id: result.id,
                    data: result.data,
                    timestamp: result.timestamp
                })
            } catch (err) {
                console.error('사진 로드 실패:', err)
                setError('사진을 불러오는데 실패했습니다.')
            } finally {
                setLoading(false)
            }
        }

        if (hash) {
            loadPhoto()
        }
    }, [hash])

    const handleDownload = () => {
        if (!photoData) return

        const downloadFilename = `인생네컷_${photoData.id}.png`
        const link = document.createElement('a')
        link.download = downloadFilename
        link.href = photoData.data
        link.click()
    }

    if (loading) {
        return (
            <div className="result-view-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>인생네컷을 불러오는 중...</p>
                </div>
            </div>
        )
    }

    if (error || !photoData) {
        return (
            <div className="result-view-page">
                <div className="error-container">
                    <h2>❌ 오류</h2>
                    <p>{error || '인생네컷을 찾을 수 없습니다.'}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="result-view-page">
            <div className="result-view-container">
                <h1>인생네컷</h1>
                <div className="result-view-image">
                    <img src={photoData.data} alt="인생네컷" />
                </div>
                <div className="result-view-controls">
                    <button className="btn btn-primary" onClick={handleDownload}>
                        📥 다운로드
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ResultViewPage

