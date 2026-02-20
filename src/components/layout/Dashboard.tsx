import { useEffect, useState } from 'react'
import { BarChart2, Music2, Zap, Sparkles, RefreshCw, Clock } from 'lucide-react'
import type { DashboardStats } from '@/types/index'

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  const days = Math.floor(diff / 86400000)
  if (days === 0) return '오늘'
  if (days === 1) return '어제'
  if (days < 7) return `${days}일 전`
  return `${Math.floor(days / 7)}주 전`
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [tasteSummary, setTasteSummary] = useState<string | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  useEffect(() => {
    window.musicApp.dashboard.getStats().then(s => {
      setStats(s)
      setLoading(false)
    })
  }, [])

  const handleGenerateSummary = async () => {
    setSummaryLoading(true)
    setSummaryError(null)
    try {
      const summary = await window.musicApp.dashboard.generateTasteSummary()
      setTasteSummary(summary)
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : 'AI 분석 실패')
    } finally {
      setSummaryLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-600 text-sm">
        Loading…
      </div>
    )
  }

  if (!stats || stats.totalTracks === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-neutral-600 gap-3 p-8">
        <BarChart2 size={40} className="text-neutral-800" />
        <p className="text-sm text-center">취향 데이터가 없습니다.</p>
        <p className="text-xs text-neutral-700 text-center">
          노래를 추가하면 AI가 장르와 무드를 분석해 취향 리포트를 만들어드립니다.
        </p>
      </div>
    )
  }

  const maxGenreCount = stats.topGenres[0]?.trackCount || 1
  const maxMoodCount = stats.topMoods[0]?.trackCount || 1
  const maxPlayCount = stats.topTracks[0]?.playCount || 1

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-5">

        {/* Hero: AI Taste Summary */}
        <div
          className="relative rounded-2xl overflow-hidden border p-6"
          style={{
            background: 'linear-gradient(135deg, oklch(12% 0.015 70) 0%, oklch(10% 0.01 60) 60%, oklch(9% 0.008 40) 100%)',
            borderColor: 'oklch(75% 0.145 68 / 0.2)',
          }}
        >
          {/* Decorative glow */}
          <div
            className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'oklch(75% 0.145 68 / 0.06)' }}
          />
          <div className="absolute top-3 right-4 select-none leading-none text-5xl" style={{ color: 'oklch(75% 0.145 68 / 0.12)' }}>♩</div>

          <div className="relative">
            <p className="text-[10px] uppercase tracking-widest font-medium mb-3 flex items-center gap-1.5" style={{ color: 'var(--color-amber-400)' }}>
              <Sparkles size={10} />
              AI 취향 분석
            </p>
            {tasteSummary ? (
              <p className="text-lg text-neutral-100 leading-relaxed font-light" style={{ fontFamily: 'var(--font-display)' }}>{tasteSummary}</p>
            ) : summaryLoading ? (
              <div className="flex items-center gap-2.5">
                <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-amber-500)' }} />
                <span className="inline-block w-2 h-2 rounded-full animate-pulse delay-75" style={{ background: 'var(--color-amber-500)' }} />
                <span className="inline-block w-2 h-2 rounded-full animate-pulse delay-150" style={{ background: 'var(--color-amber-500)' }} />
                <span className="text-sm text-neutral-500 ml-1">당신의 취향을 분석하고 있어요…</span>
              </div>
            ) : summaryError ? (
              <p className="text-sm text-red-400">{summaryError}</p>
            ) : (
              <div>
                <p className="text-base text-neutral-400 leading-relaxed mb-4">
                  내 취향을 AI가 한 문장으로 정리해 드릴게요.
                </p>
                <button
                  onClick={handleGenerateSummary}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    background: 'oklch(75% 0.145 68 / 0.15)',
                    border: '1px solid oklch(75% 0.145 68 / 0.3)',
                    color: 'var(--color-amber-300)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'oklch(75% 0.145 68 / 0.22)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'oklch(75% 0.145 68 / 0.15)')}
                >
                  <Sparkles size={13} />
                  내 취향 분석하기
                  <span className="text-[10px] ml-1" style={{ color: 'var(--color-amber-500)' }}>크레딧 1</span>
                </button>
              </div>
            )}
            {tasteSummary && (
              <button
                onClick={handleGenerateSummary}
                disabled={summaryLoading}
                className="mt-4 flex items-center gap-1.5 text-[10px] transition-colors disabled:opacity-50"
                style={{ color: 'var(--color-amber-500)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-amber-300)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-amber-500)')}
              >
                <RefreshCw size={9} className={summaryLoading ? 'animate-spin' : ''} />
                다시 분석
              </button>
            )}
          </div>
        </div>

        {/* Genre distribution */}
        {stats.topGenres.length > 0 && (
          <Section title="장르" icon={<Music2 size={13} style={{ color: 'var(--color-amber-400)' }} />}>
            <div className="space-y-3">
              {stats.topGenres.map(({ genre, trackCount }) => (
                <div key={genre}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-neutral-200 font-medium">{genre}</span>
                    <span className="text-[10px] text-neutral-600">{trackCount}곡</span>
                  </div>
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(trackCount / maxGenreCount) * 100}%`,
                        background: 'var(--color-amber-500)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Mood distribution */}
        {stats.topMoods.length > 0 && (
          <Section title="무드" icon={<Zap size={13} style={{ color: 'var(--color-rose-400)' }} />}>
            <div className="space-y-3">
              {stats.topMoods.map(({ mood, trackCount }) => (
                <div key={mood}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-neutral-200 font-medium">{mood}</span>
                    <span className="text-[10px] text-neutral-600">{trackCount}곡</span>
                  </div>
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(trackCount / maxMoodCount) * 100}%`,
                        background: 'var(--color-rose-400)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Most played */}
          {stats.topTracks.length > 0 && (
            <Section title="많이 들은 곡" icon={<BarChart2 size={13} className="text-yellow-400" />}>
              <div className="space-y-3">
                {stats.topTracks.map((t, i) => (
                  <div key={t.id}>
                    <div className="flex items-start gap-2 mb-1">
                      <span className="text-[10px] text-neutral-600 w-3.5 flex-shrink-0 mt-0.5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-neutral-200 truncate leading-tight">{t.title ?? 'Unknown'}</p>
                        <p className="text-[10px] text-neutral-600 truncate">{t.artistName ?? '—'}</p>
                      </div>
                      <span className="text-[10px] text-neutral-600 flex-shrink-0">{t.playCount}회</span>
                    </div>
                    <div className="ml-5 h-1 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500/60 rounded-full transition-all duration-700"
                        style={{ width: `${(t.playCount / maxPlayCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Recent additions */}
          {stats.recentTracks.length > 0 && (
            <Section title="최근 추가" icon={<Clock size={13} className="text-green-400" />}>
              <div className="space-y-3">
                {stats.recentTracks.map((t) => {
                  const coverUrl = t.coverArtPath
                    ? `music://localhost/${encodeURIComponent(t.coverArtPath)}`
                    : null
                  return (
                    <div key={t.id} className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-neutral-800 flex-shrink-0 overflow-hidden">
                        {coverUrl
                          ? <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-neutral-600 text-sm">♪</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-neutral-200 truncate leading-tight">{t.title ?? 'Unknown'}</p>
                        <div className="flex items-center gap-1.5">
                          {t.genre && (
                            <span className="text-[9px]" style={{ color: 'var(--color-amber-400)' }}>{t.genre}</span>
                          )}
                          {t.genre && t.mood && <span className="text-[9px] text-neutral-700">·</span>}
                          {t.mood && (
                            <span className="text-[9px]" style={{ color: 'var(--color-rose-400)' }}>{t.mood}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[9px] text-neutral-700 flex-shrink-0">{timeAgo(t.dateAdded)}</span>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}
        </div>

        {/* No genre data hint */}
        {stats.topGenres.length === 0 && stats.totalTracks > 0 && (
          <div className="text-center py-6 border border-dashed border-neutral-800 rounded-xl text-neutral-700">
            <p className="text-sm">아직 AI 분류 데이터가 없습니다.</p>
            <p className="text-xs mt-1">노래를 추가하면 자동으로 분류됩니다.</p>
          </div>
        )}

      </div>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">{title}</h2>
      </div>
      {children}
    </div>
  )
}
