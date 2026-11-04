# Alexa AI

React + Vite + Tailwind + Framer Motion front end, FastAPI back end wrapping your existing agent (`backend/voice_agent.py`).

```
alexa-ai/
├── .env             # single env file: OPENAI_API_KEY, model & voice settings (never commit)
├── .env.example     # template to copy
├── requirements.txt # all Python dependencies
├── backend/         # FastAPI app: main.py, voice_agent.py
└── frontend/        # Vite app: src/{components,hooks,lib}
```

## How it works
- Browser mic -> recorded as 16 kHz WAV -> WebSocket `/ws` -> Google Speech Recognition (`speech_recognition`) -> your `ask_agent()` (history + `open_website` tool intact) -> OpenAI TTS (MP3) -> WebSocket -> browser plays it.
- Orb and waveform are driven by Web Audio `AnalyserNode` data (your mic while listening, Alexa's voice while speaking). States come from backend events.
- Conversation history is kept per browser session on the server (in memory); `Clear conversation` resets it.
- API keys stay in the root `.env`; the frontend never sees them.

## Language Learning

Learning Mode turns Alexa into your language tutor: you speak language A and Alexa
replies and speaks language B.

### How to use it

1. Turn on **Learning mode** in the header ("Hindi → Kannada" chip), the bar above
   the transcript, or the settings drawer's **Learn a language** section.
2. Pick **I speak** (your language) and **Alexa replies in** (the language you are
   learning — shown with its native name, e.g. "ಕನ್ನಡ Kannada"). The ⇄ button swaps them.
3. Choose a **Level** (Beginner / Intermediate / Advanced) and a **Mode**:
   - **Reply only** — Alexa answers only in the target language, short and simple.
   - **Tutor** — target-language reply + translation + Latin-letter pronunciation + one short tip.
   - **Practice** — you speak the target language; Alexa replies in it, gently corrects
     mistakes (shown in an amber row) and asks a follow-up question.
4. Extras: translation and pronunciation rows can be hidden, "Speak slowly" makes the
   TTS learner-friendly, every answer card has **Replay / Slow replay / Save to
   vocabulary**, and tapping any word shows its translation.
5. Saved phrases live in the **Vocabulary drawer** (bookmark icon in the header):
   search, language filter, delete, and a **Practice my words** quiz.

All settings persist in `localStorage` and are re-sent automatically after reconnects.

### Language list

19 built-in languages: Kannada, Hindi, Tamil, Telugu, Malayalam, Marathi, Bengali,
Gujarati, Urdu, English (India/US/UK), Spanish, French, German, Japanese, Korean,
Mandarin, Arabic.
`frontend/src/lib/languages.js` is the single source of truth; `backend/main.py`
mirrors the same allow-list (keep the two in sync).

### Your own languages

Any language can be added in **Settings → Learn a language → Add your own
language**: name, native name, script (picks the font and whether pronunciation
is shown), a "sounds like" speech-recognition code for your microphone, and a
right-to-left switch. Custom languages are stored in `localStorage`, pushed to
the server as a validated `custom_langs` list with every config, and appear in
all pickers alongside the built-ins. Examples that work well: Tulu, Konkani,
Sindhi, Nepali, or any regional dialect.

### Voices

13 voices are available in **Settings → Voice** (alloy, ash, ballad, cedar, coral,
echo, fable, marin, nova, onyx, sage, shimmer, verse) — each with a description and
a ▶ preview button so you can hear it before choosing.

### Known limits

- Google Speech Recognition (the free web endpoint) quality varies a lot by language.
- OpenAI TTS accents are approximate — an English voice reading Kannada is not a
  native speaker.
- One input language at a time: code-mixed speech (Hindi + English) is transcribed
  under the "I speak" setting.
- If the input and target languages are equal, Practice mode is used automatically.

## Run (development)
```bash
# one-time setup (from the repo root)
cp .env.example .env                    # then put your OPENAI_API_KEY in it
python -m venv backend/.venv
backend/.venv/bin/pip install -r requirements.txt
cd frontend && npm install && cd ..

# terminal 1
cd backend
.venv/bin/python -m uvicorn main:app --reload --port 8000

# terminal 2
cd frontend
npm run dev                             # http://localhost:5273
```

**Port note:** if port 8000 is already taken by another app, the frontend will show
a clear banner ("Wrong server on port 8000"). Free the port, or run Alexa on a
different one: `ALEXA_PORT=8100 npm run dev` in `frontend/` and
`uvicorn main:app --port 8100` in `backend/`.

## Run (single port)
`cd frontend && npm run build`, then start uvicorn: the site is served at http://localhost:8000.

## Configuration
All configuration lives in one root **`.env`** (see `.env.example`):
`OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_TTS_MODEL`, `VOICE_NAME`.
There is one **`requirements.txt`** at the repo root; install it in the backend venv.
Ignore lists: secrets, venvs, `node_modules`, builds and caches are git-ignored via `.gitignore`.

## Notes
- Use `localhost` or HTTPS: browsers only allow the microphone on secure origins. Chrome/Edge/Safari recommended.
- `open_website` opens the page in the browser of the machine running the backend (fine for local use).
- Google Speech Recognition uses the free web endpoint, so it needs internet access.
