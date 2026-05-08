# Luminara
Creators: Shivaji Ganesh, Ryan Deng, Shubh Rawal, Naysa Ratra, Vishalkiran Raichur, Suhas Kappala  
Date Finished: April 30, 2026  
Description: Luminara is a readability-focused learning app that helps users turn complex writing into clearer, easier-to-understand language. Users can upload or paste text, convert common document formats, and get simplified output powered by local AI. A built-in personal dictionary lets each user save confusing words with definitions so they can review and learn over time. The platform combines a polished React interface with a Flask backend to deliver a smooth, practical study experience.  

### Tools Used
- **Frontend:** React, Vite, React Router, jsPDF, Lucide Icons
- **Backend:** Python, Flask, Flask-CORS, PyJWT
- **Text/File Processing:** PyMuPDF, pytesseract, python-pptx, python-docx, Pillow
- **Readability/NLP:** spaCy, textstat, wordfreq
- **Local AI:** Ollama (`llama3`)
- **Dev/Infra:** Docker, Docker Compose

### Prerequisites
- Node.js 20+ (or newer)
- Python 3.9+ (3.12 recommended)
- Ollama installed and running: [https://ollama.com/download](https://ollama.com/download)
- Docker Desktop installed and running

## How to Run Luminara (With Docker)

### 1) Start all services

    docker compose up --build -d

### 2) Pull model in container (first time only)

    docker compose exec ollama ollama pull llama3

### 3) Open the app
- App: `http://localhost:8080`
- Backend: `http://localhost:5050`

### 4) Close the app
    docker compose down
