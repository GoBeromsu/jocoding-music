# Hackathon TODOLIST — 노래 URL AI 메타데이터 에이전트

**해커톤 주제**: OpenAI API를 활용한 비즈니스 가치 있는 프로덕트
**핵심 기술**: OpenAI Responses API + `web_search_preview` 내장 도구
**목표**: 좋아하는 노래 URL을 입력하면 AI 에이전트가 아티스트 정보, 원곡자, 타 플랫폼 가용 여부를 자동으로 수집해주는 뮤직 플레이어

---

## Phase 1 — 환경 설정

- [ ] `openai` npm 패키지 설치
  ```bash
  pnpm add openai
  ```
- [ ] `yt-dlp-wrap` 설치 (YouTube/SoundCloud 오디오 다운로드)
  ```bash
  pnpm add yt-dlp-wrap
  pnpm add -D @types/...
  ```
- [ ] `.env` 파일 생성 및 `.gitignore`에 추가
  ```
  OPENAI_API_KEY=sk-...
  ```
- [ ] Electron main process에서 `dotenv` 로드 (`electron/main.ts` 상단)
- [ ] `electron/preload.cts`에 새 IPC 채널 타입 추가

---

## Phase 2 — DB 스키마 확장

파일: `electron/db/schema.ts`

- [ ] `tracks` 테이블에 컬럼 추가
  ```sql
  source_url      TEXT,          -- 입력한 원본 URL
  source_platform TEXT,          -- 'youtube' | 'soundcloud' | 'direct'
  original_artist TEXT,          -- AI가 찾은 원곡 가수
  is_cover        INTEGER DEFAULT 0  -- 커버곡 여부
  ```
- [ ] `platform_links` 테이블 신규 생성
  ```sql
  CREATE TABLE IF NOT EXISTS platform_links (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id    INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    platform    TEXT NOT NULL,   -- 'spotify' | 'apple_music' | 'melon' | 'youtube' 등
    url         TEXT NOT NULL,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(track_id, platform)
  );
  ```
- [ ] `applySchema()` 함수에 `ALTER TABLE`(기존 DB 마이그레이션) 또는 테이블 재생성 처리

---

## Phase 3 — URL 다운로더 모듈

신규 파일: `electron/lib/url-importer.ts`

- [ ] **플랫폼 감지 함수** `detectPlatform(url: string)`
  - YouTube: `youtube.com/watch`, `youtu.be/`
  - SoundCloud: `soundcloud.com/`
  - 직접 링크: URL 끝이 `.mp3`, `.flac`, `.m4a` 등

- [ ] **오디오 다운로드 함수** `downloadAudio(url, destDir, onProgress)`
  - `yt-dlp-wrap`으로 best audio 포맷 다운로드
  - 다운로드 경로: `app.getPath('userData')/imported/`
  - `yt-dlp`의 `--print-json` 플래그로 메타데이터 동시 추출
  - 진행률 파싱 → `win.webContents.send('import:progress', { percent })`

- [ ] **반환 타입 정의**
  ```ts
  interface ImportResult {
    filePath: string
    title: string | null
    artist: string | null
    durationMs: number | null
    sourcePlatform: string
    sourceUrl: string
  }
  ```

---

## Phase 4 — OpenAI 에이전트 모듈 (핵심)

신규 파일: `electron/lib/music-agent.ts`

**사용 API**: OpenAI **Responses API** + built-in `web_search_preview` 도구

- [ ] OpenAI 클라이언트 초기화
  ```ts
  import OpenAI from 'openai'
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  ```

- [ ] **에이전트 함수** `enrichMusicMetadata(input: AgentInput): Promise<AgentResult>`

  ```ts
  // 입력
  interface AgentInput {
    title: string
    artist: string
    sourceUrl: string
    sourcePlatform: string
  }

  // 출력
  interface AgentResult {
    performingArtist: string        // 부른 가수
    originalArtist: string | null   // 원곡 가수 (커버곡일 경우)
    isCover: boolean
    platformLinks: {                // 타 플랫폼 링크
      platform: string
      url: string
    }[]
    summary: string                 // 한 줄 요약
  }
  ```

- [ ] Responses API 호출 — `web_search_preview` 도구 사용
  ```ts
  const response = await client.responses.create({
    model: 'gpt-4o-mini',
    tools: [{ type: 'web_search_preview' }],
    input: systemPrompt + userPrompt,
  })
  ```

- [ ] **시스템 프롬프트 설계**
  - 역할: 음악 메타데이터 전문 에이전트
  - 수행 작업:
    1. 이 곡을 부른 아티스트가 누구인지 확인
    2. 커버곡인지 판단, 원곡 아티스트 검색
    3. Spotify / Apple Music / MelOn / Bugs / YouTube Music 등에서 해당 곡 링크 검색
  - 출력 포맷: JSON 고정 (구조화된 응답)

- [ ] **응답 파싱** — JSON 추출 및 `AgentResult` 매핑
- [ ] 오류 처리: API 실패 시 graceful fallback (기본 메타데이터만 저장)

---

## Phase 5 — IPC 핸들러 연결

파일: `electron/ipc/library.ts` (또는 신규 `electron/ipc/url-import.ts`)

- [ ] `track:import-url` 핸들러
  1. URL 수신
  2. `downloadAudio()` 호출 → 파일 다운로드
  3. `parseFile()`로 기본 메타데이터 추출 (기존 music-metadata)
  4. DB에 트랙 저장
  5. `enrichMusicMetadata()` 호출 (비동기, 완료 후 push 이벤트)
  6. AI 결과를 `tracks` + `platform_links` 테이블에 업데이트

- [ ] `track:get-platform-links` 핸들러
  - `platform_links` 테이블에서 `track_id`로 조회 후 반환

- [ ] `import:progress` 이벤트 → renderer로 진행률 push

---

## Phase 6 — UI 컴포넌트

### 6-1. URL 입력 다이얼로그
파일: `src/components/ImportUrlDialog.tsx`

- [ ] `@radix-ui/react-dialog` 활용 (이미 설치됨)
- [ ] URL 입력 필드 + 임포트 버튼
- [ ] 다운로드 진행률 표시 (progress bar)
- [ ] 에이전트 실행 중 로딩 스피너 ("AI가 곡 정보를 조사 중...")

### 6-2. 트랙 상세 뷰 — AI 메타데이터 패널
파일: `src/components/TrackMetadataPanel.tsx`

- [ ] **부른 가수** 표시
- [ ] **원곡 가수** 표시 (커버곡 배지 포함)
- [ ] **타 플랫폼 링크** 목록 (아이콘 + 링크)
  - Spotify, Apple Music, YouTube Music, MelOn, Bugs
- [ ] **AI 요약** 텍스트 표시

### 6-3. 상태 관리
파일: `src/store/` (Zustand 기존 스토어 확장)

- [ ] `importUrl(url)` 액션 추가
- [ ] 임포트 진행 상태 (`idle` | `downloading` | `analyzing` | `done` | `error`)
- [ ] `platformLinks` 상태 추가

---

## Phase 7 — 마무리 및 데모 준비

- [ ] **에러 케이스 처리**
  - 지원하지 않는 URL 형식 경고
  - yt-dlp 미설치 시 안내 메시지
  - OpenAI API 키 없을 때 graceful fallback

- [ ] **데모 시나리오 준비** (해커톤용)
  - 커버곡 URL 예시 (원곡자가 다른 곡)
  - 여러 플랫폼에 있는 곡 예시
  - AI 응답 결과 스크린샷

- [ ] **비즈니스 가치 슬라이드** 정리
  - 타겟: 음악 애호가, 커버곡 유통 관리자
  - 핵심 차별점: OpenAI Responses API web_search로 실시간 플랫폼 탐색

---

## 기술 스택 요약

| 역할 | 기술 |
|------|------|
| AI 에이전트 | OpenAI Responses API + `web_search_preview` |
| 오디오 다운로드 | yt-dlp-wrap |
| 로컬 DB | SQLite (better-sqlite3) |
| 프레임워크 | Electron + React + TypeScript |
| 상태 관리 | Zustand |
| UI | Tailwind CSS + Radix UI |

---

## 작업 순서 (우선순위)

```
Phase 1 (환경 설정)
    ↓
Phase 2 (DB 스키마)
    ↓
Phase 4 (OpenAI 에이전트) ← 해커톤 핵심, 먼저 단독 테스트
    ↓
Phase 3 (URL 다운로더)
    ↓
Phase 5 (IPC 연결)
    ↓
Phase 6 (UI)
    ↓
Phase 7 (데모 준비)
```
