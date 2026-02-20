import { useRef, useEffect, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { usePlayerStore } from '@/store/playerStore'
import { formatDuration } from '@/lib/utils'

export function PlayerBar() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const isSeeking = useRef(false)
  const {
    currentTrack, isPlaying, volume, currentTime, duration,
    play, pause, next, prev, setVolume, setCurrentTime, setDuration,
  } = usePlayerStore()

  const hasAudio = !currentTrack || currentTrack.hasAudio !== false

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack || !hasAudio) return

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

  const handleSeekChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(Number(e.target.value))
  }, [setCurrentTime])

  const handleSeekCommit = useCallback((e: React.PointerEvent<HTMLInputElement>) => {
    const ms = Number((e.target as HTMLInputElement).value)
    if (audioRef.current) audioRef.current.currentTime = ms / 1000
    isSeeking.current = false
  }, [])

  const coverUrl = currentTrack?.coverArtPath
    ? currentTrack.coverArtPath.startsWith('http')
      ? currentTrack.coverArtPath
      : `music://localhost/${encodeURIComponent(currentTrack.coverArtPath)}`
    : null

  return (
    <footer
      className="flex-shrink-0 flex items-center px-4 gap-4"
      style={{
        height: '72px',
        background: 'linear-gradient(to top, oklch(7% 0.004 60), oklch(10.5% 0.005 60))',
        borderTop: '1px solid oklch(15.5% 0.006 60)',
      }}
    >
      <audio
        ref={audioRef}
        onTimeUpdate={e => {
          if (!isSeeking.current)
            setCurrentTime((e.target as HTMLAudioElement).currentTime * 1000)
        }}
        onLoadedMetadata={e => setDuration((e.target as HTMLAudioElement).duration * 1000)}
        onEnded={next}
      />

      {/* Track info */}
      <div className="w-56 flex-shrink-0 flex items-center gap-3 min-w-0">
        {/* Album art */}
        <div
          className="w-11 h-11 rounded-md overflow-hidden flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, oklch(15.5% 0.006 60), oklch(22% 0.006 60))',
            boxShadow: currentTrack ? '0 2px 8px oklch(0% 0 0 / 0.4)' : 'none',
          }}
        >
          {coverUrl ? (
            <img src={coverUrl} alt="" className="w-full h-full object-cover" />
          ) : currentTrack ? (
            <div className="w-full h-full flex items-center justify-center text-lg" style={{ color: 'oklch(47% 0.003 60)' }}>
              ♩
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          {currentTrack ? (
            <>
              <p
                className="text-[13px] truncate leading-tight"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--color-neutral-100)',
                  letterSpacing: '0.01em',
                }}
              >
                {currentTrack.title ?? 'Unknown'}
              </p>
              <p className="text-[11px] truncate leading-tight mt-0.5" style={{ color: 'var(--color-neutral-500)' }}>
                {currentTrack.artistName ?? 'Unknown Artist'}
              </p>
              {!hasAudio && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full"
                  style={{
                    background: 'oklch(75% 0.145 68 / 0.12)',
                    color: 'var(--color-amber-400)',
                    border: '1px solid oklch(75% 0.145 68 / 0.2)',
                  }}
                >
                  메타데이터만
                </span>
              )}
            </>
          ) : (
            <p className="text-xs" style={{ color: 'oklch(34% 0.004 60)' }}>Nothing playing</p>
          )}
        </div>
      </div>

      {/* Controls + progress */}
      <div className="flex-1 flex flex-col items-center gap-1.5 max-w-[560px] mx-auto">
        <div className="flex items-center gap-6">
          <button
            onClick={prev}
            className="transition-all duration-150 hover:scale-110"
            style={{ color: 'oklch(47% 0.003 60)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-neutral-100)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'oklch(47% 0.003 60)')}
          >
            <SkipBack size={15} />
          </button>

          <button
            onClick={isPlaying ? pause : play}
            disabled={!currentTrack || !hasAudio}
            className="flex items-center justify-center transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'var(--color-neutral-100)',
              color: 'oklch(7% 0.004 60)',
              boxShadow: '0 2px 8px oklch(0% 0 0 / 0.3)',
            }}
            onMouseEnter={e => {
              if (!e.currentTarget.disabled) {
                ;(e.currentTarget as HTMLElement).style.background = 'var(--color-amber-400)'
                ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'
              }
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLElement).style.background = 'var(--color-neutral-100)'
              ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
            }}
          >
            {isPlaying
              ? <Pause size={13} fill="currentColor" />
              : <Play size={13} fill="currentColor" className="ml-0.5" />
            }
          </button>

          <button
            onClick={next}
            className="transition-all duration-150 hover:scale-110"
            style={{ color: 'oklch(47% 0.003 60)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-neutral-100)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'oklch(47% 0.003 60)')}
          >
            <SkipForward size={15} />
          </button>
        </div>

        {/* Seek bar */}
        <div className="flex items-center gap-2.5 w-full">
          <span
            className="text-[10px] w-9 text-right tabular-nums"
            style={{ fontFamily: 'var(--font-mono)', color: 'oklch(47% 0.003 60)' }}
          >
            {formatDuration(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            disabled={!hasAudio}
            onPointerDown={() => { isSeeking.current = true }}
            onPointerUp={handleSeekCommit}
            onChange={handleSeekChange}
            className="flex-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          />
          <span
            className="text-[10px] w-9 tabular-nums"
            style={{ fontFamily: 'var(--font-mono)', color: 'oklch(47% 0.003 60)' }}
          >
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 flex-shrink-0 w-28 justify-end">
        <button
          onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
          className="transition-colors duration-150"
          style={{ color: 'oklch(47% 0.003 60)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-neutral-100)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'oklch(47% 0.003 60)')}
        >
          {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={e => setVolume(Number(e.target.value))}
          className="w-20 cursor-pointer"
        />
      </div>
    </footer>
  )
}
