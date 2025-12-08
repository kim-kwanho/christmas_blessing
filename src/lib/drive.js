// Google Drive API 유틸리티

const DRIVE_FOLDER_ID = '1GjkPm11VD9-f2LiXJiOE1Lel3EXxGUep'

/**
 * Google Drive에 이미지 업로드
 * @param {string} imageData - Base64 인코딩된 이미지 데이터
 * @param {string} filename - 파일명
 * @returns {Promise<{success: boolean, fileId?: string, error?: string}>}
 */
export async function uploadToDrive(imageData, filename = null) {
  try {
    // Base64 데이터를 Blob으로 변환
    const base64Data = imageData.split(',')[1] || imageData
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'image/png' })

    // 파일명 생성
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const finalFilename = filename || `인생네컷_${timestamp}.png`

    // Vercel Serverless Function 호출
    const apiUrl = import.meta.env.VITE_DRIVE_API_URL || '/api/drive/upload'
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageData: imageData,
        filename: finalFilename,
        folderId: DRIVE_FOLDER_ID
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(errorData.message || 'Google Drive 업로드에 실패했습니다.')
    }

    const result = await response.json()
    return {
      success: true,
      fileId: result.fileId,
      fileUrl: result.fileUrl
    }
  } catch (error) {
    console.error('Google Drive 업로드 실패:', error)
    return {
      success: false,
      error: error.message || 'Google Drive 업로드에 실패했습니다.'
    }
  }
}

/**
 * Google Drive 업로드 (직접 API 호출 - OAuth 필요)
 * @param {string} imageData - Base64 인코딩된 이미지 데이터
 * @param {string} filename - 파일명
 * @returns {Promise<{success: boolean, fileId?: string, error?: string}>}
 */
export async function uploadToDriveDirect(imageData, filename = null) {
  try {
    // Google Drive API를 직접 호출하려면 OAuth 토큰이 필요합니다
    // 이 함수는 서버 사이드에서 사용하거나 OAuth 인증 후 사용해야 합니다
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const finalFilename = filename || `인생네컷_${timestamp}.png`

    // Base64를 Blob으로 변환
    const base64Data = imageData.split(',')[1] || imageData
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'image/png' })

    // Google Drive API 엔드포인트
    // 실제 구현은 서버 사이드에서 해야 합니다
    throw new Error('직접 업로드는 서버 사이드에서 구현해야 합니다.')
  } catch (error) {
    console.error('Google Drive 직접 업로드 실패:', error)
    return {
      success: false,
      error: error.message || 'Google Drive 업로드에 실패했습니다.'
    }
  }
}

