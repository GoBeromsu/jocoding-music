import fs from 'fs'
import path from 'path'

/**
 * 첫 실행 또는 버전이 다를 때 extraResources/demo-library/ → userData/library/ 로 복사.
 * 복사 후 metadata.json 내 filePath/coverArtPath를 실제 경로로 패치.
 *
 * 버전 관리:
 *   - demo-library/.demo-version 파일에 버전 문자열 기록 (seed:demo 스크립트가 작성)
 *   - userData/library/.demo-version 과 비교하여 다를 때만 재복사
 */
export function seedDemoIfNeeded(libraryPath: string, demoLibraryPath: string): void {
  // 데모 라이브러리 소스가 없으면 스킵 (dev 환경에서 seed:demo 미실행)
  if (!fs.existsSync(demoLibraryPath)) return

  const versionFile = path.join(demoLibraryPath, '.demo-version')
  const userVersionFile = path.join(libraryPath, '.demo-version')

  // demo-version 파일이 없으면 레거시 방식으로 처리
  if (!fs.existsSync(versionFile)) {
    // 기존 트랙이 없으면 복사 시도
    const tracksDir = path.join(libraryPath, 'tracks')
    if (fs.existsSync(tracksDir)) {
      const entries = fs.readdirSync(tracksDir).filter(f => f.endsWith('.info'))
      if (entries.length > 0) return
    }
    copyAndPatch(demoLibraryPath, libraryPath)
    return
  }

  const demoVersion = fs.readFileSync(versionFile, 'utf-8').trim()
  const userVersion = fs.existsSync(userVersionFile)
    ? fs.readFileSync(userVersionFile, 'utf-8').trim()
    : ''

  if (userVersion === demoVersion) return  // 최신 버전이면 스킵

  console.log(`[demo-seeder] Version mismatch (user="${userVersion}" → demo="${demoVersion}"). Re-seeding…`)
  copyAndPatch(demoLibraryPath, libraryPath)

  // 버전 기록
  fs.writeFileSync(userVersionFile, demoVersion, 'utf-8')
  console.log('[demo-seeder] Demo library seeded successfully.')
}

function copyAndPatch(demoLibraryPath: string, libraryPath: string): void {
  copyRecursive(demoLibraryPath, libraryPath)

  // filePath / coverArtPath 패치 — 절대경로를 새 위치로 갱신
  const copiedTracksDir = path.join(libraryPath, 'tracks')
  if (!fs.existsSync(copiedTracksDir)) return

  for (const entry of fs.readdirSync(copiedTracksDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.endsWith('.info')) continue
    const metaPath = path.join(copiedTracksDir, entry.name, 'metadata.json')
    if (!fs.existsSync(metaPath)) continue

    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
      const trackDir = path.join(copiedTracksDir, entry.name)

      if (meta.filePath) {
        const audioFileName = path.basename(meta.filePath)
        meta.filePath = path.join(trackDir, audioFileName)
      }
      if (meta.coverArtPath && !meta.coverArtPath.startsWith('http')) {
        const thumbFileName = path.basename(meta.coverArtPath)
        meta.coverArtPath = path.join(trackDir, thumbFileName)
      }

      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8')
    } catch { /* skip corrupt metadata */ }
  }
}

function copyRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)  // 강제 덮어쓰기 (버전 업데이트)
    }
  }
}
