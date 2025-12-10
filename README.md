# 크리스마스 인생네컷 앱

크리스마스 테마의 인생네컷(4컷 사진)을 만들 수 있는 웹 애플리케이션입니다.

## 🚀 시작하기

### 필수 요구사항

* Node.js 18.x 이상
* npm 또는 pnpm

### 설치 및 실행

1. **의존성 설치**

```bash
npm install
# 또는
pnpm install
```

2. **개발 서버 실행**

**옵션 1: 프론트엔드와 백엔드 동시 실행 (권장)**
```bash
npm run dev:all
# 또는
pnpm dev:all
```

**옵션 2: 개별 실행**
```bash
# 터미널 1: 프론트엔드 개발 서버
npm run dev

# 터미널 2: 백엔드 API 서버
npm run dev:server
```

3. **브라우저에서 접속**

- 프론트엔드: `http://localhost:8000` (또는 터미널에 표시된 주소)
- 백엔드 API: `http://localhost:3001/api`

**참고**: QR 코드 기능을 사용하려면 백엔드 서버가 실행되어 있어야 합니다.

## 📁 프로젝트 구조

```
├── server.js           # Express 백엔드 서버
├── uploads/            # 서버에 저장된 결과물 (자동 생성)
├── src/
│   ├── components/     # 재사용 가능한 컴포넌트
│   │   ├── common/     # 공통 컴포넌트 (Header, SideMenu)
│   │   ├── CameraScreen.jsx        # 카메라 촬영 화면
│   │   ├── FrameSelectScreen.jsx  # 프레임 선택 화면
│   │   ├── PhotoSelectScreen.jsx  # 사진 배치 화면
│   │   └── ResultScreen.jsx        # 결과 화면
│   ├── views/          # 페이지별 뷰 컴포넌트
│   │   ├── MainApp.jsx     # 메인 앱
│   │   └── StartScreen.jsx # 시작 화면
│   ├── pages/          # 페이지 컴포넌트
│   │   ├── admin/      # 관리자 페이지
│   │   └── ResultViewPage.jsx  # QR 코드로 접근하는 결과물 페이지
│   └── lib/            # 유틸리티 및 설정
│       ├── api.js      # 서버 API 호출 함수
│       ├── database.js # IndexedDB 로컬 저장소
│       └── frames.js   # 프레임 설정
│   └── admin/          # 관리자 페이지
├── lib/                # 유틸리티 및 설정
│   ├── database.js     # IndexedDB 관리
│   ├── frames.js       # 프레임 정의
│   └── styles/         # 공통 스타일
├── hooks/              # 커스텀 훅
├── assets/              # 정적 자산
│   └── images/         # 이미지 파일
├── App.jsx              # 라우터 설정
└── main.jsx             # 앱 진입점
```

## 🔧 개발 명령어

```bash
# 프론트엔드와 백엔드 동시 실행 (권장)
npm run dev:all

# 프론트엔드 개발 서버만 실행
npm run dev

# 백엔드 API 서버만 실행
npm run dev:server

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행 (빌드 후)
npm start

# 프로덕션 미리보기
npm run preview

# 코드 린팅
npm run lint
```

## ✨ 주요 기능

* **카메라 촬영**: 4장의 사진을 연속으로 촬영
* **프레임 선택**: 다양한 크리스마스 테마 프레임 선택
* **사진 배치**: 촬영한 사진을 프레임에 맞춰 배치 및 위치 조정
* **인생네컷 생성**: 프레임과 사진을 합성하여 인생네컷 생성
* **저장 및 다운로드**: 생성된 인생네컷을 저장하고 다운로드
* **QR 코드 생성**: 결과물에 대한 고유 QR 코드 생성 (다른 기기에서도 접근 가능)
* **갤러리**: IndexedDB를 사용한 로컬 저장소에 저장된 인생네컷 관리

## 🎨 기술 스택

* **React 18** - UI 라이브러리
* **Vite** - 빌드 도구
* **React Router** - 라우팅
* **Express** - 백엔드 API 서버
* **IndexedDB** - 로컬 데이터 저장
* **Canvas API** - 이미지 합성
* **QRCode** - QR 코드 생성

## 📱 모바일 지원

* 반응형 디자인으로 모바일과 데스크톱 모두 지원
* 카메라 기능은 HTTPS 또는 localhost에서만 작동합니다
* PWA 지원으로 홈 화면에 추가 가능

## 🔒 주의사항

* **카메라 권한**: 브라우저에서 카메라 접근 권한이 필요합니다
* **HTTPS 요구**: Safari/iOS에서는 HTTPS 또는 localhost에서만 카메라 접근이 가능합니다
* **브라우저 호환성**: Chrome, Edge, Firefox, Safari 최신 버전 권장

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
