from flask import Flask, request, jsonify
from flask_cors import CORS
from script import read_pdf, read_pptx, read_docx, read_ocr_path
from text_analyzer import flagCheck
from auth_service import (
    init_db,
    register_user,
    login_user,
    create_token,
    verify_token_string,
)
import tempfile, os, re, requests
from threading import Thread

app = Flask(__name__)
CORS(app, allow_headers=["Content-Type", "Authorization"])

init_db()

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3")
# Fewer HTTP round-trips: rewrite several sentences per Ollama call (default 6).
OLLAMA_REWRITE_BATCH_SIZE = max(1, int(os.environ.get("OLLAMA_REWRITE_BATCH_SIZE", "6")))
# Cap total rewrites per request so very long docs finish in reasonable time (0 = no cap).
OLLAMA_MAX_REWRITES = int(os.environ.get("OLLAMA_MAX_REWRITES", "40"))
#warms up the ollama model so that it takes less time to respond to the first request
def warmup_ollama():
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": "Reply with only the word: ready",
                "stream": False,
                "options": {"temperature": 0, "num_predict": 1},
            },
            timeout=120,
        )
        response.raise_for_status()
        return True, None
    except Exception as e:
        print(f"Ollama warmup error: {e}")
        return False, str(e)


def process_plain_text(text):
    if text is None:
        text = ""
    if not isinstance(text, str):
        text = str(text)

    flags, triggered_sentences = flagCheck(text)

    to_rewrite = []
    seen = set()
    for sentence in triggered_sentences:
        if sentence in seen or len(sentence.split()) < 5 or sentence.startswith('•'):
            continue
        seen.add(sentence)
        to_rewrite.append(sentence)

    if OLLAMA_MAX_REWRITES > 0 and len(to_rewrite) > OLLAMA_MAX_REWRITES:
        to_rewrite = to_rewrite[:OLLAMA_MAX_REWRITES]

    improved_text = text
    batch_size = OLLAMA_REWRITE_BATCH_SIZE
    for i in range(0, len(to_rewrite), batch_size):
        batch = to_rewrite[i : i + batch_size]
        rewritten_list = rewrite_sentences_batch(batch)
        for sentence, rewritten in zip(batch, rewritten_list):
            if rewritten and rewritten != sentence:
                normalized = ' '.join(sentence.split())
                normalized_text = ' '.join(improved_text.split())
                if normalized in normalized_text:
                    improved_text = improved_text.replace(sentence, rewritten, 1)

    return {
        "text": improved_text,
        "original_text": text,
        "flags": flags,
        "flagged_count": len(triggered_sentences),
    }

def _ollama_generate(prompt, num_predict=512, temperature=0.3):
    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": temperature, "num_predict": num_predict},
        },
        timeout=300,
    )
    response.raise_for_status()
    return response.json()["response"].strip()


def _parse_numbered_rewrites(response_text, n):
    """Expect lines like '1. ...' through 'n. ...'."""
    if n <= 0:
        return []
    out = [None] * n
    numbered = re.compile(r"^\s*(\d+)\s*[\.\)]\s*(.+)$")
    for line in response_text.splitlines():
        m = numbered.match(line.strip())
        if not m:
            continue
        idx = int(m.group(1)) - 1
        if 0 <= idx < n:
            out[idx] = m.group(2).strip()
    if all(x is not None for x in out):
        return out
    # Fallback: non-empty lines without numbers (model forgot numbering)
    lines = [ln.strip() for ln in response_text.splitlines() if ln.strip()]
    lines = [ln for ln in lines if not ln.lower().startswith(("here", "sure", "below"))]
    if len(lines) >= n:
        return lines[:n]
    return None


# asks ollama to rewrite sentences in simple English (batched to reduce latency on long docs)
def rewrite_sentences_batch(sentences):
    if not sentences:
        return []
    if len(sentences) == 1:
        return [rewrite_sentence(sentences[0])]

    n = len(sentences)
    block = "\n".join(f"{i + 1}. {s}" for i, s in enumerate(sentences))
    prompt = f"""Rewrite each numbered sentence in simple English. Use short words. Keep the same meaning. Do not add commentary.
Output exactly {n} lines. Each line must start with its number, a period, a space, then the rewritten sentence only.
Example format:
1. First simplified sentence here.
2. Second simplified sentence here.

Sentences to simplify:
{block}

Your answer ({n} numbered lines only):"""

    num_predict = min(2048, max(128, 48 * n))
    try:
        raw = _ollama_generate(prompt, num_predict=num_predict, temperature=0.25)
        parsed = _parse_numbered_rewrites(raw, n)
        if parsed is not None:
            return parsed
        print("Ollama batch parse failed; falling back to one-by-one for this batch.")
    except Exception as e:
        print(f"Ollama batch error: {e}")

    return [rewrite_sentence(s) for s in sentences]


# asks ollama to rewrite a single sentence in simple English
def rewrite_sentence(sentence):
    prompt = f"""Rewrite this sentence in simple English. Use short words. Keep the same meaning. Do not add anything extra. Do not rewrite lists or bullet points. Return only the rewritten sentence.

Sentence: {sentence}
Simple version:"""
    try:
        out = _ollama_generate(prompt, num_predict=256, temperature=0.3)
        return out
    except Exception as e:
        print(f"Ollama error: {e}")
        return sentence

# sign in user from request
def _auth_user_from_request():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    return verify_token_string(auth[7:].strip())


@app.route("/auth/register", methods=["POST"])
def auth_register():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "")
    password = data.get("password", "")
    user, err = register_user(email, password)
    if err:
        return jsonify({"error": err}), 400
    token = create_token(user["id"], user["email"])
    return jsonify({"token": token, "user": {"email": user["email"], "id": user["id"]}})


@app.route("/auth/login", methods=["POST"])
def auth_login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "")
    password = data.get("password", "")
    user, err = login_user(email, password)
    if err:
        return jsonify({"error": err}), 401
    token = create_token(user["id"], user["email"])
    return jsonify({"token": token, "user": {"email": user["email"], "id": user["id"]}})


@app.route("/auth/me", methods=["GET"])
def auth_me():
    u = _auth_user_from_request()
    if not u:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"user": {"email": u["email"], "id": u["id"]}})


@app.route("/warmup", methods=["GET", "POST"])
def warmup():
    ok, error = warmup_ollama()
    if ok:
        return jsonify({"status": "ready", "model": OLLAMA_MODEL})
    return jsonify({"status": "error", "model": OLLAMA_MODEL, "error": error}), 503

@app.route("/simplify", methods=["POST"])
def simplify_text():
    data = request.get_json(silent=True) or {}
    text = data.get("text")
    if text is None or (isinstance(text, str) and not text.strip()):
        return jsonify({"error": "No text provided"}), 400
    return jsonify(process_plain_text(text))


@app.route("/convert", methods=["POST"])
def convert():
    # Typed text / simplify: JSON body (works with nginx proxy on /convert only)
    data = request.get_json(silent=True)
    if isinstance(data, dict) and "text" in data:
        text = data.get("text")
        if text is None or (isinstance(text, str) and not text.strip()):
            return jsonify({"error": "No text provided"}), 400
        return jsonify(process_plain_text(text))

    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    file_extension = os.path.splitext(file.filename)[1].lower()

    with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension or ".bin") as tmp:
        file.save(tmp.name)
        path = tmp.name

    if file_extension == ".pdf":
        text = read_pdf(path)
    elif file_extension == ".pptx":
        text = read_pptx(path)
    elif file_extension == ".docx":
        text = read_docx(path)
    elif file_extension in [".png", ".jpg", ".jpeg"]:
        text = read_ocr_path(path)
    elif file_extension in [".txt", ".text", ".md"]:
        try:
            with open(path, encoding="utf-8", errors="replace") as f:
                text = f.read()
        except OSError:
            text = None
    else:
        text = "Unsupported file type"

    os.remove(path)

    return jsonify(process_plain_text(text))

if __name__ == "__main__":
    # Warm model in background so first user request is faster.
    Thread(target=warmup_ollama, daemon=True).start()
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "5050"))
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    app.run(host=host, port=port, debug=debug)
