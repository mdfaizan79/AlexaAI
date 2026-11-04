import { LEARNING_LANGUAGES, langLabel } from '../lib/languages'

function Picker({ label, value, onChange, customs }) {
  return (
    <label className="block min-w-0 flex-1 text-xs font-medium text-slate-300">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}
        className="w-full max-w-[10rem] rounded-xl border border-white/10 bg-[#0b0d1f] px-2 py-1.5 text-xs">
        {[...LEARNING_LANGUAGES, ...customs].map((l) => <option key={l.code} value={l.code}>{langLabel(l.code, customs)}</option>)}
      </select>
    </label>
  )
}

// Compact learning bar shown above the transcript while Learning Mode is on.
export default function LanguageBar({ settings, update }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2" role="group" aria-label="Language learning quick controls">
      <Picker label="I speak" value={settings.input_lang} onChange={(input_lang) => update({ input_lang })} customs={settings.custom_langs} />
      <button type="button" aria-label="Swap the two languages" title="Swap languages"
        onClick={() => update({ input_lang: settings.target_lang, target_lang: settings.input_lang })}
        className="grid size-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10">⇄</button>
      <Picker label="Alexa replies in" value={settings.target_lang} onChange={(target_lang) => update({ target_lang })} customs={settings.custom_langs} />
      <button type="button" role="switch" aria-checked={settings.learn} aria-label="Learning mode"
        onClick={() => update({ learn: !settings.learn })}
        className={`ml-auto rounded-full px-3 py-1.5 text-xs font-medium transition ${settings.learn ? 'bg-violet-500 text-white' : 'border border-white/10 bg-white/5 text-slate-300'}`}>
        Learn {settings.learn ? 'on' : 'off'}
      </button>
    </div>
  )
}
