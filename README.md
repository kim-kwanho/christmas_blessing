# 크리스마스 인생네컷 앱 🎄

갤러리에서 사진을 선택하여 인생네컷 프레임에 배치하는 웹 애플리케이션입니다.

## 📁 프로젝트 구조

```
christmas_blessing/
├── index.html              # 메인 HTML 파일
├── README.md               # 프로젝트 소개 (이 파일)
├── .gitignore             # Git 제외 파일 목록
│
├── src/                    # 소스 코드
│   ├── js/
│   │   └── app.js         # 메인 JavaScript 파일
│   ├── css/
│   │   └── styles.css     # 스타일시트
│   └── assets/            # 이미지, 아이콘 등 (향후 확장)
│
├── public/                 # 정적 파일
│   └── manifest.json      # PWA 매니페스트
│
├── frames/                 # 프레임 설정 파일
│   ├── frame-config.json  # 프레임 설정 파일
│   ├── frame-1-yourself-film.json
│   ├── frame-2-merry-christmas.json
│   └── README.md          # 프레임 추가 가이드
│
├── scripts/                # 개발 스크립트
│   └── run.bat            # 로컬 서버 실행 스크립트
│
└── docs/                   # 문서
    └── README.md          # 상세 문서
```

## 🚀 실행 방법

### 방법 1: 배치 파일 사용 (Windows) - 추천

1. `scripts/run.bat` 파일을 더블클릭
2. 서버가 시작되면 화면에 표시된 주소로 접속
   - 로컬: `http://localhost:8000/index.html`
   - 모바일: `http://[컴퓨터IP]:8000/index.html`

### 방법 2: 수동 실행

1. PowerShell이나 명령 프롬프트를 이 폴더에서 열기
2. 다음 명령어 실행 (모바일 접속 가능):
   ```bash
   python -m http.server 8000 --bind 0.0.0.0
   ```
3. 브라우저에서 `http://localhost:8000` 접속

### 방법 3: iPhone에 앱 설치하기 (PWA) ⭐ 추천

1. 컴퓨터와 iPhone이 **같은 Wi-Fi 네트워크**에 연결되어 있는지 확인
2. `scripts/run.bat`를 실행하면 화면에 표시된 IP 주소 확인 (예: `172.30.1.96`)
3. iPhone의 Safari에서 다음 주소로 접속:
   - 메인 앱: `http://172.30.1.96:8000/index.html`
4. Safari 하단의 **공유 버튼(□↑)** 탭
5. **"홈 화면에 추가"** 선택
6. 앱 이름 확인 후 **"추가"** 탭
7. 홈 화면에 앱 아이콘이 생성됨! 🎉
8. 홈 화면의 앱 아이콘을 탭하여 실행

### 방법 4: 직접 파일 열기 (테스트용)

- `index.html` 파일을 브라우저로 직접 드래그앤드롭
- 단, 카메라 기능은 localhost 또는 네트워크 서버에서만 작동합니다

## ✨ 기능

- ✅ 프레임 선택 (현재 2가지 프레임)
- ✅ 갤러리에서 사진 선택 (4장)
- ✅ 인생네컷 자동 합성
- ✅ 결과물 저장 및 다운로드
- ✅ 저장된 인생네컷 갤러리
- ✅ PWA 지원 (앱처럼 설치 가능)
- ✅ 반응형 디자인 (모바일/데스크톱 지원)

## 📦 배포

### Vercel 배포 (권장)

1. GitHub 저장소에 Push
2. [Vercel](https://vercel.com)에서 GitHub 저장소 연결
3. 자동 배포 완료!

배포 후 24시간 언제든 접속 가능하며, HTTPS가 자동으로 적용됩니다.

## 🎨 프레임 추가하기

새 프레임을 추가하려면 `frames/` 폴더의 `frame-config.json` 파일을 수정하거나, 프레임 이미지 파일을 추가할 수 있습니다.

자세한 내용은 [frames/README.md](frames/README.md)를 참조하세요.

## 📝 주의사항

- Chrome, Edge, Firefox, Safari 최신 버전 권장
- 모바일에서 접속 시 컴퓨터와 같은 Wi-Fi 네트워크에 연결되어 있어야 합니다
- Windows 방화벽에서 Python 허용이 필요할 수 있습니다
- 사진은 브라우저의 파일 선택 기능을 통해 갤러리에서 선택합니다

## 🔗 링크

- GitHub 저장소: [kim-kwanho/christmas_blessing](https://github.com/kim-kwanho/christmas_blessing)
- 배포 URL: (Vercel 배포 후 추가)

## 📄 라이선스

MIT License

---

**크리스마스 인생네컷 앱** | 2024
