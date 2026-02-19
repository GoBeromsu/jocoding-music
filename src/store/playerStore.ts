import { create } from 'zustand'
import type { Track } from '@/types/index'

interface PlayerState {
  currentTrack: Track | null
  queue: Track[]
  queueIndex: number
  isPlaying: boolean
  volume: number
  currentTime: number  // ms
  duration: number     // ms

  setTrack: (track: Track, queue?: Track[]) => void
  play: () => void
  pause: () => void
  next: () => void
  prev: () => void
  setVolume: (v: number) => void
  setCurrentTime: (ms: number) => void
  setDuration: (ms: number) => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  volume: 0.8,
  currentTime: 0,
  duration: 0,

  setTrack: (track, queue) => {
    const q = queue ?? get().queue
    set({
      currentTrack: track,
      queue: q,
      queueIndex: q.findIndex(t => t.id === track.id),
      isPlaying: true,
      currentTime: 0,
    })
  },

  play:  () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),

  next: () => {
    const { queue, queueIndex } = get()
    if (queueIndex < queue.length - 1) {
      set({ currentTrack: queue[queueIndex + 1], queueIndex: queueIndex + 1, currentTime: 0, isPlaying: true })
    }
  },

  prev: () => {
    const { queue, queueIndex, currentTime } = get()
    if (currentTime > 3000) {
      // >3s played: restart current track
      set({ currentTime: 0 })
      return
    }
    if (queueIndex > 0) {
      set({ currentTrack: queue[queueIndex - 1], queueIndex: queueIndex - 1, currentTime: 0, isPlaying: true })
    }
  },

  setVolume:      (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
  setCurrentTime: (ms) => set({ currentTime: ms }),
  setDuration:    (ms) => set({ duration: ms }),
}))
