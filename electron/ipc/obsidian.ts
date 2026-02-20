import { ipcMain, shell, dialog } from 'electron'
import fs from 'fs'
import path from 'path'
import { libraryStore } from '../lib/library-store'

export function registerObsidianHandlers(): void {
  ipcMain.handle('obsidian:select-vault', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Obsidian Vault',
      properties: ['openDirectory'],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle(
    'obsidian:create-note',
    (_, trackId: string, vaultPath: string, content: string) => {
      const track = libraryStore.get(trackId)
      if (!track) throw new Error('Track not found')

      const sanitize = (s: string) => s.replace(/[/\\?%*:|"<>]/g, '-')
      const noteDir = path.join(vaultPath, 'Music', sanitize(track.artistName ?? 'Unknown Artist'))
      fs.mkdirSync(noteDir, { recursive: true })

      const notePath = path.join(noteDir, `${sanitize(track.title ?? 'Untitled')}.md`)
      const frontmatter = `---
title: "${(track.title ?? '').replace(/"/g, '\\"')}"
artist: "${(track.artistName ?? '').replace(/"/g, '\\"')}"
album: "${(track.albumTitle ?? '').replace(/"/g, '\\"')}"
tags: [music]
---

`
      fs.writeFileSync(notePath, frontmatter + content, 'utf-8')

      return {
        trackId,
        path: notePath,
        notePath,
        title: track.title ?? 'Untitled',
        vaultPath,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
    }
  )

  ipcMain.handle('obsidian:get-notes-by-track', (_) => {
    // Notes are stored in vault, not in library store — return empty for now
    return []
  })

  ipcMain.handle('obsidian:open-note', async (_, notePath: string) => {
    await shell.openPath(notePath)
  })
}
