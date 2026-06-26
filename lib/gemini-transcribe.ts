/**
 * Audio transcription via Gemini. Uses GEMINI_API_KEY (same key as the image
 * designer). Audio is uploaded through the Gemini Files API (resumable
 * protocol) so episodes larger than the ~20MB inline limit work, then
 * gemini-2.5-flash transcribes the file. Best-effort + synchronous: very long
 * episodes can exceed the serverless time limit; callers surface the error.
 */
import { env } from '@/lib/env'

const BASE = 'https://generativelanguage.googleapis.com'
const MODEL = 'gemini-2.5-flash'

interface FileResource {
  name?: string
  uri?: string
  state?: string
  mimeType?: string
}

export async function transcribeAudio(
  audioUrl: string
): Promise<{ ok: boolean; transcript?: string; error?: string }> {
  const key = env.GEMINI_API_KEY
  if (!key) return { ok: false, error: 'GEMINI_API_KEY is not configured.' }
  if (!/^https?:\/\//i.test(audioUrl)) return { ok: false, error: 'No audio to transcribe.' }

  // 1. Fetch the audio bytes.
  let bytes: Buffer
  let mime: string
  try {
    const res = await fetch(audioUrl)
    if (!res.ok) return { ok: false, error: `Could not fetch audio (HTTP ${res.status}).` }
    mime = (res.headers.get('content-type') || 'audio/mpeg').split(';')[0]!.trim()
    bytes = Buffer.from(await res.arrayBuffer())
  } catch {
    return { ok: false, error: 'Audio download failed.' }
  }

  // 2. Resumable upload to the Files API.
  let uploadUrl: string | null
  try {
    const start = await fetch(`${BASE}/upload/v1beta/files?key=${key}`, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': String(bytes.length),
        'X-Goog-Upload-Header-Content-Type': mime,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file: { display_name: 'episode-audio' } }),
    })
    uploadUrl = start.headers.get('x-goog-upload-url')
    if (!start.ok || !uploadUrl) {
      return { ok: false, error: `Upload init failed (HTTP ${start.status}).` }
    }
  } catch {
    return { ok: false, error: 'Upload init failed.' }
  }

  let file: FileResource
  try {
    const up = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Command': 'upload, finalize',
        'X-Goog-Upload-Offset': '0',
        'Content-Length': String(bytes.length),
      },
      body: new Uint8Array(bytes),
    })
    if (!up.ok) return { ok: false, error: `Upload failed (HTTP ${up.status}).` }
    file = ((await up.json()) as { file?: FileResource }).file ?? {}
  } catch {
    return { ok: false, error: 'Upload failed.' }
  }
  if (!file.uri || !file.name) return { ok: false, error: 'Upload returned no file reference.' }

  // 3. Poll until the file is ACTIVE (Gemini processes audio before use).
  let state = file.state ?? 'PROCESSING'
  for (let i = 0; i < 30 && state !== 'ACTIVE'; i++) {
    if (state === 'FAILED') return { ok: false, error: 'Gemini failed to process the audio.' }
    await new Promise((r) => setTimeout(r, 2000))
    try {
      const poll = await fetch(`${BASE}/v1beta/${file.name}?key=${key}`)
      if (poll.ok) state = ((await poll.json()) as FileResource).state ?? state
    } catch {
      /* keep polling */
    }
  }
  if (state !== 'ACTIVE') return { ok: false, error: 'Audio processing timed out — try again.' }

  // 4. Transcribe.
  try {
    const gen = await fetch(`${BASE}/v1beta/models/${MODEL}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { fileData: { mimeType: file.mimeType ?? mime, fileUri: file.uri } },
              {
                text: 'Transcribe this audio in full as clean, readable paragraphs. Output only the transcript text — no preamble, timestamps, or speaker labels unless clearly multiple speakers.',
              },
            ],
          },
        ],
      }),
    })
    if (!gen.ok) {
      const t = await gen.text()
      return { ok: false, error: `Transcription failed (HTTP ${gen.status}): ${t.slice(0, 150)}` }
    }
    const json = (await gen.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    const text = (json.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? '')
      .join('')
      .trim()
    if (!text) return { ok: false, error: 'Transcription returned empty.' }
    return { ok: true, transcript: text }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Transcription request failed.' }
  }
}
