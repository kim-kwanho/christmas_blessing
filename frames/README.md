# 프레임 추가 가이드

프레임을 추가하려면 `frame-config.json` 파일을 수정하세요.

## 📁 현재 구조

```
frames/
  ├── frame-config.json  (모든 프레임 설정이 여기에 있음)
  ├── frame-1-yourself-film.json  (개별 파일, 참고용)
  ├── frame-2-merry-christmas.json  (개별 파일, 참고용)
  └── [프레임 이미지 파일들]  (선택사항)
```

## 🎨 새 프레임 추가 방법

### 방법 1: frame-config.json 직접 수정 (권장)

1. `frames/frame-config.json` 파일을 엽니다
2. 배열에 새 프레임 객체를 추가합니다:

```json
{
  "id": 3,
  "name": "새 프레임 이름",
  "image": "frames/my-frame.png",
  "layout": {
    "slots": [
      { "x": 0.05, "y": 0.05, "width": 0.44, "height": 0.42 },
      { "x": 0.51, "y": 0.05, "width": 0.44, "height": 0.42 },
      { "x": 0.05, "y": 0.48, "width": 0.44, "height": 0.42 },
      { "x": 0.51, "y": 0.48, "width": 0.44, "height": 0.42 }
    ],
    "frameColor": "#DC143C",
    "frameWidth": 20,
    "slotColor": "#FFFFFF",
    "bottomText": "Merry Christmas",
    "title": "🎄"
  }
}
```

### 방법 2: 프레임 이미지 파일 사용

1. 프레임 이미지 파일을 `frames/` 폴더에 추가
   - 지원 형식: PNG, JPG, SVG
   - 권장 크기: 1200x1600px (3:4 비율)
   - 투명 배경 PNG 권장

2. `frame-config.json`에서 이미지 경로 지정:
```json
{
  "id": 3,
  "name": "크리스마스 프레임",
  "image": "frames/christmas-frame.png",
  "layout": { ... }
}
```

## 📝 설정 항목 설명

| 항목 | 설명 | 필수 |
|------|------|------|
| `id` | 프레임 고유 번호 (중복 불가) | ✅ |
| `name` | 프레임 표시 이름 | ✅ |
| `image` | 프레임 이미지 파일 경로 (null이면 Canvas로 그려짐) | ❌ |
| `layout.slots` | 4개의 사진 슬롯 위치 및 크기 | ✅ |
| `layout.frameColor` | 프레임 테두리 색상 (HEX) | ❌ |
| `layout.frameWidth` | 프레임 테두리 두께 | ❌ |
| `layout.slotColor` | 슬롯 배경 색상 (HEX) | ❌ |
| `layout.bottomText` | 하단 텍스트 | ❌ |
| `layout.title` | 상단 제목 | ❌ |

### 슬롯 좌표 설명

- `x`, `y`: 슬롯의 시작 위치 (0.0 ~ 1.0 비율, 좌상단 기준)
- `width`, `height`: 슬롯의 크기 (0.0 ~ 1.0 비율)
- **반드시 4개의 슬롯을 정의**해야 합니다

예시 (2x2 그리드):
```json
"slots": [
  { "x": 0.05, "y": 0.05, "width": 0.44, "height": 0.42 },  // 좌상
  { "x": 0.51, "y": 0.05, "width": 0.44, "height": 0.42 },  // 우상
  { "x": 0.05, "y": 0.48, "width": 0.44, "height": 0.42 },  // 좌하
  { "x": 0.51, "y": 0.48, "width": 0.44, "height": 0.42 }   // 우하
]
```

## 🚀 배포

1. `frame-config.json` 파일 수정
2. 프레임 이미지 파일이 있다면 `frames/` 폴더에 추가
3. Git에 커밋하고 Push
4. Vercel에 배포하면 자동으로 반영됩니다!

## 💡 팁

- 프레임 이미지 파일 이름은 영어와 숫자만 사용하세요
- 이미지 파일 크기는 최적화하여 로딩 속도를 빠르게 유지하세요
- 투명 배경 PNG 파일을 사용하면 더 자연스러운 프레임을 만들 수 있습니다
