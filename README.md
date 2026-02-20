# 음감 (Umgam)

유튜브 플레이리스트에서 좋은 노래를 발견했는데, 나중에 다시 못 찾은 적 있나요?

---

## 왜 만들었나

요즘 음악 소비는 알고리즘이 틀어주는 플레이리스트를 수동적으로 듣는 방식입니다. 좋아하는 노래가 생겨도 누가 불렀는지, 원곡인지 커버인지, 어디서 다시 들을 수 있는지 모른 채 그냥 흘려보냅니다. 취향은 쌓이지 않고 휘발됩니다.

음감은 URL 하나만 붙여넣으면 그 노래를 내 컴퓨터에 저장합니다. 동시에 AI가 곡 정보를 자동으로 채워줍니다. 누가 불렀는지, 원곡은 무엇인지, 어떤 장르와 무드인지 정리해줍니다.

브라우저를 열 필요도 없습니다. 광고도, 알고리즘 추천도, 다른 탭의 유혹도 없습니다. 내가 고른 노래만, 내 컴퓨터 안에 남습니다.

음감은 단순한 플레이어가 아닙니다. 내가 어떤 음악을 좋아하는지 기억하고 축적하는 시스템입니다. 결국, 취향을 보존하는 에이전트로 진화합니다.

---

## 고객 문제 & 해결 방안

| 고객 | 문제 | 음감의 해결 |
|---|---|---|
| 딥워크 중 음악을 트는 지식 노동자 | 플리를 찾으러 브라우저를 열면 집중이 끊김 | URL 하나로 브라우저 없이 로컬 재생 + AI가 곡 정보 자동 수집 |
| 유튜브에서 좋은 노래를 발견하는 음악 매니아 | 나중에 다시 못 찾음 | AI가 원곡자·커버 여부를 자동 기록, 로컬에 영구 저장 |
| 콘텐츠에 쓸 음원을 수집하는 크리에이터 | 여러 플랫폼에서 수집·관리가 번거로움 | 메타데이터 정리된 로컬 라이브러리 + 태그·폴더 관리 |

---

## 비즈니스 모델

**무료 진입**: 오디오 다운로드·재생은 무제한 무료

**크레딧 과금**: AI 메타데이터 분석은 크레딧 소모

| 플랜 | 크레딧 | 가격 |
|---|---|---|
| Free | 월 10곡 | 무료 |
| Basic | 월 100곡 | $5/월 |
| Pro | 무제한 + 취향 리포트 | $15/월 |

핵심은 재생기가 아닌 **"내 취향을 아는 AI 에이전트"를 구독**하는 경험입니다.

---

## MVP 구현 현황

MVP에서 실제 작동하는 기능만 명시합니다.

### ✅ 구현 완료

**URL 임포트 & 저장**
- YouTube·SoundCloud URL 또는 플레이리스트를 한 번에 다운로드 (yt-dlp)
- 오디오 파일을 `userData/library/tracks/{ID}.info/audio.*`에 영구 저장
- 커버 썸네일 자동 다운로드
- 128k / 192k / best 품질 선택 가능

**AI 메타데이터 분석** (OpenAI GPT-4o-mini + 웹 검색)
- 수행 아티스트 및 원곡 아티스트 추출
- 커버곡 여부(`isCover`) 자동 감지
- 장르 분류 (K-Pop, Rock, Hip-Hop, Electronic, Jazz 등 30개 카테고리)
- 무드 분류 (Chill, Energetic, Melancholic, Dark, Romantic 등 16개 카테고리)
- 크레딧 시스템: 기본 10개, AI 분석 1회 = 1크레딧

**로컬 라이브러리**
- 트랙 추가·수정·삭제(소프트 삭제)
- 제목·아티스트·앨범·장르·무드로 실시간 검색
- 추가일·제목·아티스트·재생 수 기준 정렬 (오름/내림차순)
- 즐겨찾기·태그·커스텀 폴더로 필터링
- 로컬 폴더 스캔 (기존 오디오 파일 일괄 가져오기)

**취향 대시보드**
- 상위 6개 장르·무드 분포 시각화
- 많이 들은 곡 Top 5 (재생 수 기준)
- 최근 추가 곡 5개
- "내 취향 분석" 버튼: AI가 취향을 1-2줄로 묘사 (크레딧 1 소모)

**플레이어**
- 재생·일시정지·다음·이전·볼륨·시간 이동
- 재생 횟수(`playCount`) 자동 기록
- 이전 곡 로직: 3초 이상 재생 시 현재 곡 재시작, 미만이면 이전 곡
- macOS MediaSession API (잠금화면·Touch Bar 컨트롤) 연동

**기타**
- System/Dark/Light 테마 선택 (OS 자동 감지 포함)
- Obsidian 볼트에 트랙 노트 자동 생성
- 데모용 샘플 라이브러리 자동 시딩

### 🚧 미구현 (다음 버전 계획)

- Spotify·Apple Music·MelOn 플랫폼 링크 자동 수집
- 반복·셔플 재생 모드
- 주간/월간 청취 트렌드 분석
- 음악 추천 기능

---

## 빠른 시작

### 준비물

| 항목 | 확인 |
|---|---|
| Node.js ≥ 18 | `node -v` |
| pnpm | `pnpm -v` |
| OpenAI API Key | [platform.openai.com](https://platform.openai.com) |

### 설치

```bash
pnpm install
```

`build/bin/yt-dlp`가 없으면 먼저 다운로드합니다.

```bash
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
  -o build/bin/yt-dlp
chmod +x build/bin/yt-dlp
```

환경 변수를 설정합니다.

```bash
cp .env.example .env
# .env 에 OPENAI_API_KEY=sk-... 입력
```

### 실행

```bash
pnpm dev
```

앱이 열리면 **Settings → OpenAI API Key**에 키를 입력하고 저장합니다.

### 데모 체크리스트 (1분)

1. **Import from URL** → YouTube URL 붙여넣기
2. 다운로드·AI 분석 완료 후 트랙 카드의 장르·무드 태그 확인
3. **My Taste** 탭 → 장르·무드 분포 + "내 취향 분석" 버튼

자세한 대본: [`docs/demo-script.md`](docs/demo-script.md)

---

## 빌드

```bash
pnpm build        # 타입 체크 + 프로덕션 빌드
pnpm dist:mac     # macOS .dmg
pnpm dist:win     # Windows .exe
pnpm dist:linux   # Linux AppImage
```

### macOS 미서명 빌드 실행 (개발 제출용)

```bash
xattr -dr com.apple.quarantine ./release/*.dmg
xattr -dr com.apple.quarantine /Applications/Umgam.app
open /Applications/Umgam.app
```

실행이 안 되면 Finder에서 앱을 우클릭 → **열기**를 한 번 더 수행합니다.

---

## 기술 스택

| 분류 | 기술 |
|---|---|
| 앱 프레임워크 | Electron 34 + Vite |
| UI | React 18 + Tailwind v4 |
| 상태관리 | Zustand |
| AI | OpenAI GPT-4o-mini + Responses API (웹 검색) |
| 다운로드 | yt-dlp |
| 오디오 파싱 | music-metadata |
| 스토리지 | Eagle 방식 파일 기반 (JSON, SQLite 없음) |

---

## 문제 해결

| 증상 | 조치 |
|---|---|
| AI 분석 미작동 | Settings에서 OpenAI API Key 입력 후 앱 재시작 |
| yt-dlp 다운로드 실패 | `chmod +x build/bin/yt-dlp` 확인, 방화벽·네트워크 점검 |
| 트랙 불러오기 실패 | URL 접근성·지역 제한·네트워크 상태 점검 |

---

## 라이선스

MIT © 2025 조코딩 해커톤 참가작
