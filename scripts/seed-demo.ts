/**
 * 데모 시딩 스크립트 — 실제 서비스 플로우와 동일하게 10곡을 다운로드 + AI 분류
 *
 * 실행 전 요구사항:
 *   - yt-dlp 시스템 설치 (brew install yt-dlp) 또는 build/bin/yt-dlp 존재
 *   - .env에 OPENAI_API_KEY 설정
 *
 * 사용: pnpm seed:demo
 */
import path from 'path'
import fs from 'fs'
import { config } from 'dotenv'
import { libraryStore } from '../electron/lib/library-store'
import { downloadAudio, downloadThumbnail } from '../electron/lib/url-importer'
import { enrichMusicMetadata } from '../electron/lib/music-agent'

config() // .env → process.env.OPENAI_API_KEY

const DEMO_URLS = [
  'https://www.youtube.com/watch?v=4NRXx6U8ABQ',  // Blinding Lights — The Weeknd
  'https://www.youtube.com/watch?v=JGwWNGJdvx8',  // Shape of You — Ed Sheeran
  'https://www.youtube.com/watch?v=xpVfcZ0ZcFM',  // God's Plan — Drake
  'https://www.youtube.com/watch?v=tvTRZJ-4EyI',  // HUMBLE. — Kendrick Lamar
  'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',  // Bohemian Rhapsody — Queen
  'https://www.youtube.com/watch?v=gGdGFtwCNBE',  // Mr. Brightside — The Killers
  'https://www.youtube.com/watch?v=FGBhQbmPwH8',  // One More Time — Daft Punk
  'https://www.youtube.com/watch?v=CvFH_6DNRCY',  // Clair de Lune — Debussy
  'https://www.youtube.com/watch?v=gdZLi9oWNZg',  // Dynamite — BTS
  'https://www.youtube.com/watch?v=ekr2nIex040',  // APT. — ROSÉ & Bruno Mars
]

const OUTPUT_DIR = path.resolve(__dirname, '..', 'resources', 'demo-library')

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY not set in .env')
    process.exit(1)
  }

  // Clean output directory
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true })
  }

  libraryStore.init(OUTPUT_DIR)

  const now = Date.now()

  for (let i = 0; i < DEMO_URLS.length; i++) {
    const url = DEMO_URLS[i]
    console.log(`\n[${i + 1}/${DEMO_URLS.length}] Importing: ${url}`)

    const id = libraryStore.newId()
    const destDir = libraryStore.getTrackDir(id)

    // 1. yt-dlp 다운로드
    const imported = await downloadAudio(url, destDir, (pct) => {
      process.stdout.write(`\r  Downloading: ${pct.toFixed(0)}%`)
    })
    console.log(`\n  Title: ${imported.title}`)
    console.log(`  Artist: ${imported.artist}`)

    // 2. 썸네일 다운로드
    let coverArtPath: string | null = null
    if (imported.thumbnailUrl) {
      const thumbPath = path.join(destDir, 'thumb.jpg')
      try {
        await downloadThumbnail(imported.thumbnailUrl, thumbPath)
        coverArtPath = thumbPath
        console.log('  Thumbnail: OK')
      } catch (err) {
        console.warn('  Thumbnail: FAILED', err)
      }
    }

    // 3. yt-dlp 메타데이터 사용 (music-metadata는 ESM 호환 문제로 스킵)
    const title = imported.title
    const artist = imported.artist
    const durationMs = imported.durationMs

    // 4. libraryStore에 저장
    const stat = fs.statSync(imported.filePath)
    libraryStore.upsert({
      id,
      filePath: imported.filePath,
      isImported: true,
      isFavorite: false,
      title: title ?? null,
      artistName: artist ?? null,
      albumTitle: null,
      year: null,
      trackNumber: null,
      durationMs: durationMs ?? null,
      bitrate: null,
      sampleRate: null,
      fileSize: stat.size,
      mimeType: null,
      coverArtPath,
      tags: [],
      isDeleted: false,
      sourceUrl: imported.sourceUrl,
      sourcePlatform: imported.sourcePlatform,
      genre: null,
      mood: null,
      playCount: Math.floor(Math.random() * 15),
      lastPlayedAt: null,
      dateAdded: now - Math.floor(Math.random() * 7 * 86400000),
      modifiedAt: now,
    })

    // 5. OpenAI AI enrichment (장르/무드 분류)
    try {
      const enriched = await enrichMusicMetadata({
        title: title ?? 'Unknown',
        artist: artist ?? 'Unknown',
        sourceUrl: url,
        sourcePlatform: 'youtube',
      })
      console.log(`  AI: ${enriched.genre} / ${enriched.mood}`)

      const existing = libraryStore.get(id)
      if (existing) {
        libraryStore.upsert({
          ...existing,
          artistName: enriched.performingArtist ?? existing.artistName,
          genre: enriched.genre,
          mood: enriched.mood,
        })
      }
    } catch (err) {
      console.warn('  Enrichment: FAILED', err)
    }
  }

  // Write demo version file (triggers re-seed on version bump)
  fs.writeFileSync(path.join(OUTPUT_DIR, '.demo-version'), '2.0', 'utf-8')

  console.log(`\n✅ Done! ${DEMO_URLS.length} tracks seeded to ${OUTPUT_DIR}`)
  console.log('Next: pnpm dist:mac to build with demo data included.')
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
