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
- None required for the static site. `PORT` may be provided by hosting platforms.

Troubleshooting
- If you see server errors, check the server logs. Use Docker locally to reproduce: `docker-compose up --build`.

Render deployment (recommended for simple hosting)

1. Ensure you have committed `Dockerfile` and `render.yaml` to the repo and pushed to your Git provider (GitHub/GitLab).
2. In the Render dashboard, create a new Web Service and connect your repo.
   - Render will detect `render.yaml` and create the service using the Dockerfile.

Notes
- Render sets `PORT` automatically; the server reads `process.env.PORT`.
- The site is a static portfolio served by a minimal Node static server; no DB or AI services are required.

Contact
- If you want, I can create `docker-compose.yml` for local multi-service setups, or prepare a Render secrets/env export for you.
