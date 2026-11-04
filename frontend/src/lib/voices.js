// Voice catalogue verified against the OpenAI TTS API (all 13 are real).
// Keep in sync with VOICES in backend/main.py.
export const VOICE_OPTIONS = [
  { id: 'coral', desc: 'Warm, friendly default' },
  { id: 'alloy', desc: 'Balanced, neutral' },
  { id: 'ash',    desc: 'Calm, slightly lower' },
  { id: 'ballad', desc: 'Soft, expressive' },
  { id: 'echo',   desc: 'Smooth, mid-tone' },
  { id: 'fable',  desc: 'Storyteller lilt' },
  { id: 'onyx',   desc: 'Deep, confident' },
  { id: 'nova',   desc: 'Bright, upbeat' },
  { id: 'sage',   desc: 'Wise, relaxed' },
  { id: 'shimmer',desc: 'Airy, gentle' },
  { id: 'verse',  desc: 'Musical, dynamic' },
  { id: 'marin',  desc: 'Clear, precise' },
  { id: 'cedar',  desc: 'Full, steady' },
]

export const PREVIEW_TEXT = 'Hello! This is how I sound as your tutor.'
