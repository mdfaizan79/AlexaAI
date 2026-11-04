# Alexa AI — Language Learning Mode build plan

Phase-by-phase task list. Every task is ticked only after it is actually implemented.
Progress: `[##########] 100%`

## Task checklist

### Phase 0 — prep
- [x] Inspect existing code (main.py, voice_agent.py, useVoiceAgent.js, App.jsx, components, lib)
- [x] Confirm base behavior: orb states, waveform, mic, text input, quick prompts, transcript, history, open_website, settings drawer, auto-reconnect, error banner, single-port build, Vite proxy
- [x] Write this plan file (readme2.md)

### Phase 1 — language config
- [x] `frontend/src/lib/languages.js`: 19 languages with `{ code, name, native, stt, script, rtl, font }`
- [x] Helpers `getLang(code)`, `needsRomanization(code)`, `isRtl(code)`
- [x] Backend mirror allow-list noted in a comment (sync note both sides)

### Phase 2 — backend
- [x] `ask_agent(history, user_text, extra_instructions=None)`; instructions passed per call, never stored in history
- [x] `synthesize(text, voice, instructions_extra=None)`; native-speaker guidance + slow-learner guidance
- [x] Extend `cfg` with learn, input_lang, target_lang, level, mode, slow, show_translation, show_romanization (validated, invalid ignored)
- [x] `build_language_instructions(cfg)` — identity, reply-only rule, level rules, 3-sentence cap, mode rules, tool rule, JSON output rule
- [x] `parse_language_reply(raw)` — fence stripping, json.loads, key validation, empty→None, fallback to raw text
- [x] Reply truncation to 3 sentences in learning mode
- [x] History hygiene: replace raw JSON assistant entry with the clean reply (comment explaining)
- [x] `run_turn` learning path: extended assistant event + TTS of reply with target-language guidance; old path untouched when learn=false
- [x] `speak` handler (replay as speech, slow support)
- [x] `define` handler (one-shot responses.create in asyncio.to_thread → definition event)
- [x] STT uses input_lang stt code when learn=true, otherwise language
- [x] Error handling: empty transcription, UnknownValueError, RequestError, JSON fallback, TTS failure (text still shown), unsupported language

### Phase 3 — settings UI
- [x] DEFAULTS + localStorage persistence for all new settings (try/catch around storage)
- [x] Config sent on connect and on every change
- [x] Extended assistant event handling (translation, romanization, tip, correction, lang)
- [x] `replay(messageId, {slow})` and `define(word, lang)`
- [x] Settings section "Learn a language": mode switch, both pickers (native names), swap button, level + mode segmented controls (radiogroup), translation/romanization/slow toggles, code-mix hint
- [x] Mic hint: "Listening in Hindi, Alexa replies in Kannada"
- [x] Header chip "Hindi → Kannada" (opens settings)
- [x] LanguageBar above transcript (pickers + Learning mode switch)

### Phase 4 — transcript
- [x] LanguageCard: large target text, lang + dir, collapsible translation/pronunciation/tip/correction (correction amber)
- [x] Replay, Slow replay, Save to vocabulary buttons
- [x] WordPopover: tap a word → translation via define
- [x] Plain bubbles unchanged for non-learning messages
- [x] Noto Sans families (Kannada, Devanagari, Tamil, Telugu, Malayalam, Bengali, Gujarati, JP, KR, SC, Arabic) with display=swap; reserved line height
- [x] Learning quick prompts replace static list when learn is on

### Phase 5 — vocabulary
- [x] Save entry `{id, phrase, translation, romanization, lang, savedAt}` to localStorage (no dupes)
- [x] VocabularyDrawer: search, delete, language filter, practice quiz button, empty state

### Phase 6 — edge cases
- [x] input_lang == target_lang → practice forced (server; bar hint client-side)
- [x] Mid-conversation language/mode change applies on the next turn (no reload)
- [x] Code-mixed speech uses chosen input code + hint
- [x] Long output truncated; invalid JSON shows raw text without card extras
- [x] Unsupported STT/TTS → clear banner, text still shown
- [x] "open YouTube" in learning mode: tool runs, confirmation in target language
- [x] Learning Mode off: no JSON instructions, no extra fields, old behavior intact
- [x] Reconnect re-sends saved settings

### Phase 7 — quality
- [x] Responsive 360 px → wide desktop, no horizontal scroll
- [x] Keyboard access, visible focus, ARIA labels, aria-live for replies
- [x] prefers-reduced-motion respected (CSS fallback + MotionConfig reducedMotion="user")
- [x] No layout shift from font loading
- [x] Small components: LanguageBar, LanguageCard, WordPopover, VocabularyDrawer

### Phase 8 — docs and tests
- [x] README.md: "Language Learning" section (usage, language list, known limits)
- [x] Manual test checklist run (results below)

## Progress table

| Phase | Focus | Status |
|-------|------------------|--------|
| 0 | Prep / inspection | Done |
| 1 | Language config | Done |
| 2 | Backend | Done |
| 3 | Settings UI | Done |
| 4 | Transcript | Done |
| 5 | Vocabulary | Done |
| 6 | Edge cases | Done |
| 7 | Quality | Done |
| 8 | Docs and tests | Done |
| Follow-up | Custom languages + 13 voices with previews | Done |

## Changelog
- Phase 0: audited existing code and wrote this plan file.
- Phase 1: added `frontend/src/lib/languages.js` (19-language allow-list, helpers, sync note for the backend mirror).
- Phase 2: backend learning pipeline — `ask_agent` extra_instructions, `synthesize` guidance, config validation, `build_language_instructions`, `parse_language_reply`, extended `run_turn`, `speak` + `define` handlers, history hygiene, error paths.
- Phase 3: settings state + "Learn a language" panel, LanguageBar, header chip, mic hint, replay/define plumbing.
- Phase 4: LanguageCard, WordPopover, Noto fonts, learning-aware quick prompts.
- Phase 5: vocabulary store + VocabularyDrawer with practice-quiz button.
- Phase 6: edge-case handling (practice-forced same-language pair, mid-conversation changes, invalid JSON fallback, truncation, banners, reconnect).
- Phase 7: a11y/reduced-motion/responsive polish.
- Phase 8: README + docs updated, manual test checklist executed.
- Follow-up 1: user-defined languages — "Add your own language" form (name, native name, script + font, RTL, "sounds like" STT code) in settings; customs persisted in localStorage and sent as validated `custom_langs` with every config; backend sanitises them and they work end-to-end (instructions, STT, TTS guidance, define). New components: `CustomLanguages.jsx`.
- Follow-up 2: voices expanded from 10 to 13 (verified `verse`, `marin`, `cedar` against the TTS API); voice picker shows descriptions and adds a ▶ preview button (server `speak` message accepts a `voice` override).
- Follow-up 3: project tidy-up — single root `.env` + `.env.example`, single root `requirements.txt` (the bloated pip-freeze dump replaced by the 6 real dependencies); removed stray `package.json`/`node_modules` at the root, `backend/package-lock.json`, `__pycache__` and `.DS_Store`; `voice_agent.py` now loads the root `.env` by explicit path (works from any cwd); fixed `.gitignore` (previously ignored `requirements.txt`).
- Follow-up 4: fixed "site not working" — port 8000 was held by another app (DevPilot), so the Alexa backend could not bind and the frontend talked to a foreign server. Killed the stale processes, gave the dev server its own port (5273, strict), made the backend port configurable through `ALEXA_PORT`, added an `app: "alexa-ai"` marker to `/api/health`, and the frontend now shows an actionable banner when the wrong server answers on the port. Verified end-to-end via the Vite proxy: page, health, config, learning turn, TTS audio, replay.

## Manual test checklist (results)

| # | Case | Result |
|---|------|--------|
| 1 | Learning mode off → orb/mic/transcript/tools/settings behave exactly as before | Pass |
| 2 | Text input in learning mode (tutor): Kannada text + translation + romanization + tip card | Pass |
| 3 | Mic input: transcribed in "I speak" language, reply spoken in target language | Pass |
| 4 | Replay / Slow replay buttons re-speak the reply | Pass |
| 5 | Tap a word → popover definition appears | Pass |
| 6 | Save to vocabulary → drawer lists entry; practice quiz sends one-at-a-time quiz prompt | Pass |
| 7 | Swap button exchanges pickers instantly | Pass |
| 8 | Same input/target language → practice mode forced | Pass |
| 9 | Mode/target change mid-conversation applies to next reply without reload | Pass |
| 10 | Invalid JSON from model → raw text bubble shown, no crash | Pass |
| 11 | TTS failure → error banner, text still visible | Pass |
| 12 | STT failure (offline) → clear banner, chat still usable | Pass |
| 13 | "open YouTube" during learning → tool chip appears, confirmation spoken in target language | Pass |
| 14 | Reconnect (server restart) → settings re-sent automatically | Pass |
| 15 | 360 px viewport → no horizontal scroll, card renders legibly | Pass |
| 16 | Keyboard-only navigation of settings, card rows, drawer | Pass |
| 17 | Add a custom language (e.g. Tulu) → appears in pickers, replies/defines in it, survives reload | Pass |
| 18 | Voice picker shows 13 voices with descriptions; ▶ preview plays a sample; preview uses chosen voice override | Pass |
| 19 | Invalid custom language input rejected client-side; malformed server-side customs dropped without breaking the session | Pass |
| 20 | Delete a custom language → removed from pickers; selected pair falls back to defaults | Pass |
