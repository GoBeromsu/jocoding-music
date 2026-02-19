// CommonJS TypeScript — compiled to preload.cjs
// sandbox: true allows only require('electron') via injected restricted require
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('musicApp', {
  library: {
    scanFolder: (folderPath: string) =>
      ipcRenderer.invoke('library:scan-folder', folderPath),
    getTracks: () =>
      ipcRenderer.invoke('library:get-tracks'),
    getTrack: (id: string) =>
      ipcRenderer.invoke('library:get-track', id),
    searchTracks: (query: string) =>
      ipcRenderer.invoke('library:search-tracks', query),
    getAlbums: () =>
      ipcRenderer.invoke('library:get-albums'),
    getArtists: () =>
      ipcRenderer.invoke('library:get-artists'),
    deleteTrack: (id: string) =>
      ipcRenderer.invoke('library:delete-track', id),
    importUrl: (url: string) =>
      ipcRenderer.invoke('track:import-url', url),
    getPlatformLinks: (trackId: string) =>
      ipcRenderer.invoke('track:get-platform-links', trackId),
  },

  player: {
    getAudioUrl: (trackId: string) =>
      ipcRenderer.invoke('player:get-audio-url', trackId),
    updatePlayCount: (trackId: string) =>
      ipcRenderer.invoke('player:update-play-count', trackId),
  },

  obsidian: {
    selectVault: () =>
      ipcRenderer.invoke('obsidian:select-vault'),
    createNote: (trackId: string, vaultPath: string, content: string) =>
      ipcRenderer.invoke('obsidian:create-note', trackId, vaultPath, content),
    getNotesByTrack: (trackId: string) =>
      ipcRenderer.invoke('obsidian:get-notes-by-track', trackId),
    openNote: (notePath: string) =>
      ipcRenderer.invoke('obsidian:open-note', notePath),
  },

  system: {
    selectFolder: () =>
      ipcRenderer.invoke('system:select-folder'),
    onLibraryScanProgress: (cb: (progress: { done: number; total: number }) => void) => {
      const handler = (_: unknown, p: { done: number; total: number }) => cb(p)
      ipcRenderer.on('library:scan-progress', handler)
      return () => ipcRenderer.off('library:scan-progress', handler)
    },
    onImportStatus: (cb: (status: { step: string; percent: number }) => void) => {
      const handler = (_: unknown, s: { step: string; percent: number }) => cb(s)
      ipcRenderer.on('import:status', handler)
      return () => ipcRenderer.off('import:status', handler)
    },
    onImportEnriched: (cb: (data: { trackId: string; result: unknown }) => void) => {
      const handler = (_: unknown, d: { trackId: string; result: unknown }) => cb(d)
      ipcRenderer.on('import:enriched', handler)
      return () => ipcRenderer.off('import:enriched', handler)
    },
  },
})
