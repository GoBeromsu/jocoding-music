import OpenAI from 'openai'
import { settingsStore } from './settings-store'

export interface AgentInput {
  title: string
  artist: string
  sourceUrl: string
  sourcePlatform: string
}

export interface AgentResult {
  genre: string
  mood: string
  performingArtist: string
  originalArtist: string | null
  isCover: boolean
  summary: string
}

const GENRES = [
  'K-Pop', 'J-Pop', 'Pop', 'Indie Pop', 'Art Pop',
  'Rock', 'Indie Rock', 'Alternative Rock', 'Hard Rock', 'Punk Rock',
  'Hip-Hop', 'K-R&B', 'R&B', 'Soul', 'Funk',
  'Lo-Fi Hip-Hop', 'Chillhop', 'Electronic', 'EDM', 'Ambient',
  'Jazz', 'Blues', 'Classical', 'Folk', 'Country',
  'Ballad', 'OST', 'Trot', 'Reggae', 'Latin',
]

const MOODS = [
  'Chill', 'Relaxing', 'Peaceful', 'Dreamy',
  'Energetic', 'Upbeat', 'Motivating', 'Euphoric',
  'Melancholic', 'Sad', 'Emotional', 'Nostalgic',
  'Dark', 'Intense', 'Mysterious', 'Romantic', 'Happy',
]

const SYSTEM_PROMPT = `You are a music metadata classification expert.
Given a song title and artist, use web search to research the song, then classify it.

Respond ONLY with a JSON object in this exact shape (no markdown, no explanation):
{
  "genre": "one of the listed genres",
  "mood": "one of the listed moods",
  "performingArtist": "full name of the performing artist",
  "originalArtist": "original artist name or null if not a cover",
  "isCover": true or false,
  "summary": "one sentence about the song"
}

Valid genres: ${GENRES.join(', ')}
Valid moods: ${MOODS.join(', ')}

Pick the single best-matching genre and mood. If unsure, pick the closest match from the lists.`

async function classifyWithWebSearch(client: OpenAI, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await client.responses.create({
    model: 'gpt-4o-mini',
    tools: [{ type: 'web_search_preview' as const }],
    input: [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ],
  })
  return response.output
    .filter((item) => item.type === 'message')
    .flatMap((item) => {
      if (item.type !== 'message') return []
      return item.content
        .filter((c) => c.type === 'output_text' && 'text' in c)
        .map((c) => ('text' in c ? (c.text as string) : ''))
    })
    .join('')
}

async function classifyWithChatCompletion(client: OpenAI, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
  })
  return response.choices[0]?.message?.content ?? ''
}

export async function enrichMusicMetadata(input: AgentInput): Promise<AgentResult> {
  const apiKey = settingsStore.get().openaiApiKey || process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('No OpenAI API key available. Please set one in Settings.')
  }
  const client = new OpenAI({ apiKey })

  const userPrompt = `Song title: "${input.title}"
Artist: "${input.artist}"
Source platform: ${input.sourcePlatform}
Source URL: ${input.sourceUrl}

Classify the genre and mood of this song.`

  let outputText = ''
  try {
    outputText = await classifyWithWebSearch(client, SYSTEM_PROMPT, userPrompt)
  } catch {
    // web_search_preview unavailable for this account — fall back to Chat Completions
    outputText = await classifyWithChatCompletion(client, SYSTEM_PROMPT, userPrompt)
  }

  try {
    const parsed = JSON.parse(outputText.trim()) as AgentResult
    return parsed
  } catch {
    return {
      genre: 'Pop',
      mood: 'Chill',
      performingArtist: input.artist,
      originalArtist: null,
      isCover: false,
      summary: `${input.title} by ${input.artist}`,
    }
  }
}

export interface TasteSummaryInput {
  topGenres: string[]
  topMoods: string[]
  totalTracks: number
  topTrack?: { title: string; artist: string; playCount: number }
}

export async function generateTasteSummary(input: TasteSummaryInput): Promise<string> {
  const apiKey = settingsStore.get().openaiApiKey || process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('No OpenAI API key available.')

  const client = new OpenAI({ apiKey })

  const dataLines = [
    `총 트랙: ${input.totalTracks}곡`,
    `선호 장르: ${input.topGenres.join(', ') || '분류 없음'}`,
    `선호 무드: ${input.topMoods.join(', ') || '분류 없음'}`,
    input.topTrack
      ? `가장 많이 들은 곡: "${input.topTrack.title}" by ${input.topTrack.artist} (${input.topTrack.playCount}회)`
      : null,
  ].filter(Boolean).join('\n')

  const prompt = `당신은 음악 취향 분석가입니다. 아래 리스너의 데이터를 보고, 그 사람의 음악 취향을 1~2문장으로 감성적이고 시적으로 묘사해주세요. 따뜻하고 공감적인 어투로, 마치 친한 친구가 "너 이런 음악 좋아하는구나"라고 말해주는 느낌으로 써주세요.

데이터:
${dataLines}

예시 스타일:
"당신은 새벽 집중 시간의 Lo-Fi 수집가예요. Chill한 흐름 속에서 K-Pop으로 에너지를 충전하는 패턴이 보여요."
"소음 속에서도 평온을 찾는 사람이네요. Melancholic한 노래에서 위로를 얻고, Indie Pop으로 하루를 마무리하는군요."

1~2문장만 써주세요. 따옴표 없이, 부연 설명 없이.`

  const response = await client.responses.create({
    model: 'gpt-4o-mini',
    input: [{ role: 'user' as const, content: prompt }],
  })

  const text = response.output
    .filter((item) => item.type === 'message')
    .flatMap((item) => {
      if (item.type !== 'message') return []
      return item.content
        .filter((c) => c.type === 'output_text' && 'text' in c)
        .map((c) => ('text' in c ? (c.text as string) : ''))
    })
    .join('')

  return text.trim() || '당신만의 독특한 음악 취향이 조금씩 형성되고 있어요.'
}
