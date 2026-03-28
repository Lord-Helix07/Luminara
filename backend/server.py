from flask import Flask, request, jsonify
from flask_cors import CORS
from script import read_pdf, read_pptx, read_docx, read_ocr_path
import tempfile, os

app = Flask(__name__)
CORS(app)

# Method returns HTTP Response object (containing JSON data)
@app.route("/convert", methods=["POST"])
def convert():

    # get() is safer can return None
    file = request.files.get("file")

    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    file_extension = os.path.splitext(file.filename)[1]

    # Creates a temp file to write the uploaded file into it
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

    # Deletes temp file after processing
    os.remove(path)

    return jsonify({"text": text})

if __name__ == "__main__":
    app.run(port=5050)
