from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/convert", methods=["POST"])
def convert():
    file = request.files.get("file")

    