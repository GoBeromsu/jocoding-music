# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 해커톤 컨텍스트

**대회**: 조코딩 X OpenAI X Primer AI 해커톤
**주제**: OpenAI API를 활용한 비즈니스 가치 있는 프로덕트
**예선 마감**: 02.20(금) 23:59 — 시간이 촉박하다. 빠른 구현이 최우선.

**프로덕트 목표**: 좋아하는 노래 URL(YouTube 등)을 입력하면 오디오를 가져오고, OpenAI 에이전트가 실시간 웹 검색으로 ① 부른 가수 ② 원곡 아티스트(커버곡 여부) ③ 타 플랫폼(Spotify, Apple Music, MelOn 등) 링크를 자동 수집해주는 뮤직 플레이어.

**핵심 비즈니스 서사** (`docs/5whys.md` 참고):
> "플레이리스트만 듣다가 자기 취향을 잃어버린 지식 노동자를 위한, 방해 없는 로컬 뮤직 에이전트 — URL 하나로 노래를 소유하고, AI가 내 취향을 기억한다."
- 타겟: 딥워크 중 플리를 찾아 헤매는 지식 노동자
- 수익: 크레딧 기반 AI 취향 분석 (Free + Credits)
- 데모 훅: "유튜브 플리에서 좋아하는 노래 발견했는데 나중에 못 찾은 적 있죠?"

**심사 배점 (총 30점)**

| 항목 | 배점 |
|---|---|
| 시장성 / 사업성 | 10 |
| 차별성 / 독창성 | 5 |
| 개발 완성도 | 5 |
| AI 활용도 | 5 |
| UI/UX + 심미성 | 5 |

기획(비즈니스 가치)이 절반. 기능이 100% 완성되지 않아도 작동하는 데모와 비즈니스 서사가 더 중요하다.

---

## Commands

```bash
pnpm dev          # Vite + Electron dev server (hot reload)
pnpm build        # tsc 타입 체크 + Vite 프로덕션 빌드
pnpm typecheck    # 타입 체크만 (빠른 검증용)
pnpm dist:mac     # macOS .dmg 패키징
```

---

## 현재 아키텍처

Electron 두 프로세스 구조. 모든 통신은 IPC로만.

### Main process (`electron/`)

Node.js 환경, 파일시스템 전체 접근 가능.

- **`main.ts`** — 앱 진입점. `music://` 커스텀 프로토콜 등록(샌드박스 렌더러에서 로컬 오디오 파일 스트리밍용), `libraryStore.init()` + `registerAllHandlers()` 호출.
- **`lib/library-store.ts`** — Eagle-style 파일 기반 라이브러리 store. **SQLite/`better-sqlite3` 미사용**. 앱 시작 시 `userData/library/tracks/*.info/metadata.json` 전체를 메모리 Map에 로드.
  - 구조: `userData/library/metadata.json` + `tracks/<id>.info/metadata.json`
  - Track ID: `Date.now().toString(36).toUpperCase() + randomBytes(3).hex` (13자)
  - `upsert()` = 메모리 + 디스크 동기 쓰기, `softDelete()` = `isDeleted: true`
  - 임포트 오디오: `tracks/<id>.info/audio.<ext>` (URL에서 다운로드)
  - 로컬 스캔 트랙: `filePath`로 원본 경로만 참조
- **`ipc/`** — 도메인별 파일(`library.ts`, `player.ts`, `url-import.ts`, `obsidian.ts`). 각각 `register*Handlers()`를 export하고 `index.ts`에서 통합 등록. **새 IPC 도메인 추가 시 파일 생성 → `index.ts`에 추가.**

### Renderer process (`src/`)

샌드박스 BrowserWindow(`contextIsolation: true`, `nodeIntegration: false`). Node API 직접 접근 불가.

- **`types/index.ts`** — 공유 타입(`Track`, `Album`, `Artist`) + `window.musicApp` 전역 타입 선언. **새 IPC 채널 추가 시 반드시 여기에 타입 추가.**
  - `Track.id`는 `string` (기존 `number` 아님)
  - `Album`, `Artist`는 id 없음 — `libraryStore.getAll()` 결과를 groupBy로 파생
- **`store/playerStore.ts`** — 재생 상태/큐. `prev()`는 3초 이상 재생됐으면 현재 곡 재시작.
- **`store/libraryStore.ts`** — 트랙/앨범/아티스트 데이터, 검색, 스캔 진행률, 활성 뷰. 앨범/아티스트는 IPC 별도 콜 없이 `tracks` 배열에서 groupBy로 파생.
  - `selectedAlbumTitle: string | null` (기존 `selectedAlbumId: number | null`)
  - `selectedArtistName: string | null` (기존 `selectedArtistId: number | null`)
- **`store/themeStore.ts`** — `preference: 'system' | 'dark' | 'light'` + `resolved: 'dark' | 'light'`. 기본값 `'system'` (OS 테마 자동 감지). `localStorage` 키: `theme-preference`.
- **`components/layout/`** — `Sidebar`(내비 + 폴더 스캔), `MainContent`(트랙 목록/앨범/아티스트 + 검색), `PlayerBar`(오디오 컨트롤).
- **`components/SettingsDialog.tsx`** — System/Dark/Light 테마 선택 설정 창. Sidebar 하단 "Settings" 버튼으로 열림.

### IPC 브릿지 (`electron/preload.cts`)

`.cts` → `.cjs` 컴파일. `contextBridge`로 `window.musicApp` 노출. **이 파일이 두 프로세스 간 계약**. 새 채널은 반드시 여기 추가하고 `src/types/index.ts`에도 타입 선언.

### 오디오 재생

샌드박스에서 `file://` URL 불가 → `player:get-audio-url`이 `music://localhost/<encoded-path>` 반환 → `main.ts`의 프로토콜 핸들러가 실제 파일로 프록시.

### Path alias

`@/` → `src/` (Vite + tsconfig 동일 설정).

---

## IPC 흐름 (URL 임포트)

`track:import-url` → ID 생성 → `libraryStore.getTrackDir(id)` 경로에 다운로드 → music-metadata 파싱 → `libraryStore.upsert()` → OpenAI 에이전트 실행(비동기) → 결과로 `upsert()` 업데이트 → renderer push.

---

## 브랜치 전략 & PR 규칙

### 브랜치 네이밍

```
feat/<short-description>      # 새 기능
fix/<short-description>       # 버그 수정
chore/<short-description>     # 설정, 의존성, 빌드
refactor/<short-description>  # 리팩터링 (기능 변경 없음)
docs/<short-description>      # 문서만 수정
```

예시: `feat/url-import-progress`, `fix/audio-stream-cors`

### 작업 흐름

1. `main`에서 브랜치 생성
   ```bash
   git checkout main && git pull
   git checkout -b feat/<description>
   ```
2. 작업 → 커밋 (Conventional Commits)
3. PR 생성 → `main` 타겟
4. Squash merge (커밋 히스토리 정리)
5. 머지 후 브랜치 삭제

### PR 규칙

- **타이틀**: Conventional Commit 형식 (`feat: URL 임포트 진행률 표시 추가`)
- **본문 필수 항목**:
  - 변경 요약 (무엇을, 왜)
  - 테스트 방법 (직접 확인 가능한 스텝)
  - 스크린샷 (UI 변경 시)
- `main`에 직접 push 금지 — 반드시 PR을 통해 머지
- PR 머지 전 `pnpm typecheck` 통과 필수

---

## 주요 컨벤션

- `better-sqlite3` **완전 제거됨** — `pnpm rebuild` 불필요. 네이티브 바인딩 없음.
- `music-metadata`, `electron`, `openai`, `yt-dlp-wrap`, `dotenv`는 Vite 번들에서 external 처리됨 (`rollupOptions.external`).
- Tailwind v4 사용 (`@tailwindcss/vite` 플러그인) — `tailwind.config.*` 파일 없음.
- 다크/라이트 테마: `index.css`의 `@theme` (dark 기본) + `.light` 오버라이드. `App.tsx`에서 `resolved === 'light'` 이면 `.light` 클래스 적용.
