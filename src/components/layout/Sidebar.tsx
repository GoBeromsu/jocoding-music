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
      ? 'bg-neutral-700 text-neutral-100'
      : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'
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
    <aside className="w-52 flex-shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col py-4 overflow-y-auto">
      {/* Logo */}
      <div className="px-4 mb-4 flex-shrink-0">
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-bold text-neutral-100 tracking-tight leading-none">음감</span>
          <span className="text-[10px] text-neutral-500 tracking-widest leading-none">音感</span>
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
            <Star size={12} className="text-amber-400" />
            <span>즐겨찾기</span>
          </button>
          <button
            onClick={() => handleSelectSpecial('uncategorized')}
            className={navItemClass(isLibraryActive && selectedFolderId === 'uncategorized')}
          >
            <span className="w-3 h-3 inline-block text-center text-neutral-500">·</span>
            <span>미분류</span>
          </button>
          <button
            onClick={() => handleSelectSpecial('untagged')}
            className={navItemClass(isLibraryActive && selectedFolderId === 'untagged')}
          >
            <span className="w-3 h-3 inline-block text-center text-neutral-500">·</span>
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
            <FolderOpen size={11} className="text-neutral-500" />
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">폴더</span>
            {folders.length > 0 && (
              <span className="text-[9px] text-neutral-600">({folders.length})</span>
            )}
          </div>
          <button
            onClick={() => { setIsCreating(true); setNewFolderName('') }}
            className="text-neutral-500 hover:text-neutral-300 transition-colors p-0.5 rounded"
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
              className="flex-1 bg-neutral-800 border border-neutral-600 rounded px-2 py-1 text-xs text-neutral-100 focus:outline-none focus:border-neutral-400"
            />
            <button onClick={handleCreateFolder} className="text-green-500 hover:text-green-400">
              <Check size={12} />
            </button>
            <button onClick={() => setIsCreating(false)} className="text-neutral-500 hover:text-neutral-300">
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
                    className="flex-1 bg-neutral-800 border border-neutral-600 rounded px-1.5 py-0.5 text-xs text-neutral-100 focus:outline-none focus:border-neutral-400"
                  />
                  <button onClick={handleRenameFolder} className="text-green-500 hover:text-green-400">
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
                  <span className="text-[9px] text-neutral-600 flex-shrink-0">
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
            <Tag size={11} className="text-neutral-500" />
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">태그</span>
          </div>
          <div className="space-y-0.5">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleSelectTag(tag)}
                className={navItemClass(isLibraryActive && selectedFolderId === `tag:${tag}`)}
              >
                <span className="text-[9px] px-1.5 py-0.5 bg-neutral-700 rounded-full leading-none text-neutral-400">#</span>
                <span className="truncate">{tag}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom actions */}
      <div
        className="mt-auto flex-shrink-0 px-3 border-t border-neutral-800 pt-3 mt-2 space-y-0.5"
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
