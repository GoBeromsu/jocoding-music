import { useState, useRef, useEffect } from 'react'
import { Music2, BarChart2, Star, FolderOpen, Tag, Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLibraryStore } from '@/store/libraryStore'
import { ImportUrlDialog } from '@/components/ImportUrlDialog'
import { SettingsDialog } from '@/components/SettingsDialog'

export function Sidebar() {
  const {
    activeView, setActiveView,
    selectedFolderId, setSelectedFolder,
    folders, loadFolders, createFolder, updateFolder, deleteFolder,
    tracks,
  } = useLibraryStore()

  // Folder creation state
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const createInputRef = useRef<HTMLInputElement>(null)

  // Folder rename state
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  // Context menu for folders
  const [ctxFolder, setCtxFolder] = useState<{ id: string; x: number; y: number } | null>(null)

  useEffect(() => {
    loadFolders()
  }, [])

  useEffect(() => {
    if (isCreating) createInputRef.current?.focus()
  }, [isCreating])

  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus()
  }, [renamingId])

  // Dismiss ctx menu on outside click
  useEffect(() => {
    if (!ctxFolder) return
    const dismiss = () => setCtxFolder(null)
    window.addEventListener('click', dismiss)
    return () => window.removeEventListener('click', dismiss)
  }, [ctxFolder])

  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) { setIsCreating(false); return }
    await createFolder(name)
    setNewFolderName('')
    setIsCreating(false)
  }

  const handleRenameFolder = async () => {
    if (!renamingId) return
    const name = renameValue.trim()
    if (name) await updateFolder(renamingId, name)
    setRenamingId(null)
  }

  const handleDeleteFolder = async (id: string) => {
    await deleteFolder(id)
    setCtxFolder(null)
  }

  // Unique tags from all tracks
  const allTags = Array.from(new Set(tracks.flatMap(t => t.tags ?? []))).sort()

  const isLibraryActive = activeView === 'tracks'

  const navItemClass = (active: boolean) => cn(
    'w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs transition-colors text-left',
    active
      ? 'app-surface app-text'
      : 'app-muted hover:bg-[color:var(--app-surface-hover)] hover:text-[color:var(--app-text)]'
  )

  const handleSelectAll = () => {
    setActiveView('tracks')
    setSelectedFolder(null)
  }

  const handleSelectSpecial = (id: 'favorites' | 'uncategorized' | 'untagged') => {
    setActiveView('tracks')
    setSelectedFolder(id)
  }

  const handleSelectFolder = (id: string) => {
    setActiveView('tracks')
    setSelectedFolder(id)
  }

  const handleSelectTag = (tag: string) => {
    setActiveView('tracks')
    setSelectedFolder(`tag:${tag}`)
  }

  return (
    <aside className="w-52 flex-shrink-0 app-surface border-r border-[color:var(--app-border)] flex flex-col py-4 overflow-y-auto">
      {/* Logo */}
      <div className="px-4 mb-4 flex-shrink-0">
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-bold app-text tracking-tight leading-none">Umgam</span>
          <span className="text-[10px] app-muted tracking-widest leading-none">MUSIC AGENT</span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-shrink-0 px-2 mb-1">
        {/* 내 음악 group */}
        <button
          onClick={handleSelectAll}
          className={navItemClass(isLibraryActive && selectedFolderId === null)}
        >
          <Music2 size={14} />
          <span>내 음악</span>
        </button>
        <div className="ml-3 space-y-0.5 mt-0.5">
          <button
            onClick={() => handleSelectSpecial('favorites')}
            className={navItemClass(isLibraryActive && selectedFolderId === 'favorites')}
          >
            <Star size={12} className="app-accent" />
            <span>즐겨찾기</span>
          </button>
          <button
            onClick={() => handleSelectSpecial('uncategorized')}
            className={navItemClass(isLibraryActive && selectedFolderId === 'uncategorized')}
          >
            <span className="w-3 h-3 inline-block text-center app-muted">·</span>
            <span>미분류</span>
          </button>
          <button
            onClick={() => handleSelectSpecial('untagged')}
            className={navItemClass(isLibraryActive && selectedFolderId === 'untagged')}
          >
            <span className="w-3 h-3 inline-block text-center app-muted">·</span>
            <span>태그 없음</span>
          </button>
        </div>

        {/* 취향 */}
        <button
          onClick={() => setActiveView('dashboard')}
          className={cn(navItemClass(activeView === 'dashboard'), 'mt-1')}
        >
          <BarChart2 size={14} />
          <span>취향</span>
        </button>
      </nav>

      {/* Folders section */}
      <div className="flex-shrink-0 px-2 mt-3">
        <div className="flex items-center justify-between px-2 mb-1">
          <div className="flex items-center gap-1.5">
            <FolderOpen size={11} className="app-muted" />
            <span className="text-[10px] app-muted uppercase tracking-wider">폴더</span>
            {folders.length > 0 && (
              <span className="text-[9px] app-muted">({folders.length})</span>
            )}
          </div>
          <button
            onClick={() => { setIsCreating(true); setNewFolderName('') }}
            className="app-muted hover:text-[color:var(--app-text)] transition-colors p-0.5 rounded"
            title="새 폴더"
          >
            <Plus size={12} />
          </button>
        </div>

        {/* Inline folder create input */}
        {isCreating && (
          <div className="flex items-center gap-1 px-2 mb-1">
            <input
              ref={createInputRef}
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateFolder()
                if (e.key === 'Escape') setIsCreating(false)
              }}
              placeholder="폴더 이름"
              className="flex-1 app-surface app-border app-text rounded px-2 py-1 text-xs focus:outline-none focus:border-[color:var(--app-accent)]"
            />
                  <button onClick={handleCreateFolder} className="app-accent hover:brightness-110">
                    <Check size={12} />
                  </button>
            <button onClick={() => setIsCreating(false)} className="app-muted hover:text-[color:var(--app-text)]">
                  <X size={12} />
                </button>
              </div>
        )}

        {/* Folder list */}
        <div className="space-y-0.5">
          {folders.map(folder => (
            <div key={folder.id} className="relative">
              {renamingId === folder.id ? (
                <div className="flex items-center gap-1 px-2">
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRenameFolder()
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                    className="flex-1 app-surface app-border app-text rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-[color:var(--app-accent)]"
                  />
                  <button onClick={handleRenameFolder} className="app-accent hover:brightness-110">
                    <Check size={11} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleSelectFolder(folder.id)}
                  onContextMenu={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    setCtxFolder({ id: folder.id, x: e.clientX, y: e.clientY })
                  }}
                  className={cn(
                    navItemClass(isLibraryActive && selectedFolderId === folder.id),
                    'justify-between group'
                  )}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <FolderOpen size={12} className="flex-shrink-0" />
                    <span className="truncate">{folder.name}</span>
                  </span>
                  <span className="text-[9px] app-muted flex-shrink-0">
                    {folder.trackIds.length}
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tags section */}
      {allTags.length > 0 && (
        <div className="flex-shrink-0 px-2 mt-3">
          <div className="flex items-center gap-1.5 px-2 mb-1">
            <Tag size={11} className="app-muted" />
            <span className="text-[10px] app-muted uppercase tracking-wider">태그</span>
          </div>
          <div className="space-y-0.5">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleSelectTag(tag)}
                className={navItemClass(isLibraryActive && selectedFolderId === `tag:${tag}`)}
              >
                <span className="text-[9px] px-1.5 py-0.5 app-surface rounded-full leading-none app-muted">#</span>
                <span className="truncate">{tag}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom actions */}
        <div
          className="mt-auto flex-shrink-0 px-3 border-t border-[color:var(--app-border)] pt-3 space-y-0.5"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <ImportUrlDialog />
        <SettingsDialog />
      </div>

      {/* Folder context menu */}
      {ctxFolder && (
        <div
          className="ctx-menu fixed z-50"
          style={{ top: ctxFolder.y, left: ctxFolder.x }}
          onClick={e => e.stopPropagation()}
        >
          <button
            className="ctx-menu-item flex items-center gap-2"
            onClick={() => {
              const folder = folders.find(f => f.id === ctxFolder.id)
              if (folder) { setRenamingId(folder.id); setRenameValue(folder.name) }
              setCtxFolder(null)
            }}
          >
            <Pencil size={11} />
            이름 변경
          </button>
          <button
            className="ctx-menu-item-danger flex items-center gap-2"
            onClick={() => handleDeleteFolder(ctxFolder.id)}
          >
            <Trash2 size={11} />
            삭제
          </button>
        </div>
      )}
    </aside>
  )
}
