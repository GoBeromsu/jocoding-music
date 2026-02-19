// CommonJS TypeScript — compiled to preload.cjs
// sandbox: true allows only require('electron') via injected restricted require
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('musicApp', {
  library: {
    getTracks: () =>
      ipcRenderer.invoke('library:get-tracks'),
    getTrack: (id: string) =>
      ipcRenderer.invoke('library:get-track', id),
    searchTracks: (query: string) =>
      ipcRenderer.invoke('library:search-tracks', query),
    deleteTrack: (id: string) =>
      ipcRenderer.invoke('library:delete-track', id),
    updateTrack: (id: string, patch: object) =>
      ipcRenderer.invoke('library:update-track', id, patch),
    importUrl: (url: string) =>
      ipcRenderer.invoke('track:import-url', url),
    importPlaylist: (url: string) =>
      ipcRenderer.invoke('track:import-playlist', url),
  },

  player: {
    getAudioUrl: (trackId: string) =>
      ipcRenderer.invoke('player:get-audio-url', trackId),
    updatePlayCount: (trackId: string) =>
      ipcRenderer.invoke('player:update-play-count', trackId),
  },

  system: {
    onImportStatus: (cb: (status: { step: string; percent: number; trackId?: string }) => void) => {
      const handler = (_: unknown, s: { step: string; percent: number; trackId?: string }) => cb(s)
      ipcRenderer.on('import:status', handler)
      return () => ipcRenderer.off('import:status', handler)
    },
    onImportEnriched: (cb: (data: { trackId: string; result: unknown }) => void) => {
      const handler = (_: unknown, d: { trackId: string; result: unknown }) => cb(d)
      ipcRenderer.on('import:enriched', handler)
      return () => ipcRenderer.off('import:enriched', handler)
    },
    onImportError: (cb: (data: { trackId: string; message: string }) => void) => {
      const handler = (_: unknown, d: { trackId: string; message: string }) => cb(d)
      ipcRenderer.on('import:error', handler)
      return () => ipcRenderer.off('import:error', handler)
    },
    onApiKeyUpdated: (cb: (data: { active: boolean }) => void) => {
      const handler = (_: unknown, d: { active: boolean }) => cb(d)
      ipcRenderer.on('settings:api-key-updated', handler)
      return () => ipcRenderer.off('settings:api-key-updated', handler)
    },
  },

  settings: {
    getApiKey: () =>
      ipcRenderer.invoke('settings:get-api-key'),
    setApiKey: (key: string) =>
      ipcRenderer.invoke('settings:set-api-key', key),
    getCredits: () =>
      ipcRenderer.invoke('settings:get-credits'),
    useCredit: () =>
      ipcRenderer.invoke('settings:use-credit'),
    getDownloadQuality: () =>
      ipcRenderer.invoke('settings:get-download-quality'),
    setDownloadQuality: (quality: string) =>
      ipcRenderer.invoke('settings:set-download-quality', quality),
  },

  dashboard: {
    getStats: () =>
      ipcRenderer.invoke('dashboard:get-stats'),
    generateTasteSummary: () =>
      ipcRenderer.invoke('dashboard:generate-taste-summary'),
  },

  dev: {
    backfillTags: () =>
      ipcRenderer.invoke('dev:backfill-tags'),
  },

  folders: {
    getFolders: () =>
      ipcRenderer.invoke('library:get-folders'),
    createFolder: (name: string) =>
      ipcRenderer.invoke('library:create-folder', name),
    updateFolder: (id: string, patch: object) =>
      ipcRenderer.invoke('library:update-folder', id, patch),
    deleteFolder: (id: string) =>
      ipcRenderer.invoke('library:delete-folder', id),
    addTrackToFolder: (folderId: string, trackId: string) =>
      ipcRenderer.invoke('library:add-track-to-folder', folderId, trackId),
    removeTrackFromFolder: (folderId: string, trackId: string) =>
      ipcRenderer.invoke('library:remove-track-from-folder', folderId, trackId),
  },
})
