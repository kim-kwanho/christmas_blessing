import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// 업로드 디렉토리 생성
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}

// 미들웨어
app.use(cors())
app.use(express.json())
app.use(express.static('dist')) // 빌드된 프론트엔드 파일 제공

// 메모리 스토리지 (Base64 이미지를 직접 처리)
const storage = multer.memoryStorage()
const upload = multer({ storage })

// 결과물 저장 API
app.post('/api/photos', async (req, res) => {
    try {
        const { id, imageData, timestamp } = req.body

        if (!id || !imageData) {
            return res.status(400).json({ error: 'id와 imageData가 필요합니다.' })
        }

        // Base64 이미지를 파일로 저장
        const base64Data = imageData.replace(/^data:image\/png;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        const filePath = path.join(uploadsDir, `${id}.png`)

        fs.writeFileSync(filePath, buffer)

        // 메타데이터 저장
        const metadata = {
            id,
            timestamp: timestamp || new Date().toISOString(),
            createdAt: new Date().toISOString()
        }
        const metadataPath = path.join(uploadsDir, `${id}.json`)
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))

        res.json({ success: true, id, message: '결과물이 저장되었습니다.' })
    } catch (error) {
        console.error('저장 실패:', error)
        res.status(500).json({ error: '저장 중 오류가 발생했습니다.' })
    }
})

// 결과물 조회 API
app.get('/api/photos/:id', (req, res) => {
    try {
        const { id } = req.params
        const filePath = path.join(uploadsDir, `${id}.png`)
        const metadataPath = path.join(uploadsDir, `${id}.json`)

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: '인생네컷을 찾을 수 없습니다.' })
        }

        // 이미지 파일 읽기
        const imageBuffer = fs.readFileSync(filePath)
        const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`

        // 메타데이터 읽기
        let metadata = {}
        if (fs.existsSync(metadataPath)) {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
        }

        res.json({
            success: true,
            id,
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
app.get('/api/photos', (req, res) => {
    try {
        const files = fs.readdirSync(uploadsDir)
        const photos = files
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const metadata = JSON.parse(fs.readFileSync(path.join(uploadsDir, file), 'utf8'))
                return {
                    id: metadata.id,
                    timestamp: metadata.timestamp,
                    createdAt: metadata.createdAt
                }
            })
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
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'))
    }
})

app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`)
    console.log(`http://localhost:${PORT}`)
})

