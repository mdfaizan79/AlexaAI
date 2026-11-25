import { useState } from 'react'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import useVoiceAgent from './hooks/useVoiceAgent'
import { STATES, PROMPTS } from './lib/states'
import { getLang, LEARNING_PROMPTS } from './lib/languages'
import Orb from './components/Orb'
import Waveform from './components/Waveform'
import MicButton from './components/MicButton'
import Transcript from './components/Transcript'
import Composer from './components/Composer'
import SettingsPanel from './components/SettingsPanel'
import LanguageBar from './components/LanguageBar'
import VocabularyDrawer from './components/VocabularyDrawer'

const BOOKMARK = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M6 4h12v16l-6-4-6 4z" />
  </svg>
)

export default function App() {
  const a = useVoiceAgent()
  const [open, setOpen] = useState(false)
  const [vocabOpen, setVocabOpen] = useState(false)
  const s = STATES[a.state]
  const banner = a.error
    || (a.health && a.health.foreign && 'Wrong server on port 8000 — another app (e.g. another dev server) is running there. Start the Alexa backend with: cd backend, then uvicorn main:app --port 8000')
    || (a.health && !a.health.has_key && 'OPENAI_API_KEY is missing in the root .env') || (!a.connected && 'Connecting to the Alexa backend…')

  const customs = a.settings.custom_langs || []
  const inputLang = getLang(a.settings.input_lang, customs)
  const targetLang = getLang(a.settings.target_lang, customs)
  const prompts = a.settings.learn ? LEARNING_PROMPTS : PROMPTS
  // Learning hint overrides the default listening hint while learn is on.
  const hint = a.settings.learn
    ? `Listening in ${inputLang?.name || a.settings.input_lang}, Alexa replies in ${targetLang ? `${targetLang.native} (${targetLang.name})` : a.settings.target_lang}`
    : s.hint

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-dvh overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <motion.div className="absolute -left-40 -top-40 size-[34rem] rounded-full bg-blue-600/25 blur-[120px]" animate={{ x: [0, 60, 0], y: [0, 40, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.div className="absolute -bottom-48 -right-32 size-[36rem] rounded-full bg-violet-600/25 blur-[130px]" animate={{ x: [0, -50, 0], y: [0, -40, 0] }} transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }} />
        </div>

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 lg:px-8">
          <h1 className="bg-gradient-to-r from-blue-300 to-violet-300 bg-clip-text text-xl font-semibold tracking-tight text-transparent">Alexa AI</h1>
          <div className="flex items-center gap-3">
            {a.settings.learn && (
              <button type="button" onClick={() => setOpen(true)} aria-label="Change learning languages"
                className="glass hidden max-w-[11rem] items-center gap-2 truncate rounded-full px-3 py-1.5 text-xs font-medium text-violet-200 transition hover:bg-white/10 sm:flex">
                {inputLang?.name || a.settings.input_lang} → {targetLang?.name || a.settings.target_lang}
              </button>
            )}
            <button type="button" onClick={() => setVocabOpen(true)} aria-label="Open vocabulary"
              className="glass grid size-10 place-items-center rounded-full text-slate-200 transition hover:bg-white/10">
              {BOOKMARK}
            </button>
            <button type="button" onClick={() => setOpen(true)} aria-label="Open settings" className="glass grid size-10 place-items-center rounded-full text-slate-200 transition hover:bg-white/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>
            </button>
          </div>
        </header>

        <AnimatePresence>
          {banner && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert"
              className={`relative z-10 mx-auto mb-2 flex max-w-3xl items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm ${a.error ? 'border-red-400/30 bg-red-500/10 text-red-200' : 'border-amber-400/30 bg-amber-500/10 text-amber-100'}`}>
              <span>{banner}</span>
              {a.error && <button type="button" onClick={a.dismissError} className="shrink-0 underline">Dismiss</button>}
            </motion.div>
          )}
        </AnimatePresence>

        <main className="relative z-10 mx-auto grid max-w-7xl gap-6 px-4 pb-8 lg:grid-cols-[1.1fr_1fr] lg:px-8">
          <section className="flex flex-col items-center justify-center gap-5 py-4">
            <Orb state={a.state} level={a.level} />
            <div className="text-center" aria-live="polite">
              <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
                <span className="size-2.5 rounded-full" style={{ background: s.color, boxShadow: `0 0 12px ${s.color}` }} />
                {s.label}
              </span>
              <p className="mt-2 text-sm text-slate-400">{hint}</p>
            </div>
            <Waveform freq={a.freq} state={a.state} />
            <MicButton state={a.state} onClick={a.toggleMic} />
          </section>

          <section className="glass flex h-[34rem] flex-col overflow-hidden rounded-3xl lg:h-[calc(100dvh-7rem)]" aria-label="Conversation">
            {a.settings.learn && <LanguageBar settings={a.settings} update={a.updateSettings} />}
            <Transcript messages={a.messages} thinking={a.state === 'thinking'}
              replay={a.replay} define={a.define} definition={a.definition}
              saveVocab={a.saveVocab} vocab={a.vocab} settings={a.settings} />
            <Composer onSend={a.sendText} disabled={!a.connected || a.state === 'thinking'} prompts={prompts} />
          </section>
        </main>

        <SettingsPanel open={open} onClose={() => setOpen(false)} settings={a.settings} update={a.updateSettings} onClear={a.clear} health={a.health}
          addCustomLang={a.addCustomLang} removeCustomLang={a.removeCustomLang} previewVoice={a.previewVoice} />
        <VocabularyDrawer open={vocabOpen} onClose={() => setVocabOpen(false)} vocab={a.vocab} onRemove={a.removeVocab} onPractice={a.practiceVocab} customs={a.settings.custom_langs} />
      </div>
    </MotionConfig>
  )
}
