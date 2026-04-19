FROM python:3.12-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && python -m spacy download en_core_web_sm

COPY . .

ENV HOST=0.0.0.0
ENV PORT=5050
ENV FLASK_DEBUG=0
ENV LUMINARA_DATA_DIR=/app/data
EXPOSE 5050

CMD ["python", "server.py"]
