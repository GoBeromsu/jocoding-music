import OpenAI from 'openai'

export interface AgentInput {
  title: string
  artist: string
  sourceUrl: string
  sourcePlatform: string
}

export interface PlatformLink {
  platform: string
  url: string
}

export interface AgentResult {
  performingArtist: string
  originalArtist: string | null
  isCover: boolean
  platformLinks: PlatformLink[]
  summary: string
}

const SYSTEM_PROMPT = `You are a music metadata expert agent.
Given a song title and artist name, use web search to find:
1. The performing artist (who actually recorded/sang this version)
2. Whether this is a cover song — if so, who is the original artist and what year was the original released
3. Links to this exact song on other major music platforms: Spotify, Apple Music, YouTube Music, MelOn (멜론), Bugs (벅스), Genie (지니)

Respond ONLY with a JSON object in this exact shape (no markdown, no explanation):
{
  "performingArtist": "string",
  "originalArtist": "string or null",
  "isCover": true/false,
  "platformLinks": [
    { "platform": "spotify", "url": "https://..." },
    { "platform": "apple_music", "url": "https://..." }
  ],
  "summary": "One sentence description of the song and its history"
}

If you cannot find a platform link, omit it from the array. Only include links you are confident are correct.`

export async function enrichMusicMetadata(input: AgentInput): Promise<AgentResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const userPrompt = `Song title: "${input.title}"
Artist: "${input.artist}"
Source platform: ${input.sourcePlatform}
Source URL: ${input.sourceUrl}

Find the metadata for this song.`

  const response = await client.responses.create({
    model: 'gpt-4o-mini',
    tools: [{ type: 'web_search_preview' as const }],
    input: [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: userPrompt },
    ],
  })

  // Extract the final text output from the response
  const outputText = response.output
    .filter((item) => item.type === 'message')
    .flatMap((item) => {
      if (item.type !== 'message') return []
      return item.content
        .filter((c) => c.type === 'output_text' && 'text' in c)
        .map((c) => ('text' in c ? (c.text as string) : ''))
    })
    .join('')

  try {
    const parsed = JSON.parse(outputText.trim()) as AgentResult
    return parsed
  } catch {
    // Fallback if JSON parse fails
    return {
      performingArtist: input.artist,
      originalArtist: null,
      isCover: false,
      platformLinks: [],
      summary: `${input.title} by ${input.artist}`,
    }
  }
}
