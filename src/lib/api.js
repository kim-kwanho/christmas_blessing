// API 기본 URL 설정
// 개발 환경에서는 Vite 프록시를 통해 /api로 접근
// 프로덕션에서는 환경 변수 또는 현재 도메인 사용
const getApiBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL
    }
    // 개발 환경에서는 프록시 사용
    if (import.meta.env.DEV) {
        return '/api'
    }
    // 프로덕션에서는 현재 도메인 사용
    return `${window.location.origin}/api`
}

const API_BASE_URL = getApiBaseUrl()

// 결과물 저장
export async function savePhotoToServer(photoData) {
    try {
        const response = await fetch(`${API_BASE_URL}/photos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(photoData)
        })

        if (!response.ok) {
            let errorMessage = '저장에 실패했습니다.'
            try {
                const error = await response.json()
                errorMessage = error.error || errorMessage
            } catch (e) {
                // JSON 파싱 실패 시 기본 메시지 사용
                if (response.status === 500) {
                    errorMessage = '서버 오류가 발생했습니다. 서버가 실행 중인지 확인해주세요.'
                } else if (response.status === 404) {
                    errorMessage = '서버를 찾을 수 없습니다. 서버가 실행 중인지 확인해주세요.'
                }
            }
            throw new Error(errorMessage)
        }

        return await response.json()
    } catch (error) {
        console.error('서버 저장 실패:', error)
        // 네트워크 오류인 경우 더 명확한 메시지 제공
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.\n\n터미널에서 "npm run dev:server" 명령어로 서버를 실행해주세요.')
        }
        throw error
    }
}

// 결과물 조회
export async function getPhotoFromServer(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/photos/${id}`)

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('인생네컷을 찾을 수 없습니다.')
            }
            const error = await response.json()
            throw new Error(error.error || '조회에 실패했습니다.')
        }

        return await response.json()
    } catch (error) {
        console.error('서버 조회 실패:', error)
        throw error
    }
}

// 모든 결과물 목록 조회 (관리자용)
export async function getAllPhotosFromServer() {
    try {
        const response = await fetch(`${API_BASE_URL}/photos`)

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || '목록 조회에 실패했습니다.')
        }

        return await response.json()
    } catch (error) {
        console.error('목록 조회 실패:', error)
        throw error
    }
}

