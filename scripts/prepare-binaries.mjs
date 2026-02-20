#!/usr/bin/env node
/**
 * Prepare required binaries for packaging.
 * - yt-dlp: downloads macOS universal binary into build/bin/yt-dlp
 * - ffmpeg-static: handled via asarUnpack (no action needed here)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import https from 'https'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const binDir = path.join(root, 'build', 'bin')
const ytDlpDest = path.join(binDir, 'yt-dlp')

// yt-dlp macOS universal binary
const YT_DLP_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos'

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const follow = (u) => {
      https.get(u, { headers: { 'User-Agent': 'prepare-binaries/1.0' } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          follow(res.headers.location)
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} downloading ${u}`))
          return
        }
        const tmp = dest + '.tmp'
        const file = fs.createWriteStream(tmp)
        res.pipe(file)
        file.on('finish', () => {
          file.close()
          fs.renameSync(tmp, dest)
          resolve()
        })
        file.on('error', reject)
      }).on('error', reject)
    }
    follow(url)
  })
}

async function main() {
  fs.mkdirSync(binDir, { recursive: true })

  if (fs.existsSync(ytDlpDest)) {
    console.log('[prepare-binaries] yt-dlp already exists, skipping download.')
  } else {
    console.log('[prepare-binaries] Downloading yt-dlp...')
    await download(YT_DLP_URL, ytDlpDest)
    fs.chmodSync(ytDlpDest, 0o755)
    console.log('[prepare-binaries] yt-dlp downloaded successfully.')
  }

  // Ensure ffmpeg-static binary is present (run postinstall if not)
  const ffmpegStatic = await import('ffmpeg-static').then(m => m.default ?? m)
  if (ffmpegStatic && !fs.existsSync(ffmpegStatic)) {
    console.log('[prepare-binaries] ffmpeg-static binary missing, running install...')
    const { execFileSync } = await import('child_process')
    execFileSync(process.execPath, ['node_modules/ffmpeg-static/install.js'], { stdio: 'inherit', cwd: root })
  } else {
    console.log('[prepare-binaries] ffmpeg-static binary present.')
  }
}

main().catch(err => {
  console.error('[prepare-binaries] Error:', err.message)
  process.exit(1)
})
