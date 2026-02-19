import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export interface FolderMeta {
  id: string
  name: string
  parentId: string | null
  trackIds: string[]
  createdAt: number
  modifiedAt: number
}

class FolderStore {
  private foldersPath = ''
  private cache: FolderMeta[] = []

  init(libraryPath: string): void {
    this.foldersPath = path.join(libraryPath, 'folders.json')
    this.load()
  }

  private load(): void {
    try {
      if (fs.existsSync(this.foldersPath)) {
        this.cache = JSON.parse(fs.readFileSync(this.foldersPath, 'utf-8')) as FolderMeta[]
      } else {
        this.cache = []
      }
    } catch {
      this.cache = []
    }
  }

  private save(): void {
    fs.writeFileSync(this.foldersPath, JSON.stringify(this.cache, null, 2), 'utf-8')
  }

  getAll(): FolderMeta[] {
    return [...this.cache]
  }

  get(id: string): FolderMeta | null {
    return this.cache.find(f => f.id === id) ?? null
  }

  create(name: string): FolderMeta {
    const folder: FolderMeta = {
      id: Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase(),
      name,
      parentId: null,
      trackIds: [],
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    }
    this.cache.push(folder)
    this.save()
    return folder
  }

  update(id: string, patch: Partial<Pick<FolderMeta, 'name'>>): void {
    const idx = this.cache.findIndex(f => f.id === id)
    if (idx === -1) return
    this.cache[idx] = { ...this.cache[idx], ...patch, modifiedAt: Date.now() }
    this.save()
  }

  delete(id: string): void {
    this.cache = this.cache.filter(f => f.id !== id)
    this.save()
  }

  addTrack(folderId: string, trackId: string): void {
    const folder = this.cache.find(f => f.id === folderId)
    if (!folder) return
    if (!folder.trackIds.includes(trackId)) {
      folder.trackIds.push(trackId)
      folder.modifiedAt = Date.now()
      this.save()
    }
  }

  removeTrack(folderId: string, trackId: string): void {
    const folder = this.cache.find(f => f.id === folderId)
    if (!folder) return
    folder.trackIds = folder.trackIds.filter(id => id !== trackId)
    folder.modifiedAt = Date.now()
    this.save()
  }
}

export const folderStore = new FolderStore()
