import { Toaster } from 'react-hot-toast'
import { Sidebar } from '@/components/layout/Sidebar'
import { MainContent } from '@/components/layout/MainContent'
import { PlayerBar } from '@/components/layout/PlayerBar'
import { useThemeStore } from '@/store/themeStore'
import { useIpcToasts } from '@/hooks/useIpcToasts'

export default function App() {
  const { resolved } = useThemeStore()
  useIpcToasts()
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
      <Toaster position="bottom-right" toastOptions={{ style: { background: resolved === 'light' ? '#f0f0f0' : '#262626', color: resolved === 'light' ? '#171717' : '#e5e5e5', fontSize: '13px', borderRadius: '8px' }, duration: 4000 }} />
    </div>
  )
}
