# Eagle Flat-File Library Pattern

**일시**: 2026-02-19
**목적**: jocoding 뮤직 플레이어가 SQLite 없이 파일 시스템만으로 트랙 라이브러리를 관리하는 방식 기록

---

## 왜 Eagle 패턴인가

Eagle은 디자이너용 이미지 라이브러리 앱이다. SQLite 같은 관계형 DB 대신 파일 시스템에 직접 데이터를 저장한다. 각 이미지 아이템이 `<id>.info/` 폴더 하나로 표현되고, 그 안에 원본 파일과 `metadata.json`이 공존한다.

jocoding 뮤직 플레이어는 이 패턴을 오디오 트랙에 적용했다. 이유는 하나다: **`better-sqlite3`는 네이티브 바인딩이 있어 Electron 패키징 시 `pnpm rebuild`가 필요하다.** 파일 기반 저장은 네이티브 바인딩이 없으므로 어느 플랫폼에서도 빌드 단계가 단순해진다.

---

## 디렉터리 구조

```
userData/library/
  metadata.json                     ← 라이브러리 전역 상태 (track ID 목록 등)
  tracks/
    <id>.info/
      audio.m4a                     ← yt-dlp로 다운로드한 오디오
      thumb.jpg                     ← YouTube CDN에서 다운로드한 썸네일
      metadata.json                 ← 트랙 메타데이터 (TrackMeta 타입)
    <id>.info/
      ...
```

Eagle의 `images/<id>.info/` 구조와 1:1 대응된다. 아이템 하나 = 폴더 하나.

---

## Track ID 포맷

```typescript
// electron/lib/library-store.ts
const id = Date.now().toString(36).toUpperCase()         // 시간 기반 Base36, ~8자
          + randomBytes(3).toString('hex').toUpperCase() // 랜덤 hex, 6자
// 결과: "M5K3JABF2C91" 형태 13자 문자열
```

숫자형 auto-increment ID를 쓰지 않는다. 파일 시스템에서 폴더명으로 직접 쓰이므로 충돌 확률이 낮은 랜덤 조합을 사용한다.

---

## 핵심 연산

### 앱 시작 — 전체 로드

```typescript
// libraryStore.init() 호출 시
const trackDirs = fs.readdirSync(tracksDir)
for (const dir of trackDirs) {
  if (!dir.endsWith('.info')) continue
  const metaPath = path.join(tracksDir, dir, 'metadata.json')
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as TrackMeta
  map.set(meta.id, meta)
}
```

모든 `metadata.json`을 메모리 `Map<string, TrackMeta>`에 올린다. 이후 조회는 O(1).

### upsert — 쓰기

```typescript
libraryStore.upsert(track)
// → map.set(track.id, track)
// → fs.writeFileSync(metaPath, JSON.stringify(track, null, 2))
```

메모리 Map 업데이트 + `metadata.json` 파일 동기 덮어쓰기. 원자적 보장은 없다.

### softDelete — 삭제

```typescript
libraryStore.softDelete(id)
// → existing.isDeleted = true
// → upsert(existing)
```

파일을 삭제하지 않는다. `isDeleted: true` 플래그만 기록한다. `getAll()`은 이 플래그를 필터링해 반환한다.

### Albums / Artists — 파생

DB 테이블 없음. `getAll()` 결과를 클라이언트에서 groupBy로 파생한다.

```typescript
// src/store/libraryStore.ts
const albums = groupBy(tracks, t => t.albumTitle)
const artists = groupBy(tracks, t => t.artistName)
```

---

## 썸네일 전달 — music:// 커스텀 프로토콜

Electron 샌드박스 렌더러는 `file://` URL을 직접 읽을 수 없다. 그래서 `music://` 커스텀 프로토콜을 등록해 프록시한다.

```typescript
// electron/main.ts — 프로토콜 핸들러
protocol.handle('music', (request) => {
  const rawPath = request.url.replace('music://localhost/', '')
  const filePath = decodeURIComponent(rawPath)
  return net.fetch(pathToFileURL(filePath).toString())
})
```

렌더러에서는 `coverArtPath`를 다음과 같이 변환해 `<img src>` 에 사용한다.

```typescript
// src/components/layout/MainContent.tsx
const coverUrl = track.coverArtPath
  ? `music://localhost/${encodeURIComponent(track.coverArtPath)}`
  : null
```

오디오 파일도 동일한 방식으로 스트리밍된다 (`player:get-audio-url` IPC 핸들러).

---

## URL 임포트 전체 흐름

```
track:import-url (IPC)
  ↓
ID 생성 → destDir = tracks/<id>.info/
  ↓
downloadAudio() → audio.m4a 저장
  ↓
downloadThumbnail() → thumb.jpg 저장  ← coverArtPath 설정
  ↓
libraryStore.upsert(track)            ← 렌더러에 즉시 반영
  ↓
import:status 이벤트 push
  ↓
enrichMusicMetadata() [비동기]
  ↓
libraryStore.upsert({ ...existing, artistName: result.performingArtist, ... })
  ↓
import:enriched 이벤트 push           ← 렌더러가 loadTracks() 재호출
```

---

## 한계

- **Cold-start 선형 증가**: 트랙 수가 수만 개를 넘으면 앱 시작 시 파일 읽기 시간이 늘어난다. SQLite 인덱스 대비 불리하다.
- **원자성 없음**: `upsert()` 도중 프로세스가 종료되면 `metadata.json`이 깨질 수 있다. 현재 MVP 수준에서는 무시한다.
- **검색 성능**: 전문 검색(full-text search)은 메모리 Map을 순회하는 선형 스캔이다. 트랙 수가 적은 MVP 범위에서는 충분하다.
