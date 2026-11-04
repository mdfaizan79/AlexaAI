import { AnimatePresence, motion } from 'framer-motion'
import { LANGUAGES } from '../lib/states'
import { LEARNING_LANGUAGES, langLabel, needsRomanization } from '../lib/languages'
import { VOICE_OPTIONS } from '../lib/voices'
import CustomLanguages from './CustomLanguages'

const Toggle = ({ label, hint, value, onChange }) => (
  <div className="flex items-center justify-between gap-4">
    <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-slate-400">{hint}</p></div>
    <button type="button" role="switch" aria-checked={value} aria-label={label} onClick={() => onChange(!value)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${value ? 'bg-violet-500' : 'bg-white/15'}`}>
      <span className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${value ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  </div>
)

const Select = ({ label, value, onChange, options, children }) => (
  <label className="block text-sm font-medium">{label}
    <div className="mt-1.5 flex gap-2">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0b0d1f] px-3 py-2.5 text-sm font-normal">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {children}
    </div>
  </label>
)

// Accessible segmented control built on native radio inputs (keyboard + SR free).
const Segmented = ({ label, name, value, onChange, options }) => (
  <fieldset className="block text-sm font-medium">
    <legend className="mb-1.5">{label}</legend>
    <div className="flex rounded-xl border border-white/10 bg-black/30 p-1">
      {options.map(([v, l]) => (
        <label key={v} className="flex-1">
          <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} className="sr-only peer" />
          <span className={`block cursor-pointer rounded-lg py-1.5 text-center text-xs transition
            ${value === v ? 'bg-violet-500 text-white' : 'text-slate-300 hover:bg-white/5'}
            peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-violet-400`}>{l}</span>
        </label>
      ))}
    </div>
  </fieldset>
)

const langOptions = (customs) => [...LEARNING_LANGUAGES, ...customs].map((l) => [l.code, langLabel(l.code, customs)])
const voiceOptions = VOICE_OPTIONS.map((v) => [v.id, `${v.id} — ${v.desc}`])

export default function SettingsPanel({
  open, onClose, settings, update, onClear, health,
  addCustomLang, removeCustomLang, previewVoice,
}) {
  const customs = settings.custom_langs || []
  const options = langOptions(customs)
  const sameLang = settings.input_lang === settings.target_lang
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-30 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside role="dialog" aria-modal="true" aria-label="Settings" className="glass fixed inset-y-0 right-0 z-40 w-full max-w-sm space-y-6 overflow-y-auto bg-[#080a1a]/90 p-6"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Settings</h2>
              <button type="button" onClick={onClose} aria-label="Close settings" className="rounded-lg px-2 py-1 text-xl text-slate-300 hover:bg-white/10">×</button>
            </div>

            <section aria-label="Learn a language" className="space-y-4 rounded-2xl border border-violet-400/20 bg-violet-500/5 p-4">
              <h3 className="text-sm font-semibold text-violet-200">Learn a language</h3>
              <Toggle label="Learning mode" hint="Alexa becomes your language tutor" value={settings.learn} onChange={(learn) => update({ learn })} />
              <div className="flex items-end gap-2">
                <Select label="I speak" value={settings.input_lang} onChange={(input_lang) => update({ input_lang })} options={options} />
                <button type="button" onClick={() => update({ input_lang: settings.target_lang, target_lang: settings.input_lang })}
                  aria-label="Swap the two languages" title="Swap languages"
                  className="mb-0.5 grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10">⇄</button>
                <Select label="Alexa replies in" value={settings.target_lang} onChange={(target_lang) => update({ target_lang })} options={options} />
              </div>
              <Segmented label="Level" name="level" value={settings.level} onChange={(level) => update({ level })}
                options={[['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']]} />
              <Segmented label="Mode" name="mode" value={settings.mode} onChange={(mode) => update({ mode })}
                options={[['reply', 'Reply only'], ['tutor', 'Tutor'], ['practice', 'Practice']]} />
              <Toggle label="Show translation" hint="English meaning under each reply" value={settings.show_translation} onChange={(show_translation) => update({ show_translation })} />
              {needsRomanization(settings.target_lang, customs)
                ? <Toggle label="Show pronunciation" hint="Latin-letter reading of the reply" value={settings.show_romanization} onChange={(show_romanization) => update({ show_romanization })} />
                : <p className="text-xs text-slate-500">Pronunciation is off — the reply script is already Latin.</p>}
              <Toggle label="Speak slowly" hint="Slower TTS with short pauses" value={settings.slow} onChange={(slow) => update({ slow })} />
              <p className="text-xs text-slate-400">
                {sameLang
                  ? 'Same language picked — Practice mode is used automatically.'
                  : `Mixed settings work best when you pick the language you speak most. Code-mixed speech (e.g. Hindi + English) is recognised as ${langLabel(settings.input_lang, customs)}.`}
              </p>
              <CustomLanguages settings={settings} addCustomLang={addCustomLang} removeCustomLang={removeCustomLang} />
            </section>

            <Select label="Voice" value={settings.voice} onChange={(voice) => update({ voice })} options={voiceOptions}>
              <button type="button" onClick={() => previewVoice(settings.voice)}
                aria-label={`Preview the ${settings.voice} voice`} title="Hear this voice"
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10">▶</button>
            </Select>
            <Select label="Speech recognition language" value={settings.language} onChange={(language) => update({ language })} options={LANGUAGES} />
            <Toggle label="Speak replies" hint="Play Alexa's voice after each answer" value={settings.speak} onChange={(speak) => update({ speak })} />
            <Toggle label="Stop when I pause" hint="Send automatically after silence" value={settings.autoStop} onChange={(autoStop) => update({ autoStop })} />
            <button type="button" onClick={() => { onClear(); onClose() }} className="w-full rounded-xl border border-red-400/30 bg-red-500/10 py-2.5 text-sm text-red-200 hover:bg-red-500/20">Clear conversation</button>
            {health && <p className="text-xs text-slate-500">Model {health.model} · TTS {health.tts_model}</p>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
