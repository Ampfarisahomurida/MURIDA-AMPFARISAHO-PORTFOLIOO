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
- Render deployment (recommended for simple hosting)

1. Ensure you have committed `Dockerfile` and `render.yaml` to the repo and pushed to your Git provider (GitHub/GitLab).
2. In the Render dashboard, create a new Web Service and connect your repo.
	- Render will detect `render.yaml` and create the service using the Dockerfile.
3. In the service settings, add a Persistent Disk (if you want to keep the SQLite DB across deploys): mount the disk to `/usr/src/app/MURIDA-AMPFARISAHO-PORTFOLIOO-main/data`.
4. Add environment variables under the service settings:
	- `ADMIN_PASSWORD` (default: `Mizzirash2`)
	- `OPENAI_API_KEY` (optional)
	- `HF_API_KEY` and `HF_MODEL` (optional)

Notes
- Render sets `PORT` automatically; the server reads `process.env.PORT`.
- Using the Dockerfile ensures `better-sqlite3` will be built with required system packages.

Contact
- If you want, I can create `docker-compose.yml` for local multi-service setups, or prepare a Render secrets/env export for you.
