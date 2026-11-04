import { Fragment, useState } from 'react'
import { motion } from 'framer-motion'
import { getLang, isRtl } from '../lib/languages'
import WordPopover from './WordPopover'

// One collapsible extra row (translation / pronunciation / tip / correction).
function Row({ label, tone, children }) {
  const [open, setOpen] = useState(true)
  if (!children) return null
  return (
    <div className={`rounded-xl border px-3 py-2 ${tone === 'amber' ? 'border-amber-400/30 bg-amber-500/10' : 'border-white/10 bg-white/5'}`}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left text-xs font-medium uppercase tracking-wide">
        {tone === 'amber' ? <span className="text-amber-200">{label}</span> : <span className="text-slate-400">{label}</span>}
        <span aria-hidden="true" className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && <div className="mt-1 text-sm leading-relaxed">{children}</div>}
    </div>
  )
}

// Card for an assistant reply that carries learning data (target language text
// rendered large, with translation / pronunciation / tip / correction and
// replay / save actions). Falls back to nothing when there is no lang.
export default function LanguageCard({ m, replay, define, definition, saveVocab, saved, showTranslation = true, showRomanization = true, customs = [] }) {
  const lang = getLang(m.lang, customs)
  const [tapped, setTapped] = useState(null) // {word, x, y}

  // Split into words (keeping whitespace) so each word is tappable.
  const tokens = String(m.text).split(/(\s+)/)

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-[92%] space-y-2 rounded-2xl rounded-bl-md border border-violet-400/25 bg-gradient-to-br from-violet-500/10 to-blue-500/5 p-4">
      {/* Target-language text: fixed leading so font loading never shifts layout */}
      <p lang={m.lang} dir={isRtl(m.lang, customs) ? 'rtl' : 'ltr'}
        className="text-2xl leading-[1.7] text-slate-50"
        style={lang?.font ? { fontFamily: lang.font } : undefined}>
        <span className="sr-only">Alexa: </span>
        {tokens.map((t, i) => t.trim()
          ? <button key={i} type="button" onClick={(e) => setTapped({ word: t, x: e.clientX, y: e.clientY })}
              className="rounded px-0.5 hover:bg-violet-400/20 focus-visible:bg-violet-400/30" aria-label={`Explain ${t}`}>{t}</button>
          : <Fragment key={i}>{t}</Fragment>)}
      </p>

      <Row label="Translation">{showTranslation && m.translation}</Row>
      <Row label="Pronunciation">{showRomanization && m.romanization && <span className="italic">{m.romanization}</span>}</Row>
      <Row label="Tip">{m.tip}</Row>
      <Row label="Correction" tone="amber">{m.correction && <span className="text-amber-100">✓ {m.correction}</span>}</Row>

      <div className="flex flex-wrap gap-2 pt-1" role="group" aria-label="Reply actions">
        <button type="button" onClick={() => replay(m.id)} className="chip" aria-label="Replay reply aloud">🔊 Replay</button>
        <button type="button" onClick={() => replay(m.id, { slow: true })} className="chip" aria-label="Replay reply slowly">🐢 Slow replay</button>
        <button type="button" onClick={() => saveVocab({ phrase: m.text, translation: m.translation || '', romanization: m.romanization || '', lang: m.lang, savedAt: Date.now() })}
          className="chip" disabled={saved} aria-label="Save reply to vocabulary">
          {saved ? '✓ Saved' : '＋ Save to vocabulary'}
        </button>
      </div>

      <WordPopover word={tapped?.word} at={tapped} definition={definition} onClose={() => setTapped(null)} />
    </motion.div>
  )
}
