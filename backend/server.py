from flask import Flask, request, jsonify
from flask_cors import CORS
from script import read_pdf, read_pptx, read_docx, read_ocr_path
from text_analyzer import flagCheck
import tempfile, os, requests

app = Flask(__name__)
CORS(app)

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3")

def rewrite_sentence(sentence):
    prompt = f"""Rewrite this sentence in simple English. Use short words. Keep the same meaning. Do not add anything extra. Do not rewrite lists or bullet points. Return only the rewritten sentence.

Sentence: {sentence}
Simple version:"""
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False, "options": {"temperature": 0.3}},
            timeout=120,
        )
        response.raise_for_status()
        return response.json()["response"].strip()
    except Exception as e:
        print(f"Ollama error: {e}")
        return sentence

@app.route("/convert", methods=["POST"])
def convert():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    file_extension = os.path.splitext(file.filename)[1].lower()

    with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp:
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
    else:
        text = "Unsupported file type"

    os.remove(path)

    flags, triggered_sentences = flagCheck(text)

    improved_text = text
    seen = set()
    for sentence in triggered_sentences:
        if sentence in seen or len(sentence.split()) < 5 or sentence.startswith('•'):
            continue
        seen.add(sentence)
        rewritten = rewrite_sentence(sentence)
        if rewritten and rewritten != sentence:
            normalized = ' '.join(sentence.split())
            normalized_text = ' '.join(improved_text.split())
            if normalized in normalized_text:
                improved_text = improved_text.replace(sentence, rewritten, 1)
            else:
                pass  # skip if sentence not found in text

    return jsonify({
        "text": improved_text,
        "original_text": text,
        "flags": flags,
        "flagged_count": len(triggered_sentences)
    })

if __name__ == "__main__":
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "5050"))
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    app.run(host=host, port=port, debug=debug)
