import { ipcMain, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import { parseFile } from 'music-metadata'
import { libraryStore, type TrackMeta } from '../lib/library-store'
import { downloadAudio, downloadThumbnail, extractPlaylistUrls, fetchMetadataOnly, isAudioPlatform, detectPlatform } from '../lib/url-importer'
import { enrichMusicMetadata } from '../lib/music-agent'
import { settingsStore } from '../lib/settings-store'

export function registerUrlImportHandlers(): void {
  ipcMain.handle('track:import-url', async (event, url: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const id = libraryStore.newId()
    const destDir = libraryStore.getTrackDir(id)
    const platform = detectPlatform(url)

    if (!isAudioPlatform(platform)) {
      // Metadata-only path (Spotify, Apple Music, MelOn, etc.)
      win?.webContents.send('import:status', { step: 'metadata', percent: 50, trackId: id })
      const meta = await fetchMetadataOnly(url)

      // Download thumbnail if available
      let coverArtPath: string | null = null
      if (meta.thumbnailUrl) {
        fs.mkdirSync(destDir, { recursive: true })
        const thumbPath = path.join(destDir, 'thumb.jpg')
        try {
          await downloadThumbnail(meta.thumbnailUrl, thumbPath)
          coverArtPath = thumbPath
        } catch { /* skip */ }
      }

      const track: TrackMeta = {
        id,
        filePath: '',
        isImported: true,
        isFavorite: false,
        title: meta.title,
        artistName: meta.artist,
        albumTitle: null,
        year: null,
        trackNumber: null,
        durationMs: null,
        bitrate: null,
        sampleRate: null,
        fileSize: null,
        mimeType: null,
        coverArtPath,
        tags: [],
        hasAudio: false,
        externalLinks: url,
        isDeleted: false,
        sourceUrl: url,
        sourcePlatform: meta.sourcePlatform,
        genre: null,
        mood: null,
        playCount: 0,
        lastPlayedAt: null,
        dateAdded: Date.now(),
        modifiedAt: Date.now(),
      }
      libraryStore.upsert(track)
      win?.webContents.send('import:status', { step: 'ai-searching', percent: 100, trackId: id })

      const credits = settingsStore.get().credits
      if (credits > 0) {
        enrichMusicMetadata({
          title: meta.title ?? 'Unknown',
          artist: meta.artist ?? 'Unknown',
          sourceUrl: url,
          sourcePlatform: meta.sourcePlatform,
        }).then((result) => {
          settingsStore.deductCredit()
          win?.webContents.send('import:status', { step: 'ai-classifying', percent: 100, trackId: id })
          const existing = libraryStore.get(id)
          if (existing) {
            libraryStore.upsert({
              ...existing,
              artistName: result.performingArtist ?? existing.artistName,
              genre: result.genre,
              mood: result.mood,
            })
          }
          win?.webContents.send('import:status', { step: 'done', percent: 100, trackId: id })
          win?.webContents.send('import:enriched', { trackId: id, result })
        }).catch(() => {
          win?.webContents.send('import:status', { step: 'done', percent: 100, trackId: id })
        })
      } else {
        win?.webContents.send('import:status', { step: 'done', percent: 100, trackId: id })
      }

      return { trackId: id, title: meta.title, artist: meta.artist, durationMs: null, sourcePlatform: meta.sourcePlatform }
    }

    // Audio download path (YouTube, SoundCloud, direct)
    win?.webContents.send('import:status', { step: 'downloading', percent: 0, trackId: id })
    const quality = settingsStore.get().downloadQuality ?? 'best'
    const imported = await downloadAudio(url, destDir, (percent) => {
      win?.webContents.send('import:status', { step: 'downloading', percent, trackId: id })
    }, quality)

    // 2. Parse metadata
    let durationMs = imported.durationMs
    let title = imported.title
    let artist = imported.artist

    win?.webContents.send('import:status', { step: 'metadata', percent: 100, trackId: id })

    try {
      const meta = await parseFile(imported.filePath, { duration: true })
      title = meta.common.title ?? title
      artist = meta.common.artist ?? artist
      durationMs = meta.format.duration ? Math.round(meta.format.duration * 1000) : durationMs
    } catch (err) {
      console.warn('[import] metadata parse fallback to yt-dlp:', err)
    }

    // 3. Download thumbnail
    let coverArtPath: string | null = null
    if (imported.thumbnailUrl) {
      const thumbPath = path.join(destDir, 'thumb.jpg')
      try {
        await downloadThumbnail(imported.thumbnailUrl, thumbPath)
        coverArtPath = thumbPath
      } catch (err) {
        console.warn('[import] thumbnail download failed:', err)
      }
    }

    const stat = fs.statSync(imported.filePath)

    const track: TrackMeta = {
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
      hasAudio: true,
      externalLinks: null,
      isDeleted: false,
      sourceUrl: imported.sourceUrl,
      sourcePlatform: imported.sourcePlatform,
      genre: null,
      mood: null,
      playCount: 0,
      lastPlayedAt: null,
      dateAdded: Date.now(),
      modifiedAt: Date.now(),
    }

    libraryStore.upsert(track)

    // 4. AI enrichment (async) — push step updates to renderer
    win?.webContents.send('import:status', { step: 'ai-searching', percent: 100, trackId: id })

    // Check credits before running AI
    const credits = settingsStore.get().credits
    if (credits <= 0) {
      win?.webContents.send('import:error', {
        trackId: id,
        message: '크레딧이 부족합니다. Settings에서 크레딧을 충전하세요.',
      })
    } else {
      enrichMusicMetadata({
        title: title ?? 'Unknown',
        artist: artist ?? 'Unknown',
        sourceUrl: imported.sourceUrl,
        sourcePlatform: imported.sourcePlatform,
      }).then((result) => {
        settingsStore.deductCredit()
        win?.webContents.send('import:status', { step: 'ai-classifying', percent: 100, trackId: id })

        const existing = libraryStore.get(id)
        if (existing) {
          libraryStore.upsert({
            ...existing,
            artistName: result.performingArtist ?? existing.artistName,
            genre: result.genre,
            mood: result.mood,
          })
        }

        win?.webContents.send('import:status', { step: 'done', percent: 100, trackId: id })
        win?.webContents.send('import:enriched', { trackId: id, result })
      }).catch((err) => {
        console.error('[import] enrichment failed:', err)
        win?.webContents.send('import:status', { step: 'done', percent: 100, trackId: id })
        win?.webContents.send('import:error', {
          trackId: id,
          message: `AI 분석 실패: ${err instanceof Error ? err.message : 'Unknown error'}`,
        })
      })
    }

    return { trackId: id, title, artist, durationMs, sourcePlatform: imported.sourcePlatform }
  })

  ipcMain.handle('track:import-playlist', async (event, url: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const urls = await extractPlaylistUrls(url)
    const trackIds: string[] = []

    for (let i = 0; i < urls.length; i++) {
      win?.webContents.send('import:status', {
        step: 'downloading',
        percent: Math.round((i / urls.length) * 100),
      })
      try {
        // Reuse single import logic by invoking directly
        const id = libraryStore.newId()
        const destDir = libraryStore.getTrackDir(id)
        const quality = settingsStore.get().downloadQuality ?? 'best'
        const imported = await downloadAudio(urls[i], destDir, undefined, quality)
        let coverArtPath: string | null = null
        if (imported.thumbnailUrl) {
          const thumbPath = path.join(destDir, 'thumb.jpg')
          try { await downloadThumbnail(imported.thumbnailUrl, thumbPath); coverArtPath = thumbPath } catch { /* skip */ }
        }
        const stat = fs.statSync(imported.filePath)
        const track: TrackMeta = {
          id,
          filePath: imported.filePath,
          isImported: true,
          isFavorite: false,
          title: imported.title ?? null,
          artistName: imported.artist ?? null,
          albumTitle: null,
          year: null,
          trackNumber: null,
          durationMs: imported.durationMs ?? null,
          bitrate: null,
          sampleRate: null,
          fileSize: stat.size,
          mimeType: null,
          coverArtPath,
          tags: [],
          hasAudio: true,
          externalLinks: null,
          isDeleted: false,
          sourceUrl: imported.sourceUrl,
          sourcePlatform: imported.sourcePlatform,
          genre: null,
          mood: null,
          playCount: 0,
          lastPlayedAt: null,
          dateAdded: Date.now(),
          modifiedAt: Date.now(),
        }
        libraryStore.upsert(track)
        trackIds.push(id)

        // AI enrich each track asynchronously
        if (settingsStore.get().credits > 0) {
          enrichMusicMetadata({
            title: imported.title ?? 'Unknown',
            artist: imported.artist ?? 'Unknown',
            sourceUrl: imported.sourceUrl,
            sourcePlatform: imported.sourcePlatform,
          }).then((result) => {
            settingsStore.deductCredit()
            const existing = libraryStore.get(id)
            if (existing) libraryStore.upsert({ ...existing, genre: result.genre, mood: result.mood, artistName: result.performingArtist ?? existing.artistName })
            win?.webContents.send('import:enriched', { trackId: id, result })
          }).catch(() => { /* skip enrichment error for batch */ })
        }
      } catch (err) {
        console.error(`[playlist] failed to import ${urls[i]}:`, err)
      }
    }

    win?.webContents.send('import:status', { step: 'done', percent: 100 })
    return { trackIds, count: trackIds.length }
  })
}
