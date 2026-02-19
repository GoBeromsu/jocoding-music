import { Sidebar } from '@/components/layout/Sidebar'
import { MainContent } from '@/components/layout/MainContent'
import { PlayerBar } from '@/components/layout/PlayerBar'
import { useThemeStore } from '@/store/themeStore'

export default function App() {
  const { resolved } = useThemeStore()
  return (
    <div className={`flex flex-col h-screen bg-neutral-950 text-neutral-100 overflow-hidden select-none${resolved === 'light' ? ' light' : ''}`}>
      {/* macOS traffic light drag region */}
      <div
        className="flex-shrink-0 h-8 w-full"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>

      <PlayerBar />
    </div>
  )
}
