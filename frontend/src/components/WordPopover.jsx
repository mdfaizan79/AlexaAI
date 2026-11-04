import { AnimatePresence, motion } from 'framer-motion'

// Small popover showing a word's translation after tapping it in a language card.
// definition: {word, translation, romanization, example, loading} from the hook.
export default function WordPopover({ word, at, definition, onClose }) {
  const open = !!word
  const result = definition && definition.word === word ? definition : null
  const top = Math.min(at?.y ?? 100, (typeof window !== 'undefined' ? window.innerHeight : 800) - 180)
  const left = Math.max(12, Math.min(at?.x ?? 100, (typeof window !== 'undefined' ? window.innerWidth : 400) - 270))

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          role="status" aria-label={`Meaning of ${word}`}
          className="fixed z-50 w-64 rounded-2xl border border-violet-400/30 bg-[#0b0d1f]/95 p-3.5 text-sm shadow-2xl backdrop-blur-xl"
          style={{ top, left }}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-violet-200">{word}</p>
            <button type="button" onClick={onClose} aria-label="Close word meaning"
              className="-mt-1 rounded-lg px-1.5 text-lg leading-6 text-slate-400 hover:bg-white/10">×</button>
          </div>
          {!result || result.loading ? (
            <p className="mt-1 text-slate-400">Looking up…</p>
          ) : (
            <dl className="mt-1.5 space-y-1.5">
              {result.translation && <div><dt className="sr-only">Translation</dt><dd className="text-slate-200">{result.translation}</dd></div>}
              {result.romanization && <div><dt className="sr-only">Pronunciation</dt><dd className="text-xs italic text-slate-400">{result.romanization}</dd></div>}
              {result.example && <div><dt className="sr-only">Example</dt><dd className="text-xs text-slate-400">e.g. {result.example}</dd></div>}
              {!result.translation && !result.romanization && !result.example && <dd className="text-slate-400">No translation found. Try again.</dd>}
            </dl>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
