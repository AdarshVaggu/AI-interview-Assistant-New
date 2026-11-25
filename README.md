# AI Interview Assistant

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Open%20App-7c3aed?style=for-the-badge)](https://ai-interview-assistant-new.onrender.com/)

An interview practice app where you choose a topic, listen to questions, and answer using your microphone. It asks five questions, follows up based on your answers, and gives a score out of 5 with feedback at the end.

The frontend uses React and the backend uses Flask. Gemini 3.5 Flash-Lite generates questions and feedback, AssemblyAI transcribes your answers, and Murf AI reads the questions aloud. LangChain and LangGraph manage the conversation.

## Run locally

You need Python 3.12, Node.js 22.12 or later, and API keys for Google Gemini, AssemblyAI, and Murf AI.

Clone the repository:

```powershell
git clone https://github.com/AdarshVaggu/AI-interview-Assistant-New.git
cd AI-interview-Assistant-New
```

Set up the backend (Windows PowerShell):

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item backend/.env.example backend/.env
```

Open `backend/.env` and replace the placeholders with your keys:

```env
GOOGLE_API_KEY=your_google_api_key
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
MURF_API_KEY=your_murf_api_key
```

Keep this file private. Start the backend:

```powershell
.\.venv\Scripts\python.exe backend/app.py
```

Open a second terminal in the project folder and start the frontend:

```powershell
cd frontend
npm ci
npm run dev
```

Open the URL shown in the terminal, usually `http://127.0.0.1:5173`. Keep both terminals running and allow microphone access in your browser.
