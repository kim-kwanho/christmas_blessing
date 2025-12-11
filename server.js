import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import chokidar from 'chokidar'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// 업로드 디렉토리 생성
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}

// 폴더명 해시 생성 함수
function createHash(id) {
    return crypto.createHash('sha256').update(id).digest('hex').slice(0, 15)
}

// 폴더 감지 (chokidar)
const watcher = chokidar.watch(uploadsDir, {
    persistent: true,
    ignoreInitial: true,
    depth: 1
})

watcher
    .on('addDir', path => console.log(`새로운 폴더(해시) 감지: ${path}`))
    .on('add', path => console.log(`새로운 파일 감지: ${path}`))

// 미들웨어
app.use(cors())
app.use(express.json({ limit: '100mb' })) // 이미지 용량 제한 증가 (100mb)
app.use(express.urlencoded({ limit: '100mb', extended: true })) // URL 인코딩 제한도 증가
app.use(express.static('dist')) // 빌드된 프론트엔드 파일 제공

// 정적 파일 제공 (해시된 폴더 접근용) - /uploads/해시값/image.png 형태로 접근 가능
app.use('/uploads', express.static(uploadsDir))

// 결과물 저장 API
app.post('/api/photos', async (req, res) => {
    try {
        const { id, imageData, timestamp } = req.body

        if (!id || !imageData) {
            return res.status(400).json({ error: 'id와 imageData가 필요합니다.' })
        }

        // 1. 보안을 위한 해시 폴더명 생성
        const hash = createHash(id)
        const userDir = path.join(uploadsDir, hash)

        // 2. 해시 폴더 생성
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true })
        }

        // 3. 이미지 저장
        const base64Data = imageData.replace(/^data:image\/png;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        const imagePath = path.join(userDir, 'photo.png')
        fs.writeFileSync(imagePath, buffer)

        // 4. 메타데이터 저장
        const metadata = {
            id,
            hash,
            timestamp: timestamp || new Date().toISOString(),
            createdAt: new Date().toISOString()
        }
        const metadataPath = path.join(userDir, 'meta.json')
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))

        console.log(`저장 완료: ${id} -> ${hash}`)

        res.json({ 
            success: true, 
            id, 
            hash,
            message: '결과물이 안전하게 저장되었습니다.' 
        })
    } catch (error) {
        console.error('저장 실패:', error)
        res.status(500).json({ error: '저장 중 오류가 발생했습니다.' })
    }
})

// 결과물 조회 API (해시 기반)
app.get('/api/photos/:hash', (req, res) => {
    try {
        const { hash } = req.params
        const userDir = path.join(uploadsDir, hash)
        const imagePath = path.join(userDir, 'photo.png')
        const metadataPath = path.join(userDir, 'meta.json')

        if (!fs.existsSync(imagePath) || !fs.existsSync(metadataPath)) {
            return res.status(404).json({ error: '인생네컷을 찾을 수 없습니다.' })
        }

        // 이미지 파일 읽기
        const imageBuffer = fs.readFileSync(imagePath)
        const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))

        res.json({
            success: true,
            id: metadata.id,
            hash: metadata.hash,
            data: base64Image,
            timestamp: metadata.timestamp,
            createdAt: metadata.createdAt
        })
    } catch (error) {
        console.error('조회 실패:', error)
        res.status(500).json({ error: '조회 중 오류가 발생했습니다.' })
    }
})

// 모든 결과물 목록 조회 API (관리자용)
app.get('/api/admin/photos', (req, res) => {
    try {
        // uploads 폴더 내의 모든 하위 폴더(해시) 검색
        const dirs = fs.readdirSync(uploadsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)

        const photos = dirs.map(hash => {
            const metadataPath = path.join(uploadsDir, hash, 'meta.json')
            if (fs.existsSync(metadataPath)) {
                try {
                    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
                    return {
                        ...metadata,
                        imageUrl: `/uploads/${hash}/photo.png` // 정적 파일 경로
                    }
                } catch (e) {
                    return null
                }
            }
            return null
        }).filter(p => p !== null)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        res.json({ success: true, photos })
    } catch (error) {
        console.error('목록 조회 실패:', error)
        res.status(500).json({ error: '목록 조회 중 오류가 발생했습니다.' })
    }
})

// 모든 라우트를 index.html로 리다이렉트 (SPA 라우팅 지원)
app.get('*', (req, res) => {
    // API 경로가 아닌 경우에만 index.html 제공
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'))
    }
})

app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`)
    console.log(`http://localhost:${PORT}`)
})
