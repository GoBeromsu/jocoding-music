import { ipcMain } from 'electron'
import { folderStore } from '../lib/folder-store'

export function registerFolderHandlers(): void {
  ipcMain.handle('library:get-folders', () => {
    return folderStore.getAll()
  })

  ipcMain.handle('library:create-folder', (_, name: string) => {
    return folderStore.create(name)
  })

  ipcMain.handle('library:update-folder', (_, id: string, patch: { name: string }) => {
    folderStore.update(id, patch)
  })

  ipcMain.handle('library:delete-folder', (_, id: string) => {
    folderStore.delete(id)
  })

  ipcMain.handle('library:add-track-to-folder', (_, folderId: string, trackId: string) => {
    folderStore.addTrack(folderId, trackId)
  })

  ipcMain.handle('library:remove-track-from-folder', (_, folderId: string, trackId: string) => {
    folderStore.removeTrack(folderId, trackId)
  })
}
