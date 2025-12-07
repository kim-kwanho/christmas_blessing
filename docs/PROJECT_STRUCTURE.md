# 프로젝트 구조

이 문서는 크리스마스 인생네컷 앱의 프로젝트 구조를 설명합니다.

## 📁 디렉토리 구조

```
christmas_blessing/
│
├── index.html                  # 메인 HTML 파일 (루트에 위치)
├── README.md                   # 프로젝트 소개 및 빠른 시작 가이드
├── .gitignore                  # Git 제외 파일 목록
│
├── src/                        # 소스 코드
│   ├── js/
│   │   └── app.js             # 메인 JavaScript 파일
│   │                          # - DOM 조작
│   │                          # - 프레임 관리
│   │                          # - 사진 합성
│   │                          # - IndexedDB 관리
│   │
│   ├── css/
│   │   └── styles.css         # 전체 스타일시트
│   │                          # - 반응형 디자인
│   │                          # - 애니메이션
│   │                          # - 테마 색상
│   │
│   └── assets/                # 정적 자산 (향후 확장)
│       └── (이미지, 아이콘 등)
│
├── public/                     # 정적 파일 (PWA, 매니페스트 등)
│   └── manifest.json          # PWA 매니페스트 파일
│                              # - 앱 이름, 아이콘 설정
│                              # - 설치 가능하도록 설정
│
├── frames/                     # 프레임 설정 파일
│   ├── frame-config.json      # 모든 프레임 설정 (메인 설정 파일)
│   ├── frame-1-yourself-film.json    # 개별 프레임 설정 (참고용)
│   ├── frame-2-merry-christmas.json  # 개별 프레임 설정 (참고용)
│   └── README.md              # 프레임 추가 가이드
│
├── scripts/                    # 개발 스크립트
│   └── run.bat                # 로컬 개발 서버 실행 스크립트 (Windows)
│
└── docs/                       # 문서
    ├── README.md              # 상세 문서 (이 디렉토리)
    └── PROJECT_STRUCTURE.md   # 프로젝트 구조 설명 (이 파일)
```

## 📄 주요 파일 설명

### index.html
- **위치**: 루트 디렉토리
- **역할**: 메인 HTML 파일
- **특징**: 
  - 모든 화면 구조 정의
  - 외부 리소스 참조 (CSS, JS, Manifest)

### src/js/app.js
- **위치**: `src/js/`
- **역할**: 모든 애플리케이션 로직
- **주요 기능**:
  - 프레임 데이터 동적 로드
  - 사진 선택 및 편집
  - 인생네컷 합성
  - IndexedDB를 통한 저장/로드
  - PWA 지원

### src/css/styles.css
- **위치**: `src/css/`
- **역할**: 전체 애플리케이션 스타일
- **특징**:
  - 모바일/데스크톱 반응형
  - 다크 모드 지원 (향후)
  - 애니메이션 효과

### frames/frame-config.json
- **위치**: `frames/`
- **역할**: 모든 프레임 설정
- **형식**: JSON 배열
- **내용**: 프레임 ID, 이름, 레이아웃, 슬롯 위치 등

### public/manifest.json
- **위치**: `public/`
- **역할**: PWA 매니페스트
- **내용**: 앱 이름, 아이콘, 테마 색상 등

## 🔄 파일 간 관계

```
index.html
  ├── 참조: src/css/styles.css
  ├── 참조: src/js/app.js
  └── 참조: public/manifest.json
       │
       └── app.js
            └── 로드: frames/frame-config.json
```

## 📦 폴더별 역할

### `/src`
모든 소스 코드가 담긴 폴더입니다.
- **js/**: JavaScript 파일
- **css/**: 스타일시트 파일
- **assets/**: 이미지, 아이콘 등 (향후 확장)

### `/public`
정적 파일이 담긴 폴더입니다.
- PWA 매니페스트
- 향후 favicon, 이미지 등 추가 가능

### `/frames`
프레임 설정 파일이 담긴 폴더입니다.
- 프레임 JSON 설정 파일
- 프레임 이미지 파일 (선택사항)
- 프레임 추가 가이드

### `/scripts`
개발 및 빌드 스크립트입니다.
- 로컬 개발 서버 실행
- 향후 빌드 스크립트 추가 가능

### `/docs`
프로젝트 문서입니다.
- README
- 개발 가이드
- API 문서 등

## 🚀 확장 가능성

이 구조는 향후 확장을 고려하여 설계되었습니다:

1. **컴포넌트 분리**: `src/js/`를 모듈로 분리 가능
2. **테스트 추가**: `tests/` 폴더 추가 가능
3. **빌드 시스템**: `build/` 폴더 및 빌드 스크립트 추가 가능
4. **다국어 지원**: `locales/` 폴더 추가 가능
5. **이미지 관리**: `src/assets/`에 이미지 파일 추가 가능

## 📝 참고

이 프로젝트 구조는 [hub_web 프로젝트](https://github.com/tech-hubworship/hub_web)의 구조를 참고하여 정리되었습니다.

