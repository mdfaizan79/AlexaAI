import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getLang } from '../lib/languages'

function Entry({ w, onRemove, customs }) {
  const lang = getLang(w.lang, customs)
  return (
    <li className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="min-w-0">
        <p lang={w.lang} dir={lang?.rtl ? 'rtl' : 'ltr'} className="text-lg leading-[1.6] text-slate-100"
          style={lang?.font ? { fontFamily: lang.font } : undefined}>{w.phrase}</p>
        {w.translation && <p className="text-sm text-slate-400">{w.translation}</p>}
        {w.romanization && <p className="text-xs italic text-slate-500">{w.romanization}</p>}
        <p className="text-xs text-slate-500">{lang?.name || w.lang} · {new Date(w.savedAt).toLocaleDateString()}</p>
      </div>
      <button type="button" onClick={() => onRemove(w.id)} aria-label={`Delete ${w.phrase}`}
        className="shrink-0 rounded-lg px-2 py-1 text-slate-400 hover:bg-red-500/10 hover:text-red-300">🗑</button>
    </li>
  )
}

// Saved phrases drawer: search, language filter, delete, practice quiz.
export default function VocabularyDrawer({ open, onClose, vocab, onRemove, onPractice, customs = [] }) {
  const [query, setQuery] = useState('')
  const [langFilter, setLangFilter] = useState('all')

  const langs = useMemo(() => ['all', ...new Set(vocab.map((w) => w.lang))], [vocab])
  const filtered = vocab.filter((w) => {
    if (langFilter !== 'all' && w.lang !== langFilter) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (w.phrase + ' ' + (w.translation || '') + ' ' + (w.romanization || '')).toLowerCase().includes(q)
  })

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-30 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside role="dialog" aria-modal="true" aria-label="Vocabulary"
            className="glass fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col gap-4 overflow-hidden bg-[#080a1a]/90 p-6"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Vocabulary</h2>
              <button type="button" onClick={onClose} aria-label="Close vocabulary"
                className="rounded-lg px-2 py-1 text-xl text-slate-300 hover:bg-white/10">×</button>
            </div>

            {vocab.length > 0 && (
              <>
                <div className="flex gap-2">
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search phrases…" aria-label="Search vocabulary"
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm placeholder:text-slate-500" />
                  <select value={langFilter} onChange={(e) => setLangFilter(e.target.value)} aria-label="Filter by language"
                    className="shrink-0 rounded-xl border border-white/10 bg-[#0b0d1f] px-2 text-xs">
                    {langs.map((c) => <option key={c} value={c}>{c === 'all' ? 'All languages' : getLang(c, customs)?.name || c}</option>)}
                  </select>
                </div>
                <button type="button" onClick={() => { onPractice(); onClose() }}
                  className="rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 py-2.5 text-sm font-medium text-white">
                  Practice my words
                </button>
              </>
            )}

            <ul className="-mx-1 flex-1 space-y-2 overflow-y-auto px-1">
              {filtered.map((w) => <Entry key={w.id} w={w} onRemove={onRemove} customs={customs} />)}
            </ul>
            {vocab.length === 0 && (
              <div className="grid flex-1 place-items-center text-center text-sm text-slate-400">
                No saved phrases yet.<br />Open a reply card and tap <span className="text-violet-300">Save to vocabulary</span>.
              </div>
            )}
            {vocab.length > 0 && filtered.length === 0 && (
              <p className="pb-2 text-center text-sm text-slate-400">Nothing matches “{query}”.</p>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
