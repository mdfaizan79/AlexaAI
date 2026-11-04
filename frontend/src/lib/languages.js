// Single source of truth for Learning Mode languages.
// NOTE: backend/main.py mirrors this allow-list as `LANGUAGES` (code -> English name + Google stt code).
// Keep the two lists in sync when adding or changing a language.
// User-defined languages (settings.storage "alexa-custom-langs", codes prefixed "x-")
// are merged on top of this list via the `customs` argument of the helpers below.

export const LEARNING_LANGUAGES = [  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', stt: 'kn-IN', script: 'Kannada', rtl: false, font: "'Noto Sans Kannada', sans-serif" },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', stt: 'hi-IN', script: 'Devanagari', rtl: false, font: "'Noto Sans Devanagari', sans-serif" },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', stt: 'ta-IN', script: 'Tamil', rtl: false, font: "'Noto Sans Tamil', sans-serif" },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', stt: 'te-IN', script: 'Telugu', rtl: false, font: "'Noto Sans Telugu', sans-serif" },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', stt: 'ml-IN', script: 'Malayalam', rtl: false, font: "'Noto Sans Malayalam', sans-serif" },
  { code: 'mr', name: 'Marathi', native: 'मराठी', stt: 'mr-IN', script: 'Devanagari', rtl: false, font: "'Noto Sans Devanagari', sans-serif" },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', stt: 'bn-IN', script: 'Bengali', rtl: false, font: "'Noto Sans Bengali', sans-serif" },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', stt: 'gu-IN', script: 'Gujarati', rtl: false, font: "'Noto Sans Gujarati', sans-serif" },
  { code: 'ur', name: 'Urdu', native: 'اردو', stt: 'ur-IN', script: 'Arabic', rtl: true, font: "'Noto Sans Arabic', sans-serif" },
  { code: 'en-IN', name: 'English (India)', native: 'English', stt: 'en-IN', script: 'Latin', rtl: false, font: null },
  { code: 'en-US', name: 'English (US)', native: 'English', stt: 'en-US', script: 'Latin', rtl: false, font: null },
  { code: 'en-GB', name: 'English (UK)', native: 'English', stt: 'en-GB', script: 'Latin', rtl: false, font: null },
  { code: 'es', name: 'Spanish', native: 'Español', stt: 'es-ES', script: 'Latin', rtl: false, font: null },
  { code: 'fr', name: 'French', native: 'Français', stt: 'fr-FR', script: 'Latin', rtl: false, font: null },
  { code: 'de', name: 'German', native: 'Deutsch', stt: 'de-DE', script: 'Latin', rtl: false, font: null },
  { code: 'ja', name: 'Japanese', native: '日本語', stt: 'ja-JP', script: 'Japanese', rtl: false, font: "'Noto Sans JP', sans-serif" },
  { code: 'ko', name: 'Korean', native: '한국어', stt: 'ko-KR', script: 'Korean', rtl: false, font: "'Noto Sans KR', sans-serif" },
  { code: 'zh', name: 'Mandarin', native: '中文', stt: 'cmn-Hans-CN', script: 'Chinese', rtl: false, font: "'Noto Sans SC', sans-serif" },
  { code: 'ar', name: 'Arabic', native: 'العربية', stt: 'ar-SA', script: 'Arabic', rtl: true, font: "'Noto Sans Arabic', sans-serif" },
]

export const getLang = (code) => LEARNING_LANGUAGES.find((l) => l.code === code) || null

// Romanization is only useful when the target script is not Latin already.
export const needsRomanization = (code) => {
  const lang = getLang(code)
  return !!lang && lang.script !== 'Latin'
}

export const isRtl = (code) => {
  const lang = getLang(code)
  return !!lang && !!lang.rtl
}

// Picker label like "ಕನ್ನಡ Kannada" (native script first, English name after).
export const langLabel = (code, customs = []) => {
  const lang = getLang(code, customs)
  return lang ? `${lang.native} ${lang.name}` : code
}

// Fallback web font per script — used for user-defined languages.
export const SCRIPT_FONT_MAP = {
  Latin: null,
  Devanagari: "'Noto Sans Devanagari', sans-serif",
  Kannada: "'Noto Sans Kannada', sans-serif",
  Tamil: "'Noto Sans Tamil', sans-serif",
  Telugu: "'Noto Sans Telugu', sans-serif",
  Malayalam: "'Noto Sans Malayalam', sans-serif",
  Bengali: "'Noto Sans Bengali', sans-serif",
  Gujarati: "'Noto Sans Gujarati', sans-serif",
  Arabic: "'Noto Sans Arabic', sans-serif",
  Japanese: "'Noto Sans JP', sans-serif",
  Korean: "'Noto Sans KR', sans-serif",
  Chinese: "'Noto Sans SC', sans-serif",
}
export const SCRIPTS = Object.keys(SCRIPT_FONT_MAP)

// Quick prompts used instead of the default list while Learning Mode is on.
export const LEARNING_PROMPTS = ['Teach me greetings', 'Order food', 'Introduce myself', 'Numbers 1 to 10', 'Ask for directions', 'Test me']
