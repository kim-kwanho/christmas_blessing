import { supabase } from './supabase'

// Base64 데이터를 Blob으로 변환하는 헬퍼 함수
const base64ToBlob = (base64) => {
    const parts = base64.split(';base64,')
    const contentType = parts[0].split(':')[1]
    const raw = window.atob(parts[1])
    const rawLength = raw.length
    const uInt8Array = new Uint8Array(rawLength)

    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i)
    }

    return new Blob([uInt8Array], { type: contentType })
}

// 고유 해시 생성 (간단한 버전)
const createHash = (id) => {
    // Web Crypto API 사용 (브라우저 내장)
    // 여기서는 간단하게 id 자체를 해시처럼 사용하거나 랜덤 문자열 사용
    return id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15)
}

// 결과물 저장 (Supabase Storage 사용)
export async function savePhotoToServer(photoData) {
    try {
        const { id, imageData, timestamp } = photoData
        
        // 1. 해시(폴더명) 생성 - id 기반
        const hash = id 

        // 2. 이미지 Blob 변환
        const imageBlob = base64ToBlob(imageData)

        // 3. 이미지 업로드 (photos 버킷)
        const { error: imageError } = await supabase.storage
            .from('photos')
            .upload(`${hash}/photo.png`, imageBlob, {
                contentType: 'image/png',
                upsert: true
            })

        if (imageError) throw imageError

        // 4. 메타데이터 생성 및 업로드
        const metadata = {
            id,
            hash,
            timestamp: timestamp || new Date().toISOString(),
            createdAt: new Date().toISOString()
        }
        
        const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' })

        const { error: metaError } = await supabase.storage
            .from('photos')
            .upload(`${hash}/meta.json`, metadataBlob, {
                contentType: 'application/json',
                upsert: true
            })

        if (metaError) throw metaError

        return {
            success: true,
            id,
            hash,
            message: '결과물이 Supabase에 안전하게 저장되었습니다.'
        }

    } catch (error) {
        console.error('Supabase 저장 실패:', error)
        throw new Error(`저장 실패: ${error.message}`)
    }
}

// 결과물 조회
export async function getPhotoFromServer(hash) {
    try {
        // 1. 메타데이터 다운로드
        const { data: metaData, error: metaError } = await supabase.storage
            .from('photos')
            .download(`${hash}/meta.json`)

        if (metaError) throw new Error('메타데이터를 찾을 수 없습니다.')

        const metaText = await metaData.text()
        const metadata = JSON.parse(metaText)

        // 2. 이미지 Public URL 가져오기
        const { data: publicUrlData } = supabase.storage
            .from('photos')
            .getPublicUrl(`${hash}/photo.png`)

        // 3. 이미지 데이터(Base64)가 필요한 경우 다운로드해서 변환 (선택적)
        // 여기서는 URL만 반환하거나, 기존 로직 호환성을 위해 Base64로 변환할 수도 있음
        // 기존 컴포넌트 호환성을 위해 Base64로 변환해서 반환
        
        const { data: imageData, error: imageError } = await supabase.storage
            .from('photos')
            .download(`${hash}/photo.png`)
            
        if (imageError) throw new Error('이미지를 찾을 수 없습니다.')

        const imageBuffer = await imageData.arrayBuffer()
        const base64 = btoa(
            new Uint8Array(imageBuffer)
                .reduce((data, byte) => data + String.fromCharCode(byte), '')
        )
        const base64Image = `data:image/png;base64,${base64}`

        return {
            success: true,
            id: metadata.id,
            hash: metadata.hash,
            data: base64Image,
            timestamp: metadata.timestamp,
            createdAt: metadata.createdAt,
            imageUrl: publicUrlData.publicUrl // 추가 필드
        }

    } catch (error) {
        console.error('Supabase 조회 실패:', error)
        throw error
    }
}

// 모든 결과물 목록 조회 (관리자용) - Storage 스캔 방식
export async function getAllPhotosFromServer() {
    try {
        // 1. Storage 'photos' 버킷의 루트 목록 조회 (폴더명 = hash)
        const { data: list, error } = await supabase.storage
            .from('photos')
            .list()

        if (error) throw error

        // 2. 각 폴더(해시)에 대해 메타데이터와 이미지 URL 가져오기
        // 중복 제거: Set을 사용하여 이미 처리한 해시는 건너뜀
        const processedHashes = new Set()
        
        const photosPromises = list
            .filter(item => !item.name.startsWith('.')) // 숨김 파일/폴더 제외
            .filter(item => {
                // 해시(폴더명) 중복 체크
                if (processedHashes.has(item.name)) return false
                processedHashes.add(item.name)
                return true
            })
            .map(async (folder) => {
                try {
                    const hash = folder.name
                    
                    // 2-1. 메타데이터 다운로드
                    const { data: metaData, error: metaError } = await supabase.storage
                        .from('photos')
                        .download(`${hash}/meta.json`)
                    
                    let metadata = {}
                    if (!metaError) {
                        const metaText = await metaData.text()
                        metadata = JSON.parse(metaText)
                    }

                    // 2-2. 이미지 Public URL
                    const { data: publicUrlData } = supabase.storage
                        .from('photos')
                        .getPublicUrl(`${hash}/photo.png`)

                    return {
                        id: metadata.id || hash,
                        hash: hash,
                        data: publicUrlData.publicUrl, 
                        timestamp: metadata.timestamp || folder.created_at,
                        createdAt: metadata.createdAt || folder.created_at
                    }
                } catch (e) {
                    console.warn(`폴더 ${folder.name} 처리 실패:`, e)
                    return null
                }
            })

        const photos = (await Promise.all(photosPromises))
            .filter(p => p !== null)
            // 최신순 정렬
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        return photos
    } catch (error) {
        console.error('목록 조회 실패:', error)
        return []
    }
}

// 프린트 요청
export async function printPhoto(imageUrl, quantity = 1, printerName = null) {
    try {
        const response = await fetch('http://localhost:3001/api/print', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                imageUrl,
                quantity,
                printerName
            })
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || '프린트에 실패했습니다.')
        }

        return await response.json()
    } catch (error) {
        console.error('프린트 요청 실패:', error)
        throw error
    }
}

// 결과물 삭제 (Supabase Storage에서 폴더 전체 삭제)
export async function deletePhotoFromServer(hash) {
    try {
        // 1. 폴더 내 모든 파일 목록 조회
        const { data: files, error: listError } = await supabase.storage
            .from('photos')
            .list(hash)

        if (listError) throw listError

        // 2. 폴더 내 모든 파일 삭제
        if (files && files.length > 0) {
            const filePaths = files.map(file => `${hash}/${file.name}`)
            
            const { error: deleteError } = await supabase.storage
                .from('photos')
                .remove(filePaths)

            if (deleteError) throw deleteError
        }

        return { success: true, message: '삭제되었습니다.' }
    } catch (error) {
        console.error('Supabase 삭제 실패:', error)
        throw new Error(`삭제 실패: ${error.message}`)
    }
}
