from flask import Flask, request, jsonify
from flask_cors import CORS
from script import read_pdf, read_pptx, read_docx, read_ocr_path
import tempfile, os

app = Flask(__name__)
CORS(app)

@app.route("/upload", methods=["POST"])
def upload():
    file = request.files["file"]
    suffix = os.path.splitext(file.filename)[1]

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        file.save(tmp.name)
        path = tmp.name

    if suffix == ".pdf":
        text = read_pdf(path)
    elif suffix == ".pptx":
        text = read_pptx(path)
    elif suffix == ".docx":
        text = read_docx(path)
    elif suffix in [".png", ".jpg", ".jpeg"]:
        text = read_ocr_path(path)
    else:
        text = "Unsupported file type"

    os.unlink(path)
    return jsonify({"text": text})

if __name__ == "__main__":
    app.run(port=5000)
