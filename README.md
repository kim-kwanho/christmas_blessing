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

```bash
npm run dev
# 또는
pnpm dev
```

3. **브라우저에서 접속**

개발 서버가 시작되면 터미널에 표시된 주소(일반적으로 `http://localhost:5173`)로 접속하세요.

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── common/         # 공통 컴포넌트 (Header, SideMenu)
│   ├── CameraScreen.jsx        # 카메라 촬영 화면
│   ├── FrameSelectScreen.jsx  # 프레임 선택 화면
│   ├── PhotoSelectScreen.jsx  # 사진 배치 화면
│   └── ResultScreen.jsx        # 결과 화면
├── views/              # 페이지별 뷰 컴포넌트
│   ├── MainApp.jsx     # 메인 앱
│   └── StartScreen.jsx # 시작 화면
├── pages/              # 페이지 컴포넌트
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
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

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
* **갤러리**: IndexedDB를 사용한 로컬 저장소에 저장된 인생네컷 관리

## 🎨 기술 스택

* **React 18** - UI 라이브러리
* **Vite** - 빌드 도구
* **React Router** - 라우팅
* **IndexedDB** - 로컬 데이터 저장
* **Canvas API** - 이미지 합성

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
