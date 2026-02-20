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
    <div className={`flex flex-col h-screen bg-surface text-on-surface overflow-hidden select-none${resolved === 'light' ? ' light' : ''}`}>
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
      <Toaster position="bottom-right" toastOptions={{ style: { background: 'var(--color-inverse-surface)', color: 'var(--color-inverse-on-surface)', fontSize: '13px', borderRadius: '8px' }, duration: 4000 }} />
    </div>
  )
}
