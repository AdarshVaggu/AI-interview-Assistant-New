# Deploy the complete app on Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/AdarshVaggu/AI-interview-Assistant-New)

The button deploys the React frontend and Flask backend together as **one Docker Web Service**. No separate Vercel account, frontend URL, CORS setup, or build/start command entry is needed. Gemini 3.5 Flash-Lite remains configured.

## Your steps

1. Click **Deploy to Render** above.
2. Sign in to Render. If asked, connect GitHub and grant Render access to **AI-interview-Assistant-New**. A private repository requires this access.
3. Choose your Render workspace and review the service. The Blueprint selects the **Free** instance type.
4. Enter your real values for the three prompted environment variables:

   | Name | Value |
   | --- | --- |
   | `GOOGLE_API_KEY` | Your Gemini / Google AI Studio API key |
   | `ASSEMBLYAI_API_KEY` | Your AssemblyAI API key |
   | `MURF_API_KEY` | Your Murf API key |

5. Click Render's final **Deploy / Create resources** action (the label can vary). Do not paste keys into GitHub, the README, or this chat.
6. Wait for the Docker build and deployment to succeed. Open the service's `https://...onrender.com` address once Render marks it **Live**. Render assigns the actual URL.
7. Select a topic, start the interview, allow your browser microphone, submit five answers, and request feedback. If autoplay is blocked, press Play in the audio player.

If the button does not open the Blueprint, use **New > Blueprint**, select this repository and branch `main`, and keep the Blueprint path `render.yaml`.

## What is configured

- Docker builds React with Node 24 and installs the Python backend on Python 3.12.
- Flask serves compiled React files and `/api/*` on the same HTTPS domain.
- Gunicorn listens on Render's `PORT` with one worker, four threads so health checks can run during AI calls, and a 180-second worker timeout.
- Render checks `/healthz` to confirm the process is running. This does not call AI services or validate provider keys.
- Secrets are requested using `sync: false`; credentials are not stored in the repository or Docker image.
- Automatic deployment is disabled. After later source changes, use **Manual Deploy > Deploy latest commit** in the service dashboard.

## Demo limits

This is a single-user prototype with one global interview session. Use one tab and one interview at a time. Restarts lose the in-memory conversation. There is no sign-in gate: anyone with the public URL can call the AI endpoints and use your provider quotas. Share it with your intended demo audience and suspend the service when no longer needed.

Render's Free service sleeps after 15 idle minutes. Open it early before your interview and wait for it to wake. Free hosting does not guarantee free AI usage: each provider's quota and billing still apply.

## Troubleshooting

- **Build failed:** read the first dependency/build error in Render's build logs.
- **Startup failed:** inspect runtime logs for missing keys or import errors.
- **Provider 401/403/429:** check the corresponding key, model/voice access, and quota.
- **Silent question:** verify Murf access to the configured Natalie voice/FALCON streaming API and try the audio player's Play button.
- **Request timeout:** check provider availability and restart the interview after resolving the issue.

Do not share logs containing secrets. Local checks do not substitute for a real interview using your three accounts.

Official references: [Deploy button](https://render.com/docs/deploy-to-render), [Blueprint secrets](https://render.com/docs/blueprint-spec), [Free-service limits](https://render.com/docs/free).
