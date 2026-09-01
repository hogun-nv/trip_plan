# 뉴욕, 우리 둘의 7일 — Version 1

2026년 9월 뉴욕 부부 여행을 위한 사진 중심 에디토리얼 플래너입니다. 기존 `nyc-couple-trip-2026.html`은 수정하지 않았고, 이 폴더가 독립적인 Version 1 프로젝트입니다.

## 로컬에서 보기

```bash
npm install
npm run dev
```

브라우저에서 터미널에 표시된 주소를 엽니다.

## GitHub Pages로 바로 배포하기

1. GitHub에서 **빈 Public repository**를 하나 만듭니다. README, `.gitignore`, License는 GitHub에서 미리 추가하지 않는 편이 안전합니다.
2. 이 컴퓨터에서 GitHub에 push할 수 있도록 로그인되어 있어야 합니다. GitHub CLI까지 로그인되어 있으면 Pages 활성화와 첫 배포 완료 확인도 자동 처리합니다.
3. 이 폴더에서 아래 명령을 실행하고 repository URL을 붙여넣습니다.

```bash
npm run github:connect
```

또는 URL까지 한 번에 전달할 수 있습니다.

```bash
npm run github:connect -- https://github.com/OWNER/REPOSITORY.git
```

스크립트는 배포 전에 로컬 상태가 커밋되어 있는지, 대상이 Public인지, 저장소가 비어 있는지를 먼저 확인합니다. 검증을 통과하면 `origin`을 연결하고 `main`을 push한 뒤, 로그인된 GitHub CLI 또는 `GH_TOKEN` 권한으로 Pages 게시 방식을 **GitHub Actions**로 설정합니다. 이어서 첫 워크플로 완료와 실제 공개 URL까지 확인합니다. 일반적인 주소는 `https://OWNER.github.io/REPOSITORY/`입니다.

GitHub CLI가 설치되어 있지 않거나 저장소 관리 권한이 없는 환경에서는 코드 push까지 완료한 뒤 정확한 Pages 설정 링크를 표시합니다. 그 경우 링크에서 **Build and deployment → Source → GitHub Actions**를 한 번만 선택하고 워크플로를 다시 실행하면 됩니다.

GitHub CLI를 처음 사용하는 경우 먼저 아래 명령으로 로그인할 수 있습니다.

```bash
gh auth login
gh auth setup-git
```

배포 파일은 GitHub의 공식 custom workflow 구조를 따릅니다. 자세한 동작은 [GitHub Pages publishing source 문서](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)와 [Pages REST API 문서](https://docs.github.com/en/rest/pages/pages)에서 확인할 수 있습니다.

> 저장소에 기존 커밋이 있거나 로컬에 커밋되지 않은 파일이 있으면 아무것도 덮어쓰지 않고 중단합니다. 반드시 빈 저장소를 사용해 주세요.

## 주요 명령

- `npm run dev` — 개발 서버
- `npm run build` — 배포용 빌드
- `npm run preview` — 빌드 미리보기
- `npm run test:sites` — Sites 런타임 테스트
- `npm run data:refresh` — 기존 HTML에서 일정 데이터를 다시 추출

## 구성

- React + Vite
- Leaflet / OpenStreetMap
- Phosphor Icons
- GitHub Actions + GitHub Pages 자동 활성화 시도 및 배포
- Sites 호스팅 메타데이터도 유지
