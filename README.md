# AI Interview Assistant - React frontend migration

This copy replaces the original HTML/JavaScript frontend with React components. The original ZIP is unchanged. The Flask/LangChain/LangGraph/Gemini/AssemblyAI/Murf integration remains in `backend/app.py`. Backend changes are limited to loading `.env` from the backend directory and guarding server startup with `if __name__ == "__main__"`.

## Start locally (Windows PowerShell)

Requires Node.js 20.19+ or 22.12+ (Node 24 also works), Python 3.11+ compatible with the supplied backend dependencies, and valid keys for all three AI providers.

Open a terminal in this extracted project folder:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item backend/.env.example backend/.env
notepad backend/.env
```

Replace all three placeholders, save, then start Flask:

```powershell
.\.venv\Scripts\python.exe backend/app.py
```

Open a second terminal in the project folder:

```powershell
cd frontend
npm install
npm run dev
```

Open the localhost URL printed by Vite (normally http://127.0.0.1:5173). Use Chrome or Edge and allow microphone access. Keep both terminals running. Start from `npm run dev`, rather than opening `index.html` directly or using Live Server.

The Vite development server proxies `/api/*` to Flask on port 5000. The three API paths are `/start-interview`, `/submit-answer`, and `/get-feedback`. API keys belong only in `backend/.env`; never put them in the React source or commit them.

## What changed

- `frontend/src/main.jsx`: `createRoot` mounts React.
- `frontend/src/App.jsx`: `App`, `TopicSidebar`, and `FeedbackPanel` render the interface with JSX, props, lists, and conditional rendering.
- `frontend/src/useInterview.js`: custom hook owns interview state with `useState`; `useRef` holds microphone, audio, and request objects; effect cleanup stops tracks, aborts requests, and releases audio URLs.
- `frontend/src/api.js`: fetch requests and HTTP error checking.
- `frontend/src/audio.js`: reads newline-separated base64 MP3 from Flask, correctly preserving partial records across network chunks. Uses MediaSource for streaming when supported, or buffered Blob playback otherwise.
- `frontend/src/styles.css`: responsive local CSS, replacing the Tailwind CDN dependency. The interviewer is represented by an initial avatar instead of an external photograph.

React controls the UI through state. There are no manual `querySelector`, `classList`, or `addEventListener` UI handlers. Native audio event listeners are still necessary inside the media adapter.

## Build and checks

```powershell
cd frontend
npm test
npm run build
```

`dist/` is the production build. `npm run preview` serves it locally, but the development `/api` proxy is not a production backend configuration. For a deployed or separately previewed frontend, set `VITE_API_BASE_URL` to your backend URL before building, or configure your web server to proxy `/api` to Flask. Flask must allow the chosen origin. No deployment is included.

## Demo checklist

1. Start Flask with valid API keys and start Vite.
2. Select a topic, start, and listen to the first question. If autoplay is blocked, press Play on the visible audio player.
3. Record, stop, then submit. Repeat for five answers; the next question number comes from the backend headers.
4. Generate feedback and confirm the score and improvement text appear.
5. Start a new interview and verify the previous microphone recording stops.

## Existing backend limits to understand

The supplied backend keeps a single interview in global variables and one in-memory LangGraph checkpoint. Treat this as a single-user local prototype. Multiple users or tabs can overwrite each other's interviews. There is no database, authentication, persistent interview history, or custom model training.

Backend provider exceptions and malformed model feedback can still return server errors. The React UI surfaces HTTP errors, but it cannot guarantee recovery if a request was already processed on the backend. Restart the interview when uncertain. The original backend also invokes the agent twice per submitted answer; this can generate an unused intermediate response and extra LLM cost. That workflow was retained to keep this migration focused on React.

The original `requirements.txt` is retained. Its provider versions and live model/voice availability must be verified in your own environment; frontend build checks do not validate those external services. API credits and internet access are needed for real interviews. Never describe mock tests as live AI validation.

See `INTERVIEW-PREP.txt` for the architecture and truthful migration explanation.
