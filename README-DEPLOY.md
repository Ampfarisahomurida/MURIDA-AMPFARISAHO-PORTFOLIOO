Deployment and local run instructions

Options

1) Docker (recommended, no local Node required)

Build and run:

```bash
docker build -t murida-portfolio .
# set ADMIN_PASSWORD or rely on default Mizzirash2
docker run -p 8080:8080 --env ADMIN_PASSWORD=Mizzirash2 murida-portfolio
```

Open http://localhost:8080

2) Local Node (install Node 18+ LTS)

Windows:
- Download and install from https://nodejs.org/en/download/

Then from project root:

```powershell
npm install
npm start
```

Environment variables
- `ADMIN_PASSWORD` default: `Mizzirash2`
- `OPENAI_API_KEY` (optional) — to use OpenAI provider
- `HF_API_KEY` and `HF_MODEL` (optional) — to use Hugging Face
- `AI_PROVIDER` set to `openai` or `hf` to force provider

Troubleshooting
- If `npm install` fails building native modules, use Docker or ensure build tools are installed (gcc, g++, make, python3, libsqlite3-dev).
- Check server logs for runtime errors. If chat fails, open browser DevTools → Network → inspect `/api/chat` response and paste logs.

Contact
- If you want, I can create a Render/Heroku deployment file or a `docker-compose.yml` for multi-service setups.
