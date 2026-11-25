# Deploy the interview assistant

Deploy the Flask backend on Render and the Vite/React frontend on Vercel. Test the real AI integrations locally first; the supplied validation used simulated responses rather than provider credentials.

## Render backend

Create a Python Web Service connected to this repository. Leave the root directory blank.

- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn --chdir backend app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 180`
- Set `GOOGLE_API_KEY`, `ASSEMBLYAI_API_KEY`, and `MURF_API_KEY` in Render's Environment settings.

Gunicorn is included in the requirements for Linux hosting. Windows local development still uses `python backend/app.py`. The backend has no root route, so a 404 at `/` alone does not indicate failure; check startup logs and exercise the POST endpoints from the frontend.

## Vercel frontend

Import this repository and select:

- Root directory: `frontend`
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://YOUR-BACKEND.onrender.com`

Replace the placeholder with the actual Render address, without an `/api` suffix. Set the variable before deployment, and rebuild after changing it. Do not put provider API keys in Vercel or any `VITE_` variable: those values are visible in the browser.

## Verify

Open the HTTPS frontend in Chrome or Edge, allow microphone access, complete five answers, and request feedback. If a request fails, inspect the backend logs. This prototype has one global interview session, so use one browser tab and one interviewer at a time. Restarts lose its in-memory conversation. Free hosting may sleep while idle.

No live deployment or provider validation is implied by uploading this source repository.
