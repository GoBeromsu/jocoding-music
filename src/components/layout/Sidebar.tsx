import { Music2, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLibraryStore, type View } from '@/store/libraryStore'
import { ImportUrlDialog } from '@/components/ImportUrlDialog'
import { SettingsDialog } from '@/components/SettingsDialog'

const NAV_ITEMS: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: 'tracks',    label: '내 음악',    icon: <Music2    size={16} /> },
  { id: 'dashboard', label: '취향', icon: <BarChart2 size={16} /> },
]

export function Sidebar() {
  const { activeView, setActiveView } = useLibraryStore()

  return (
    <aside className="w-52 flex-shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col py-4">
      <div className="px-4 mb-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-bold text-neutral-100 tracking-tight leading-none">음감</span>
          <span className="text-[10px] text-neutral-500 tracking-widest leading-none">音感</span>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-2">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
              activeView === item.id
                ? 'bg-neutral-700 text-neutral-100'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div
        className="px-3 border-t border-neutral-800 pt-3 mt-2 space-y-0.5"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <ImportUrlDialog />
        <SettingsDialog />
      </div>
    </aside>
  )
}
