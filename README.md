# 뉴욕, 우리 둘의 7일 — Version 3

2026년 9월 뉴욕 부부 여행을 위한 지도 중심 필드 가이드입니다. Version 1의 실제 여행 데이터와 기능을 그대로 유지하면서, 좌측 7일 챕터 레일·중앙 동선 지도·우측 현재/다음 일정·하단 장소 아틀라스로 화면을 다시 구성했습니다.

Version 1과 Version 2는 별도 폴더에 그대로 보존되며, 이 폴더는 독립적인 Version 3 프로젝트입니다. 기준 화면은 `?plan=classic&day=3`입니다.

## 로컬에서 보기

```bash
npm install
npm run dev
```

브라우저에서 터미널에 표시된 주소를 엽니다.

## GitHub Pages로 바로 배포하기

1. GitHub에서 README·License 없이 **빈 Public repository**를 만듭니다.
2. 이 폴더의 변경 내용을 검토한 뒤 `main` 브랜치에 커밋합니다.
3. 이 컴퓨터에서 GitHub에 로그인한 상태로 아래 명령을 실행하고 repository URL을 붙여넣습니다.

```bash
npm run github:connect
```

URL까지 한 번에 전달할 수도 있습니다.

```bash
npm run github:connect -- https://github.com/OWNER/REPOSITORY.git
```

연결 스크립트는 로컬 커밋, 빈 Public repository, push 권한을 먼저 확인합니다. 검증을 통과하면 `origin`을 연결하고 `main`을 push한 뒤 GitHub Pages의 GitHub Actions 배포를 활성화합니다. 일반적인 공개 주소는 `https://OWNER.github.io/REPOSITORY/`입니다.

GitHub CLI 또는 관리 권한이 없는 환경에서는 코드 push 후 표시되는 Pages 설정 링크에서 **Build and deployment → Source → GitHub Actions**를 한 번 선택하면 됩니다.

> 기존 커밋이 있는 원격 저장소나 커밋되지 않은 로컬 상태에서는 덮어쓰지 않고 중단합니다. 반드시 빈 Public repository를 사용해 주세요.

## 주요 명령

- `npm run dev` — 개발 서버
- `npm run build` — GitHub Pages와 Sites 호환 배포 빌드
- `npm run preview` — 빌드 결과 미리보기
- `npm run test:sites` — 번들된 Sites 런타임 확인
- `npm run data:refresh` — 원본 HTML에서 일정 데이터 다시 추출
- `npm run github:connect` — 빈 GitHub Public repository 연결·첫 배포

## 구성과 보존 범위

- React 19 + Vite
- Leaflet / OpenStreetMap 동선 지도
- Phosphor Icons
- 5개 플랜, 35일, 198개 일정의 canonical `trip-data.json`
- 날짜·도시·도착편 전환, 일정 펼치기, 지도 marker 동기화
- 예약 정보 복사, 완료·즐겨찾기, 여행 노트, 아틀라스, 테마, 인쇄
- query string과 Version 3 전용 localStorage 상태 보존
- GitHub Actions + GitHub Pages, Sites 호환 빌드 메타데이터

canonical 데이터 SHA-256: `685a440d4d4b09eb8350a80c49c4bf127747a59f6f7d20c0f1960ec02cefe84b`
