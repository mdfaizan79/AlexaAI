import asyncio
import io
import json
import re
from pathlib import Path

import speech_recognition as sr
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import voice_agent as va

app = FastAPI(title="Alexa AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


SESSIONS: dict[str, list] = {}  # Conversation history per browser session

VOICES = {
    "alloy", "ash", "ballad", "coral", "echo",
    "fable", "nova", "onyx", "sage", "shimmer",
    # verified against the TTS API error message (full supported list)
    "verse", "marin", "cedar",
}

# Mirrors frontend/src/lib/languages.js — keep the two lists in sync.
# code -> (English name, Google Speech Recognition language code)
LANGUAGES = {
    "kn": ("Kannada", "kn-IN"),
    "hi": ("Hindi", "hi-IN"),
    "ta": ("Tamil", "ta-IN"),
    "te": ("Telugu", "te-IN"),
    "ml": ("Malayalam", "ml-IN"),
    "mr": ("Marathi", "mr-IN"),
    "bn": ("Bengali", "bn-IN"),
    "gu": ("Gujarati", "gu-IN"),
    "ur": ("Urdu", "ur-IN"),
    "en-IN": ("English (India)", "en-IN"),
    "en-US": ("English (US)", "en-US"),
    "en-GB": ("English (UK)", "en-GB"),
    "es": ("Spanish", "es-ES"),
    "fr": ("French", "fr-FR"),
    "de": ("German", "de-DE"),
    "ja": ("Japanese", "ja-JP"),
    "ko": ("Korean", "ko-KR"),
    "zh": ("Mandarin", "cmn-Hans-CN"),
    "ar": ("Arabic", "ar-SA"),
}

TARGETS_WITH_LATIN = {"en-IN", "en-US", "en-GB", "es", "fr", "de"}  # no romanization needed

LEVELS = {"beginner", "intermediate", "advanced"}
MODES = {"reply", "tutor", "practice"}

LEVEL_RULES = {
    "beginner": "Use very short sentences, common everyday words, and mainly present tense.",
    "intermediate": "Use natural, everyday sentences as a fluent speaker would.",
    "advanced": "Speak fluently and idiomatically, like a well-read native speaker.",
}

# --- user-defined (custom) languages ---------------------------------------
# Validated subset of each custom language sent by the client.
CUSTOM_LANG_FIELDS = ("code", "name", "native", "stt", "script", "rtl")


def known_langs(cfg: dict) -> set:
    """Built-in language codes plus any validated custom languages."""
    return set(LANGUAGES) | {c["code"] for c in cfg.get("custom_langs", [])}


def lang_name(cfg: dict, code: str) -> str | None:
    if code in LANGUAGES:
        return LANGUAGES[code][0]
    custom = next((c for c in cfg.get("custom_langs", []) if c["code"] == code), None)
    return custom["name"] if custom else None


def stt_code(cfg: dict, code: str) -> str | None:
    if code in LANGUAGES:
        return LANGUAGES[code][1]
    custom = next((c for c in cfg.get("custom_langs", []) if c["code"] == code), None)
    return custom["stt"] if custom else None


def is_latin(cfg: dict, code: str) -> bool:
    if code in TARGETS_WITH_LATIN:
        return True
    custom = next((c for c in cfg.get("custom_langs", []) if c["code"] == code), None)
    return bool(custom and custom["script"].lower() == "latin")


@app.get("/api/health")
def health():
    # `app` marker lets the frontend detect a foreign server bound to the port.
    return {"ok": True, "app": "alexa-ai", "model": va.MODEL, "tts_model": va.TTS_MODEL,
            "voice": va.VOICE, "has_key": bool(va.API_KEY)}


def transcribe(wav: bytes, language: str) -> str:
    """Google Speech Recognition on the WAV recorded in the browser."""
    recognizer = sr.Recognizer()
    with sr.AudioFile(io.BytesIO(wav)) as source:
        audio = recognizer.record(source)
    return recognizer.recognize_google(audio, language=language)


def tool_events(items):
    names = {}
    for it in items:
        get = (lambda k, it=it: it.get(k)) if isinstance(it, dict) else (lambda k, it=it: getattr(it, k, None))
        kind = get("type")
        if kind == "function_call":
            names[get("call_id")] = (get("name"), get("arguments"))
        elif kind == "function_call_output":
            name, args = names.get(get("call_id"), ("tool", ""))
            yield {"name": name, "arguments": args, "result": get("output")}


async def emit(ws: WebSocket, type_: str, **data):
    await ws.send_text(
        json.dumps({"type": type_, **data})
    )

SENTENCE_SPLIT = re.compile(r"(?<=[.!?。！？…])\s+")


def cap_sentences(text: str, limit: int = 3) -> str:
    """Hard cap for learning-mode replies so the card stays readable."""
    parts = [p for p in SENTENCE_SPLIT.split(text.strip()) if p]
    return " ".join(parts[:limit]) if len(parts) > limit else text


def build_language_instructions(cfg: dict) -> str:
    """Strict per-turn instructions for Language Learning Mode.

    Parsed per call (not stored in history), so settings changes apply on the
    very next turn.
    """
    input_code = cfg["input_lang"] if cfg["input_lang"] in known_langs(cfg) else "en-IN"
    target_code = cfg["target_lang"] if cfg["target_lang"] in known_langs(cfg) else "kn"
    input_name = lang_name(cfg, input_code)
    target_name = lang_name(cfg, target_code)

    # Same-language pair always means practice in that language.
    mode = "practice" if input_code == target_code else cfg["mode"]
    level = cfg["level"]

    if mode == "reply":
        mode_rule = (
            f"Mode: reply. Give only a short, simple {target_name} reply. "
            "Do not add translation, romanization or tips; leave those keys as empty strings."
        )
    elif mode == "practice":
        mode_rule = (
            f"Mode: practice. The user is practising {target_name}; reply in {target_name}. "
            "If the user's sentence has a mistake, put the corrected sentence in the correction key. "
            "Keep the conversation going and end your reply with one simple question."
        )
    else:
        mode = "tutor"
        mode_rule = (
            f"Mode: tutor. Give the {target_name} reply plus a translation in {input_name}, "
            "the pronunciation written with Latin letters, and one short learning tip."
        )

    return (
        "LANGUAGE LEARNING MODE\n\n"
        f"The user speaks {input_name} and is learning {target_name}.\n\n"
        f"Reply ONLY in {target_name}. Never mix languages in the reply field.\n"
        f"{LEVEL_RULES.get(level, LEVEL_RULES['beginner'])}\n"
        "Hard cap: reply contains at most 3 short sentences.\n\n"
        f"{mode_rule}\n\n"
        f"If the user asks you to open a website, call the tool, then confirm in {target_name}.\n\n"
        "Output rule: Return ONLY a JSON object with keys: reply, translation, romanization, tip, correction. "
        f"reply is in {target_name}. translation is in {input_name}. "
        + ("romanization uses Latin letters. "
           if not is_latin(cfg, target_code)
           else f"romanization uses Latin letters and is an empty string because {target_name} already uses Latin script. ")
        + "tip and correction may be empty strings. "
        "No markdown, no code fences, no extra text outside the JSON."
    )


def parse_language_reply(raw: str) -> dict:
    """Parse the model's learning-mode output.

    Returns a dict with keys reply/translation/romanization/tip/correction
    (empty or invalid values -> None). On any failure the raw text is returned
    as the reply so the user still gets an answer.
    """
    return parse_json_reply(raw, keys=("reply", "translation", "romanization", "tip", "correction"))


def parse_json_reply(raw: str, keys: tuple[str, ...]) -> dict:
    if not isinstance(raw, str) or not raw.strip():
        return {keys[0]: (raw if isinstance(raw, str) else "")}

    text = raw.strip()
    # Strip a single surrounding markdown code fence, if any.
    fence = re.match(r"^```[a-zA-Z0-9_-]*\s*\n(.*)\n?```\s*$", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()

    try:
        data = json.loads(text)
    except (json.JSONDecodeError, ValueError):
        return {keys[0]: raw}

    if not isinstance(data, dict):
        return {keys[0]: raw}

    out = {}
    for key in keys:
        value = data.get(key)
        out[key] = value.strip() if isinstance(value, str) and value.strip() else None

    if not out[keys[0]]:
        # Model produced unusable JSON: keep the raw text as the answer.
        return {keys[0]: raw}
    return out


def lookup_definition(word: str, target_name: str, input_name: str) -> dict:
    """One-shot word explanation (runs in a worker thread)."""
    prompt = (
        f"Translate and explain the {target_name} word or phrase: {word}.\n"
        f"Return ONLY a JSON object with keys: word, translation (in {input_name}), "
        "romanization (Latin letters; empty string if the word is already Latin script), "
        f"example (one short natural {target_name} sentence). "
        "No markdown, no code fences, no extra text."
    )
    response = va.client.responses.create(
        model=va.MODEL,
        instructions="You are a concise, accurate language dictionary inside a language-learning app.",
        input=prompt,
        max_output_tokens=200,
    )
    return parse_json_reply(response.output_text, keys=("word", "translation", "romanization", "example"))


def apply_config(cfg: dict, data: dict):
    """Merge a config message into cfg. Invalid values are ignored silently."""
    if data.get("voice") in VOICES:
        cfg["voice"] = data["voice"]
    if isinstance(data.get("speak"), bool):
        cfg["speak"] = data["speak"]
    if isinstance(data.get("language"), str) and len(data["language"]) <= 8:
        cfg["language"] = data["language"]
    if isinstance(data.get("autoStop"), bool):
        cfg["autoStop"] = data["autoStop"]
    # --- Language Learning Mode (extended fields) ---
    if isinstance(data.get("learn"), bool):
        cfg["learn"] = data["learn"]
    # User-defined languages: keep only valid, sanitised entries.
    # (Parsed FIRST so input/target_lang in the same message can reference them.)
    if isinstance(data.get("custom_langs"), list):
        validated = []
        for item in data["custom_langs"][:12]:
            if not isinstance(item, dict):
                continue
            code = str(item.get("code", "")).strip()
            name = str(item.get("name", "")).strip()
            stt = str(item.get("stt", "")).strip()
            script = str(item.get("script", "")).strip().lower()
            if not (re.fullmatch(r"[a-zA-Z0-9_-]{2,16}", code or "") and name and stt
                    and re.fullmatch(r"[a-zA-Z0-9-]{2,16}", stt) and len(script or "") <= 20):
                continue  # invalid custom language: skip it
            native = str(item.get("native", "") or name).strip()[:60]
            entry = {"code": code, "name": name[:60], "native": native, "stt": stt,
                     "script": script, "rtl": bool(item.get("rtl"))}
            validated.append({k: entry[k] for k in CUSTOM_LANG_FIELDS})
        cfg["custom_langs"] = validated
    if isinstance(data.get("slow"), bool):
        cfg["slow"] = data["slow"]
    for field in ("input_lang", "target_lang"):
        if data.get(field) in known_langs(cfg):
            cfg[field] = data[field]
    if data.get("level") in LEVELS:
        cfg["level"] = data["level"]
    if data.get("mode") in MODES:
        cfg["mode"] = data["mode"]
    for field in ("show_translation", "show_romanization"):
        if isinstance(data.get(field), bool):
            cfg[field] = data[field]


#run turn
async def run_turn(ws: WebSocket, history: list, text: str, cfg: dict):
    await emit(ws, "user", text=text)
    await emit(ws, "state", state="thinking")

    start = len(history)
    learn = bool(cfg["learn"]) and (cfg["input_lang"] in known_langs(cfg)) and (cfg["target_lang"] in known_langs(cfg))

    try:
        if learn:
            answer = await asyncio.to_thread(
                va.ask_agent, history, text, build_language_instructions(cfg)
            )
        else:
            answer = await asyncio.to_thread(
                va.ask_agent, history, text
            )
    except Exception as exc:
        await emit(
            ws,
            "error",
            message=f"Agent error: {exc}. Check your API key, model access, and network connection."
        )
        await emit(ws, "state", state="idle")
        return

    # Learning mode: the model returns a JSON blob; parse it and cap the reply.
    parsed = None
    if learn:
        parsed = parse_language_reply(answer)
        answer = cap_sentences(parsed["reply"], limit=3)

    for event in tool_events(history[start:]):
        await emit(ws, "tool", **event)

    # went through ask_agent
    # History hygiene: ask_agent already appended the raw model output to
    # history as the assistant message. In learning mode that raw output is a
    # JSON blob; we rewrite that last assistant entry in place with the clean
    # reply text so later turns see plain sentences instead of JSON wrappers.
    # (The parsed extras are sent to the client only and never enter history.)
    if parsed is not None:
        for idx in range(len(history) - 1, start - 1, -1):
            item = history[idx]
            if isinstance(item, dict) and item.get("role") == "assistant":
                item["content"] = answer
                break

    if parsed is not None:
        await emit(
            ws,
            "assistant",
            text=answer,
            lang=cfg["target_lang"],
            translation=parsed.get("translation"),
            romanization=parsed.get("romanization"),
            tip=parsed.get("tip"),
            correction=parsed.get("correction"),
        )
    else:
        await emit(ws, "assistant", text=answer)

    speak_text = answer
    tts_extra = None
    if parsed is not None:
        target_name = lang_name(cfg, cfg["target_lang"])
        tts_extra = f"Speak {target_name} like a native speaker, with natural pronunciation."
        if cfg["slow"]:
            tts_extra += " Speak slowly and clearly, with short pauses between phrases, for a language learner."

    if cfg["speak"]:
        try:
            audio = await va.synthesize(speak_text, cfg["voice"], tts_extra)
            await ws.send_bytes(audio)
            return
        except Exception as exc:
            # Text reply still shown; only the voice failed.
            await emit(
                ws,
                "error",
                message=f"Voice output unavailable: {exc}"
            )

    await emit(ws, "state", state="idle")


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket, session: str = "default"):
    await ws.accept()
    history = SESSIONS.setdefault(session, [])
    cfg = {
        "voice": va.VOICE, "speak": True, "language": "en-IN", "autoStop": True,
        # Learning Mode defaults (send a config to change any of them)
        "learn": False, "input_lang": "en-IN", "target_lang": "kn",
        "level": "beginner", "mode": "tutor", "slow": False,
        "show_translation": True, "show_romanization": True,
    }
    try:
        while True:
            msg = await ws.receive()
            if msg["type"] == "websocket.disconnect":
                break
            if msg.get("bytes"):  # microphone audio (16 kHz mono WAV)
                await emit(ws, "state", state="thinking")
                # Learn mode STT follows the "I speak" language, otherwise the old setting.
                if cfg["learn"] and cfg["input_lang"] in known_langs(cfg):
                    stt_language = stt_code(cfg, cfg["input_lang"])
                else:
                    stt_language = cfg["language"]
                try:
                    text = await asyncio.to_thread(transcribe, msg["bytes"], stt_language)
                except sr.UnknownValueError:
                    await emit(ws, "error", message="Sorry, I couldn't understand that. Please repeat.")
                    continue
                except sr.RequestError as exc:
                    await emit(ws, "error", message=f"Speech recognition service error: {exc}. Try typing instead.")
                    continue
                except Exception as exc:
                    await emit(ws, "error", message=f"Could not read the audio: {exc}")
                    continue
                text = (text or "").strip()
                if not text:
                    await emit(ws, "error", message="I heard only silence. Please try again a bit louder.")
                    continue
                await run_turn(ws, history, text, cfg)
            elif msg.get("text"):
                try:
                    data = json.loads(msg["text"])
                except json.JSONDecodeError:
                    continue
                kind = data.get("type")
                if kind == "text" and str(data.get("text", "")).strip():
                    await run_turn(ws, history, str(data["text"]).strip()[:2000], cfg)
                elif kind == "clear":
                    history.clear()
                    await emit(ws, "cleared")
                    await emit(ws, "state", state="idle")
                elif kind == "config":
                    apply_config(cfg, data)
                elif kind == "speak":  # replay text as speech (optional voice override for previews)
                    replay_text = str(data.get("text", "")).strip()
                    lang_code = data.get("lang") if data.get("lang") in known_langs(cfg) else None
                    replay_voice = data.get("voice") if data.get("voice") in VOICES else cfg["voice"]
                    if not replay_text:
                        await emit(ws, "error", message="Nothing to replay.")
                    elif lang_code is None:
                        await emit(ws, "error", message=f"Unsupported or missing language: {data.get('lang')!r}")
                    else:
                        try:
                            extra = f"Speak {lang_name(cfg, lang_code)} like a native speaker, with natural pronunciation."
                            if data.get("slow"):
                                extra += " Speak slowly and clearly, with short pauses between phrases, for a language learner."
                            audio = await va.synthesize(replay_text[:1000], replay_voice, extra)
                            await ws.send_bytes(audio)
                        except Exception as exc:
                            await emit(ws, "error", message=f"Voice output unavailable: {exc}")
                elif kind == "define":  # translate/explain a single word
                    word = str(data.get("word", "")).strip()[:100]
                    lang_code = data.get("lang") if data.get("lang") in known_langs(cfg) else None
                    if not word:
                        await emit(ws, "error", message="No word given to explain.")
                    elif lang_code is None:
                        await emit(ws, "error", message=f"Unsupported or missing language: {data.get('lang')!r}")
                    else:
                        try:
                            defn = await asyncio.to_thread(lookup_definition, word, lang_name(cfg, lang_code), lang_name(cfg, cfg["input_lang"]))
                            await emit(
                                ws,
                                "definition",
                                word=defn.get("word") or word,
                                translation=defn.get("translation"),
                                romanization=defn.get("romanization"),
                                example=defn.get("example"),
                            )
                        except Exception as exc:
                            await emit(ws, "error", message=f"Could not explain \u201c{word}\u201d: {exc}")
    except WebSocketDisconnect:
        pass

# after `npm run build`, FastAPI serves the site on one port

DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if DIST.exists():  
    app.mount("/", StaticFiles(directory=DIST, html=True), name="web")
