import { useEffect, useState } from 'react'
import { BarChart2, Music2, Zap, Sparkles, RefreshCw, Clock } from 'lucide-react'
import type { DashboardStats } from '@/types/index'

function formatPlayTime(ms: number): string {
  const hours = Math.floor(ms / 3600000)
  const mins = Math.floor((ms % 3600000) / 60000)
  if (hours > 0) return `${hours}시간 ${mins}분`
  if (mins > 0) return `${mins}분`
  return '—'
}

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
          URL에서 음악을 가져오면 AI가 자동으로 장르·무드를 분류하고<br />
          여기에 취향 리포트가 쌓입니다.
        </p>
      </div>
    )
  }

  const maxGenrePlay = stats.topGenres[0]?.playCount || 1
  const maxMoodPlay = stats.topMoods[0]?.playCount || 1
  const maxPlayCount = stats.topTracks[0]?.playCount || 1

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-5">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-lg font-semibold text-neutral-100">My Taste</h1>
            <p className="text-xs text-neutral-600 mt-0.5">AI가 분석한 내 음악 취향</p>
          </div>
          <button
            onClick={handleGenerateSummary}
            disabled={summaryLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs hover:bg-violet-600/30 transition-colors disabled:opacity-50"
          >
            {summaryLoading
              ? <RefreshCw size={11} className="animate-spin" />
              : <Sparkles size={11} />}
            {summaryLoading ? '분석 중…' : 'AI 취향 분석'}
          </button>
        </div>

        {/* AI Taste Summary Card */}
        {(tasteSummary || summaryLoading || summaryError) && (
          <div className="relative rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 to-blue-950/30 p-4 overflow-hidden">
            <div className="absolute top-2 right-3 text-violet-600/30 text-3xl select-none">✦</div>
            <div className="flex items-start gap-2.5">
              <Sparkles size={14} className="text-violet-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-violet-400 uppercase tracking-wider font-medium mb-1.5">AI 취향 분석</p>
                {summaryLoading ? (
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span className="inline-block w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
                    <span className="inline-block w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse delay-75" />
                    <span className="inline-block w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse delay-150" />
                    <span className="ml-1 text-neutral-600">당신의 취향을 분석하고 있어요…</span>
                  </div>
                ) : summaryError ? (
                  <p className="text-xs text-red-400">{summaryError}</p>
                ) : (
                  <p className="text-sm text-neutral-200 leading-relaxed">{tasteSummary}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="총 트랙" value={stats.totalTracks.toString()} />
          <StatCard
            label="분류된 트랙"
            value={`${stats.taggedTracks}`}
            sub={`${stats.totalTracks > 0 ? Math.round((stats.taggedTracks / stats.totalTracks) * 100) : 0}% tagged`}
          />
          <StatCard
            label="총 재생 시간"
            value={stats.totalPlayMs > 0 ? formatPlayTime(stats.totalPlayMs) : '—'}
            sub={stats.totalPlayCount > 0 ? `${stats.totalPlayCount}회 재생` : undefined}
          />
        </div>

        {/* Genre distribution */}
        {stats.topGenres.length > 0 && (
          <Section title="장르 분포" icon={<Music2 size={13} className="text-violet-400" />}>
            <div className="space-y-3">
              {stats.topGenres.map(({ genre, trackCount, playCount }) => (
                <div key={genre}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-neutral-300 font-medium">{genre}</span>
                    <div className="flex items-center gap-2 text-[10px] text-neutral-600">
                      <span>{trackCount}곡</span>
                      {playCount > 0 && <span className="text-violet-500">{playCount}회 재생</span>}
                    </div>
                  </div>
                  {/* Play-weighted bar (prominent) */}
                  <div className="relative h-2 bg-neutral-800 rounded-full overflow-hidden">
                    {/* Track count background bar */}
                    <div
                      className="absolute inset-y-0 left-0 bg-neutral-700 rounded-full"
                      style={{ width: `${(trackCount / (stats.topGenres[0]?.trackCount || 1)) * 100}%` }}
                    />
                    {/* Play count foreground bar */}
                    <div
                      className="absolute inset-y-0 left-0 bg-violet-500 rounded-full transition-all duration-700"
                      style={{ width: `${(playCount / maxGenrePlay) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-neutral-700 mt-3">보라 = 재생 횟수 · 회색 = 보유 곡 수</p>
          </Section>
        )}

        {/* Mood distribution */}
        {stats.topMoods.length > 0 && (
          <Section title="무드 분포" icon={<Zap size={13} className="text-blue-400" />}>
            <div className="space-y-3">
              {stats.topMoods.map(({ mood, trackCount, playCount }) => (
                <div key={mood}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-neutral-300 font-medium">{mood}</span>
                    <div className="flex items-center gap-2 text-[10px] text-neutral-600">
                      <span>{trackCount}곡</span>
                      {playCount > 0 && <span className="text-blue-500">{playCount}회 재생</span>}
                    </div>
                  </div>
                  <div className="relative h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-neutral-700 rounded-full"
                      style={{ width: `${(trackCount / (stats.topMoods[0]?.trackCount || 1)) * 100}%` }}
                    />
                    <div
                      className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all duration-700"
                      style={{ width: `${(playCount / maxMoodPlay) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-neutral-700 mt-3">파랑 = 재생 횟수 · 회색 = 보유 곡 수</p>
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
                            <span className="text-[9px] text-violet-400">{t.genre}</span>
                          )}
                          {t.genre && t.mood && <span className="text-[9px] text-neutral-700">·</span>}
                          {t.mood && (
                            <span className="text-[9px] text-blue-400">{t.mood}</span>
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
            <p className="text-xs mt-1">Import from URL로 가져오면 자동으로 분류됩니다.</p>
          </div>
        )}

      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5">
      <p className="text-[10px] text-neutral-600 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-semibold text-neutral-100 leading-none">{value}</p>
      {sub && <p className="text-[10px] text-neutral-600 mt-1.5">{sub}</p>}
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
