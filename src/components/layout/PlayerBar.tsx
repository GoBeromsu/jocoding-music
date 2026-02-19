import { useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ExternalLink } from 'lucide-react'
import { usePlayerStore } from '@/store/playerStore'
import { formatDuration } from '@/lib/utils'

export function PlayerBar() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const {
    currentTrack, isPlaying, volume, currentTime, duration,
    play, pause, next, prev, setVolume, setCurrentTime, setDuration,
  } = usePlayerStore()

  // Load & play when track changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    window.musicApp.player.getAudioUrl(currentTrack.id).then(url => {
      audio.src = url
      audio.load()
      audio.play().catch(() => {})
    })

    window.musicApp.player.updatePlayCount(currentTrack.id)

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title ?? '',
        artist: currentTrack.artistName ?? '',
        album: currentTrack.albumTitle ?? '',
      })
      navigator.mediaSession.setActionHandler('previoustrack', prev)
      navigator.mediaSession.setActionHandler('nexttrack', next)
      navigator.mediaSession.setActionHandler('play', play)
      navigator.mediaSession.setActionHandler('pause', pause)
    }
  }, [currentTrack?.id])

  // Sync play/pause
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) audio.play().catch(() => {})
    else audio.pause()
  }, [isPlaying])

  // Sync volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ms = Number(e.target.value)
    setCurrentTime(ms)
    if (audioRef.current) audioRef.current.currentTime = ms / 1000
  }

  const handleObsidian = async () => {
    if (!currentTrack) return
    const vault = await window.musicApp.obsidian.selectVault()
    if (!vault) return
    await window.musicApp.obsidian.createNote(
      currentTrack.id,
      vault,
      `## Notes\n\n> Playing: ${currentTrack.title}\n`
    )
    const notes = await window.musicApp.obsidian.getNotesByTrack(currentTrack.id)
    if (notes.length > 0) {
      await window.musicApp.obsidian.openNote(notes[0].notePath)
    }
  }

  return (
    <footer className="flex-shrink-0 h-20 bg-neutral-900 border-t border-neutral-800 flex items-center gap-4 px-6">
      <audio
        ref={audioRef}
        onTimeUpdate={e => setCurrentTime((e.target as HTMLAudioElement).currentTime * 1000)}
        onLoadedMetadata={e => setDuration((e.target as HTMLAudioElement).duration * 1000)}
        onEnded={next}
      />

      {/* Track info */}
      <div className="w-52 flex-shrink-0 min-w-0">
        {currentTrack ? (
          <>
            <p className="text-sm font-medium truncate text-neutral-100">{currentTrack.title ?? 'Unknown'}</p>
            <p className="text-xs truncate text-neutral-500">{currentTrack.artistName ?? 'Unknown Artist'}</p>
          </>
        ) : (
          <p className="text-xs text-neutral-600">No track selected</p>
        )}
      </div>

      {/* Controls + seek */}
      <div className="flex-1 flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-4">
          <button onClick={prev} className="text-neutral-400 hover:text-white transition-colors">
            <SkipBack size={18} />
          </button>
          <button
            onClick={isPlaying ? pause : play}
            className="w-9 h-9 rounded-full bg-white text-neutral-900 flex items-center justify-center hover:bg-neutral-200 transition-colors disabled:opacity-40"
            disabled={!currentTrack}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button onClick={next} className="text-neutral-400 hover:text-white transition-colors">
            <SkipForward size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 w-full max-w-md">
          <span className="text-xs text-neutral-500 w-10 text-right tabular-nums">
            {formatDuration(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 accent-white cursor-pointer"
          />
          <span className="text-xs text-neutral-500 w-10 tabular-nums">
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* Volume + Obsidian */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={e => setVolume(Number(e.target.value))}
            className="w-20 h-1 accent-white cursor-pointer"
          />
        </div>

        <button
          onClick={handleObsidian}
          disabled={!currentTrack}
          title="Open in Obsidian"
          className="text-neutral-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ExternalLink size={15} />
        </button>
      </div>
    </footer>
  )
}
