import { useState } from 'react'
import { LEARNING_LANGUAGES, SCRIPTS, SCRIPT_FONT_MAP, getLang } from '../lib/languages'

const blank = { name: '', native: '', script: 'Latin', stt: 'en-IN', rtl: false }

// Add & manage user-defined languages. stt is a Google Speech Recognition code
// chosen from the built-in ones (Google needs a real BCP-47 code to transcribe).
export default function CustomLanguages({ settings, addCustomLang, removeCustomLang }) {
  const [form, setForm] = useState(blank)
  const [err, setErr] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const name = form.name.trim()
    if (!name) return setErr('Give the language a name first.')
    if (settings.custom_langs.some((c) => c.name.toLowerCase() === name.toLowerCase()))
      return setErr(`“${name}” is already in your list.`)
    addCustomLang({ ...form, name, native: form.native.trim() || name })
    setForm(blank)
    setErr('')
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-medium">Add your own language</p>
      <form onSubmit={submit} className="mt-2 space-y-2" aria-label="Add a custom language">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-medium text-slate-400">
            Language name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
              placeholder="e.g. Tulu, Konkani…" aria-label="Custom language name"
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b0d1f] px-2.5 py-1.5 text-sm font-normal text-slate-100 placeholder:text-slate-500" />
          </label>
          <label className="text-xs font-medium text-slate-400">
            Native name (optional)
            <input value={form.native} onChange={(e) => setForm({ ...form, native: e.target.value })}
              placeholder="as locals call it" aria-label="Native name"
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b0d1f] px-2.5 py-1.5 text-sm font-normal text-slate-100 placeholder:text-slate-500" />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-medium text-slate-400">
            Script
            <select value={form.script} onChange={(e) => setForm({ ...form, script: e.target.value })} aria-label="Script"
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b0d1f] px-2 py-1.5 text-sm font-normal text-slate-100">
              {SCRIPTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-400">
            Sounds like (for your mic)
            <select value={form.stt} onChange={(e) => setForm({ ...form, stt: e.target.value })} aria-label="Speech recognition code"
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b0d1f] px-2 py-1.5 text-sm font-normal text-slate-100">
              {LEARNING_LANGUAGES.map((l) => <option key={l.stt} value={l.stt}>{l.name}</option>)}
            </select>
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input type="checkbox" checked={form.rtl} onChange={(e) => setForm({ ...form, rtl: e.target.checked })}
            className="size-3.5 accent-violet-500" />
          Right-to-left text {form.script === 'Arabic' && '(usually on for Arabic script)'}
        </label>
        {err && <p role="alert" className="text-xs text-red-300">{err}</p>}
        <button type="submit" className="w-full rounded-lg border border-violet-400/40 bg-violet-500/15 py-1.5 text-xs font-medium text-violet-100 hover:bg-violet-500/25">
          ＋ Add language
        </button>
      </form>
      {settings.custom_langs.length > 0 && (
        <ul className="mt-2 space-y-1" aria-label="Your custom languages">
          {settings.custom_langs.map((c) => (
            <li key={c.code} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm">
              <span className="min-w-0 flex-1 truncate">
                <span style={SCRIPT_FONT_MAP[c.script] ? { fontFamily: SCRIPT_FONT_MAP[c.script] } : undefined}>
                  {getLang(c.code, [c])?.native}
                </span>{' '}
                <span className="text-slate-400">{c.name} · {c.script}</span>
              </span>
              <button type="button" onClick={() => removeCustomLang(c.code)} aria-label={`Remove ${c.name}`}
                className="rounded px-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-300">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
