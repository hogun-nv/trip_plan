# 둘이서 천천히 — Version 2

2026년 9월 뉴욕 부부 여행을 사진의 흐름과 실제 현장 동선으로 읽는 **Cinematic City Diary**입니다. 기존 `nyc-couple-trip-2026.html`과 Version 1은 수정하지 않았습니다.

## 로컬에서 보기

```bash
npm install
npm run dev
```

## GitHub Pages에 연결하기

GitHub에서 README·License 없이 빈 Public repository를 만든 뒤 다음 명령에 remote URL만 전달합니다.

```bash
npm run github:connect -- https://github.com/OWNER/REPOSITORY.git
```

스크립트는 로컬 커밋 상태, public 여부, 빈 repository 여부를 검증한 뒤 `main`을 push합니다. GitHub CLI 또는 `GH_TOKEN`에 관리 권한이 있으면 Pages를 GitHub Actions 방식으로 활성화하고 첫 배포 완료까지 확인합니다. 자동 활성화 권한이 없으면 정확한 Pages 설정 링크를 표시합니다.

## 주요 명령

- `npm run dev` — 로컬 개발 서버
- `npm run build` — GitHub Pages와 Sites용 production build
- `npm run data:refresh` — 로컬 sibling 원본 HTML에서 canonical 데이터 다시 추출
- `npm run preview` — production build 미리보기
- `npm run test:sites` — Sites runtime package 검증
- `npm run github:connect -- URL` — 빈 Public GitHub repository 연결 및 배포

## 구성

- React + Vite
- Leaflet / OpenStreetMap
- Phosphor Icons
- GitHub Actions + GitHub Pages
- Sites-compatible worker와 hosting metadata

일정의 기준 데이터는 `src/data/trip-data.json`이며 5개 플랜, 35일, 198개 일정을 포함합니다.
