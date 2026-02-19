import { Music2, Disc3, Mic2, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLibraryStore } from '@/store/libraryStore'
import { ImportUrlDialog } from '@/components/ImportUrlDialog'
import { SettingsDialog } from '@/components/SettingsDialog'

type View = 'tracks' | 'albums' | 'artists'

const NAV_ITEMS: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: 'tracks',  label: 'All Tracks', icon: <Music2 size={16} /> },
  { id: 'albums',  label: 'Albums',     icon: <Disc3  size={16} /> },
  { id: 'artists', label: 'Artists',    icon: <Mic2   size={16} /> },
]

export function Sidebar() {
  const { activeView, setActiveView, scanFolder, scanProgress } = useLibraryStore()

  const handleAddFolder = async () => {
    const folder = await window.musicApp.system.selectFolder()
    if (folder) scanFolder(folder)
  }

  return (
    <aside className="w-52 flex-shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col py-4">
      <nav className="flex-1 space-y-0.5 px-2">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
              activeView === item.id
                ? 'bg-neutral-700 text-white'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {scanProgress && (
        <div className="px-4 py-2">
          <div className="text-xs text-neutral-500 mb-1">
            Scanning… {scanProgress.done}/{scanProgress.total}
          </div>
          <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{
                width: scanProgress.total > 0
                  ? `${(scanProgress.done / scanProgress.total) * 100}%`
                  : '0%'
              }}
            />
          </div>
        </div>
      )}

      <div className="px-3 border-t border-neutral-800 pt-3 mt-2 space-y-0.5" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={handleAddFolder}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-neutral-500 hover:bg-neutral-800 hover:text-white transition-colors"
        >
          <FolderOpen size={15} />
          Add Folder
        </button>
        <ImportUrlDialog />
        <SettingsDialog />
      </div>
    </aside>
  )
}
