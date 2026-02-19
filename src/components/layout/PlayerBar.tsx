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

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) audio.play().catch(() => {})
    else audio.pause()
  }, [isPlaying])

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

  const coverUrl = currentTrack?.coverArtPath
    ? `music://localhost/${encodeURIComponent(currentTrack.coverArtPath)}`
    : null

  return (
    <footer className="flex-shrink-0 h-[72px] bg-neutral-900 border-t border-neutral-800 flex items-center px-4 gap-3">
      <audio
        ref={audioRef}
        onTimeUpdate={e => setCurrentTime((e.target as HTMLAudioElement).currentTime * 1000)}
        onLoadedMetadata={e => setDuration((e.target as HTMLAudioElement).duration * 1000)}
        onEnded={next}
      />

      {/* Track info with album art */}
      <div className="w-56 flex-shrink-0 flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-md overflow-hidden bg-neutral-800 flex-shrink-0">
          {coverUrl ? (
            <img src={coverUrl} alt="" className="w-full h-full object-cover" />
          ) : currentTrack ? (
            <div className="w-full h-full flex items-center justify-center text-neutral-600 text-lg">♪</div>
          ) : null}
        </div>
        <div className="min-w-0">
          {currentTrack ? (
            <>
              <p className="text-[13px] font-medium truncate text-neutral-100 leading-tight">
                {currentTrack.title ?? 'Unknown'}
              </p>
              <p className="text-[11px] truncate text-neutral-500 leading-tight mt-0.5">
                {currentTrack.artistName ?? 'Unknown Artist'}
              </p>
            </>
          ) : (
            <p className="text-xs text-neutral-600">No track selected</p>
          )}
        </div>
      </div>

      {/* Controls + progress */}
      <div className="flex-1 flex flex-col items-center gap-1 max-w-[600px] mx-auto">
        <div className="flex items-center gap-5">
          <button onClick={prev} className="text-neutral-400 hover:text-white transition-colors">
            <SkipBack size={16} />
          </button>
          <button
            onClick={isPlaying ? pause : play}
            className="w-8 h-8 rounded-full bg-white text-neutral-900 flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-40"
            disabled={!currentTrack}
          >
            {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
          </button>
          <button onClick={next} className="text-neutral-400 hover:text-white transition-colors">
            <SkipForward size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 w-full">
          <span className="text-[10px] text-neutral-500 w-9 text-right tabular-nums">
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
          <span className="text-[10px] text-neutral-500 w-9 tabular-nums">
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* Volume + Obsidian */}
      <div className="flex items-center gap-2 flex-shrink-0 w-40 justify-end">
        <button
          onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          {volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
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
        <button
          onClick={handleObsidian}
          disabled={!currentTrack}
          title="Open in Obsidian"
          className="text-neutral-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed ml-1"
        >
          <ExternalLink size={14} />
        </button>
      </div>
    </footer>
  )
}
