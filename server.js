import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import chokidar from 'chokidar'
import ptp from 'pdf-to-printer'
import axios from 'axios'
import sharp from 'sharp'
import PDFDocument from 'pdfkit'

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

// 프린트 API (Canon Selphy CP1300)
app.post('/api/print', async (req, res) => {
    try {
        const { imageUrl, quantity = 1, printerName } = req.body

        if (!imageUrl) {
            return res.status(400).json({ error: '이미지 URL이 필요합니다.' })
        }

        const printQuantity = parseInt(quantity) || 1
        if (printQuantity < 1 || printQuantity > 100) {
            return res.status(400).json({ error: '수량은 1~100 사이여야 합니다.' })
        }

        console.log(`프린트 요청: ${imageUrl}, 수량: ${printQuantity}`)

        // 1. 이미지 다운로드
        let imageBuffer
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            // 외부 URL (Supabase)
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' })
            imageBuffer = Buffer.from(response.data)
        } else {
            // 로컬 파일 경로
            const imagePath = path.join(__dirname, imageUrl.replace(/^\//, ''))
            if (!fs.existsSync(imagePath)) {
                return res.status(404).json({ error: '이미지를 찾을 수 없습니다.' })
            }
            imageBuffer = fs.readFileSync(imagePath)
        }

        // 2. 이미지를 PDF로 변환 (인생네컷 크기: 3:4 비율, 4x6 인치)
        // Selphy CP1300는 4x6 인치 포토 용지 사용
        const pdfPath = path.join(__dirname, 'temp', `print_${Date.now()}.pdf`)
        const tempDir = path.join(__dirname, 'temp')
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }

        // 이미지를 4x6 인치 크기로 리사이즈 (300 DPI 기준: 1200x1800 픽셀)
        const resizedImage = await sharp(imageBuffer)
            .resize(1200, 1800, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255 }
            })
            .png()
            .toBuffer()

        // PDF 생성 (간단한 방법: 이미지를 PDF로 변환)
        // pdfkit을 사용하거나, 더 간단하게는 이미지 파일을 직접 프린트
        // 여기서는 임시 이미지 파일을 만들고 pdf-to-printer가 처리하도록 함
        
        // 임시 이미지 파일 저장
        const tempImagePath = path.join(tempDir, `print_${Date.now()}.png`)
        fs.writeFileSync(tempImagePath, resizedImage)

        // 3. 프린터로 전송 (수량만큼 반복)
        const printer = printerName || 'Canon SELPHY CP1300' // 기본 프린터 이름
        
        try {
            // pdf-to-printer는 PDF만 지원하므로, 이미지를 PDF로 변환하거나
            // Windows의 경우 이미지 파일을 직접 프린트할 수 있습니다.
            // 여기서는 간단하게 Windows의 기본 프린터 명령어를 사용하거나
            // pdf-to-printer 대신 다른 방법을 사용해야 합니다.
            
            // Windows에서 이미지 프린트: PowerShell 또는 직접 프린터 드라이버 사용
            // 더 나은 방법: pdf-to-printer 대신 Windows의 기본 프린트 기능 사용
            
            // 임시로 이미지 파일을 PDF로 변환하는 대신, 
            // Windows의 기본 프린트 명령어를 사용하거나
            // pdf-to-printer의 대안으로 node-printer를 사용할 수 있습니다.
            
            // 여기서는 간단하게 이미지 파일을 PDF로 변환하는 대신
            // Windows의 print 명령어를 사용하거나, 
            // 더 나은 방법으로는 pdfkit을 사용하여 PDF를 생성합니다.
            
            // PDF 생성 (pdfkit 사용)
            const pdfDoc = new PDFDocument({ 
                size: [612, 792], // 4x6 인치 (72 DPI 기준)
                margin: 0
            })
            
            pdfDoc.pipe(fs.createWriteStream(pdfPath))
            pdfDoc.image(resizedImage, 0, 0, { width: 612, height: 792 })
            pdfDoc.end()

            // PDF 생성 완료 대기
            await new Promise((resolve) => {
                pdfDoc.on('end', resolve)
            })

            // 프린터로 전송 (수량만큼 반복)
            for (let i = 0; i < printQuantity; i++) {
                await ptp.print(pdfPath, {
                    printer: printer,
                    pages: '1'
                })
                console.log(`프린트 ${i + 1}/${printQuantity} 완료`)
                
                // 프린트 간 약간의 대기 (프린터가 처리할 시간)
                if (i < printQuantity - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000))
                }
            }

            // 임시 파일 정리
            setTimeout(() => {
                if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath)
                if (fs.existsSync(tempImagePath)) fs.unlinkSync(tempImagePath)
            }, 5000)

            res.json({ 
                success: true, 
                message: `${printQuantity}장이 프린트되었습니다.`,
                printed: printQuantity
            })

        } catch (printError) {
            console.error('프린트 오류:', printError)
            // 임시 파일 정리
            if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath)
            if (fs.existsSync(tempImagePath)) fs.unlinkSync(tempImagePath)
            
            throw printError
        }

    } catch (error) {
        console.error('프린트 API 오류:', error)
        res.status(500).json({ 
            error: '프린트 중 오류가 발생했습니다.',
            details: error.message 
        })
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
// Express 5 호환: 와일드카드 라우트는 app.use()로 처리
app.use((req, res, next) => {
    // API 경로나 정적 파일 경로가 아닌 경우에만 index.html 제공
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads') && !req.path.startsWith('/dist')) {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'))
    } else {
        next()
    }
})

app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`)
    console.log(`http://localhost:${PORT}`)
})
