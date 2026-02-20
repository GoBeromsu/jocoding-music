import { useRef, useEffect, useCallback, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { usePlayerStore } from '@/store/playerStore'
import type { Track } from '@/types/index'
import { formatDuration } from '@/lib/utils'

const canPlayTrack = (track: Track | null): boolean => {
  return !!track && track.hasAudio !== false && !!track.filePath
}

export function PlayerBar() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const isSeeking = useRef(false)
  const lastPlayedTrackId = useRef<string | null>(null)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string>('')
  const {
    currentTrack, isPlaying, volume, currentTime, duration,
    play, pause, next, prev, setVolume, setCurrentTime, setDuration,
  } = usePlayerStore()

  const playable = canPlayTrack(currentTrack)
  const currentTrackId = currentTrack?.id

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (!currentTrack) {
      audio.pause()
      audio.removeAttribute('src')
      setAudioUrl('')
      setAudioError(null)
      lastPlayedTrackId.current = null
      return
    }

    if (!playable) {
      audio.pause()
      audio.src = ''
      setAudioError(currentTrack.hasAudio === false
        ? '오디오가 없는 메타데이터 트랙입니다.'
        : '오디오 파일 경로가 없습니다.')
      setAudioUrl('')
      lastPlayedTrackId.current = null
      return
    }

    setAudioError(null)

    let cancelled = false
    window.musicApp.player.getAudioUrl(currentTrack.id).then((res) => {
      if (cancelled || res.trackId !== currentTrackId) return
      if (!res.url || !res.hasAudio) {
        setAudioError(res.error ?? '오디오를 사용할 수 없습니다.')
        setAudioUrl('')
        return
      }

      setAudioUrl(res.url)
    }).catch(() => {
      if (cancelled) return
      setAudioError('오디오 준비에 실패했습니다.')
      setAudioUrl('')
    })

    return () => {
      cancelled = true
    }
  }, [currentTrackId, currentTrack?.filePath, currentTrack?.hasAudio])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack || !playable || !audioUrl) return

    if (audio.src !== audioUrl) {
      audio.src = audioUrl
      audio.load()
    }

    if (isPlaying) {
      audio.play().then(() => {
        if (lastPlayedTrackId.current !== currentTrack.id) {
          window.musicApp.player.updatePlayCount(currentTrack.id)
          lastPlayedTrackId.current = currentTrack.id

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
        }
      }).catch(() => {
        setAudioError('오디오를 재생할 수 없습니다.')
      })
    } else {
      audio.pause()
    }
  }, [isPlaying, currentTrackId, audioUrl])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
  }, [volume])

  const handleSeekChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(Number(e.target.value))
  }, [setCurrentTime])

  const handleSeekCommit = useCallback((e: React.PointerEvent<HTMLInputElement>) => {
    const ms = Number((e.target as HTMLInputElement).value)
    if (audioRef.current) audioRef.current.currentTime = ms / 1000
    isSeeking.current = false
  }, [setCurrentTime])

  const coverUrl = currentTrack?.coverArtPath
    ? currentTrack.coverArtPath.startsWith('http')
      ? currentTrack.coverArtPath
      : `music://localhost/${encodeURIComponent(currentTrack.coverArtPath)}`
    : null

  return (
    <footer
      className="flex-shrink-0 flex items-center px-4 gap-4 bg-gradient-to-b from-surface-container-highest to-surface-container-high border-t border-outline-variant shadow-[0_-4px_24px_rgb(0_0_0/0.35)]"
      style={{ height: '72px' }}
    >
      <audio
        ref={audioRef}
        onError={() => setAudioError('오디오를 재생할 수 없습니다.')}
        onTimeUpdate={e => {
          if (!isSeeking.current) {
            setCurrentTime((e.target as HTMLAudioElement).currentTime * 1000)
          }
        }}
        onLoadedMetadata={e => setDuration((e.target as HTMLAudioElement).duration * 1000)}
        onEnded={next}
      />

      <div className="w-56 flex-shrink-0 flex items-center gap-3 min-w-0">
        <div
          className="w-11 h-11 rounded-md overflow-hidden flex-shrink-0 bg-surface-container"
          style={currentTrack ? { boxShadow: '0 2px 8px oklch(0% 0 0 / 0.4)' } : undefined}
        >
          {coverUrl ? (
            <img src={coverUrl} alt="" className="w-full h-full object-cover" />
          ) : currentTrack ? (
            <div className="w-full h-full flex items-center justify-center text-lg text-on-surface-variant">♩</div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          {currentTrack ? (
            <>
              <p className="text-[13px] truncate leading-tight font-display text-on-surface tracking-[0.01em]">
                {currentTrack.title ?? 'Unknown'}
              </p>
              <p className="text-[11px] truncate leading-tight mt-0.5 text-outline">
                {currentTrack.artistName ?? 'Unknown Artist'}
              </p>
              {audioError && (
                <p className="text-[10px] truncate mt-0.5 text-error">{audioError}</p>
              )}
            </>
          ) : (
            <p className="text-xs text-on-surface-variant">Nothing playing</p>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center gap-1.5 max-w-[560px] mx-auto">
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              if (audioRef.current && audioRef.current.currentTime > 3) {
                audioRef.current.currentTime = 0
                setCurrentTime(0)
                return
              }
              prev()
            }}
            disabled={!currentTrack}
            className="text-on-surface-variant hover:text-on-surface hover:scale-110 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <SkipBack size={15} />
          </button>

          <button
            onClick={isPlaying ? pause : play}
            disabled={!currentTrack || !playable}
            className="flex items-center justify-center w-[34px] h-[34px] rounded-full bg-on-surface text-surface shadow-[0_2px_8px_rgb(0_0_0/0.3)] transition-all duration-150 hover:bg-primary hover:text-on-primary hover:scale-[1.08] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPlaying
              ? <Pause size={13} fill="currentColor" />
              : <Play size={13} fill="currentColor" className="ml-0.5" />}
          </button>

          <button
            onClick={next}
            disabled={!currentTrack}
            className="text-on-surface-variant hover:text-on-surface hover:scale-110 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <SkipForward size={15} />
          </button>
        </div>

        <div className="flex items-center gap-2.5 w-full">
          <span className="text-[10px] w-9 text-right tabular-nums font-mono text-on-surface-variant">
            {formatDuration(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            disabled={!playable}
            onPointerDown={() => { isSeeking.current = true }}
            onPointerUp={handleSeekCommit}
            onChange={handleSeekChange}
            className="flex-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          />
          <span className="text-[10px] w-9 tabular-nums font-mono text-on-surface-variant">
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 w-28 justify-end">
        <button
          onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
          className="text-outline hover:text-on-surface transition-colors duration-150"
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
