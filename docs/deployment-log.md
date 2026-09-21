# W14 Azure VM Deployment Log

Date: 2026-09-21
Repository: `csx4107-w14-azure-vm-deployment`
App: the W13 password-change app (Next.js backend plus Vite React frontend)
Target: the existing course Azure VM, hosted under a subpath, both approved by
the professor. Full VM context: `VM-HANDOFF-CONTEXT.md` in the workspace root
(not in this repo).

## Environment

- VM: `sai-aike-shwe-tun-aung-backend2.indonesiacentral.cloudapp.azure.com`,
  Ubuntu 24.04, 2 vCPU, 3.8 GB RAM
- Docker 29.8.1 with the compose plugin, installed on the host
- Host nginx owns ports 80 and 443, Let's Encrypt certificate valid to
  2026-11-24, auto-renewing
- Other tenants on the same VM: PM2 node app on 3000, Go API on 3001, MySQL on
  3306, Apache with WordPress on 8080, AU Bounty containers on loopback 8090
- Ports used by this project: loopback 3002 (backend), loopback 8091
  (frontend), both free before the deploy

## Public paths

- `https://<FQDN>/webdev/w14/` frontend
- `https://<FQDN>/webdev/w14/api/` backend

## Repo changes (commit `1cf71c2`)

- `backend/next.config.mjs`: `output: "standalone"` and
  `basePath: "/webdev/w14"`
- `backend/src/proxy.js`: matcher kept on the plain W13 paths. See finding 1
  below
- `backend/Dockerfile` and `backend/.dockerignore`: professor's multi stage
  build, includes python3, make, and g++ for bcrypt
- `frontend/Dockerfile`, `frontend/.dockerignore`, `frontend/nginx.conf`:
  professor's files, Vite build arg plus nginx:alpine serving `dist` with an
  SPA fallback
- `frontend/vite.config.js`: `base: "/webdev/w14/"`
- root `docker-compose.yml`: containers `w14-backend` (`127.0.0.1:3002:3000`)
  and `w14-frontend` (`127.0.0.1:8091:80`), build arg
  `VITE_API_URL=https://<FQDN>/webdev/w14`, `restart: unless-stopped`, no
  nginx-certbot service and no extra networks or volumes
- Git history: `89b64f9` remote initial commit with empty README, then
  `33b2312` copied app source from w13, then `1cf71c2` added azure vm
  deployment setup

## VM steps performed

1. `mkdir -p ~/apps/webdev` then
   `git clone https://github.com/Sai-Aike-STA/csx4107-w14-azure-vm-deployment.git w14`
2. Created `~/apps/webdev/w14/backend/.env` from the local `.env.local` values
   with these changes: `NODE_ENV=production`, and
   `FRONTEND_URL=https://<FQDN>` with scheme and host only, no path.
   `MONGODB_USERNAME` and `MONGODB_PASSWORD` were dropped, the code never
   reads them. The variable name is `ADMIN_USER_MAIL`, not the professor's
   `ADMIN_USER`, because that is what the login route reads
3. `docker compose up --build` built both images (about 83 seconds) and
   started both containers

## nginx changes

Backup first: `default.backup-2026-09-21` next to the config. Two blocks
added inside the existing `server { listen 443 ssl; ... }` section of
`/etc/nginx/sites-available/default`, then `sudo nginx -t` and
`sudo systemctl reload nginx`:

```nginx
location /webdev/w14/api/ {
    proxy_pass http://127.0.0.1:3002;     # NO trailing slash, path passed verbatim
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
}

location /webdev/w14/ {
    proxy_pass http://127.0.0.1:8091/;    # trailing slash, prefix stripped
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
}
```

The `$connection_upgrade` map already exists at the top of the file. The two
proxy_pass lines are intentionally different, see finding 2.

## Problems hit and fixes

1. **Proxy matcher versus basePath.** With the matcher written as
   `/webdev/w14/api/item/:path*` the proxy never ran and the item API was
   open, a local test returned the full item list with no login. Next 16.3.2
   strips the basePath before matching proxy paths, so the matcher must stay
   on the plain paths `/api/item/:path*` and `/api/user/:path*`. Verified 401
   without login after the fix. The dead prefixed matcher is kept as a comment
   in `backend/src/proxy.js`
2. **Blank white page after deploy.** The frontend block first had
   `proxy_pass http://127.0.0.1:8091;` without the trailing slash, so the
   frontend container received `/webdev/w14/assets/...`, which does not exist
   inside it (files sit at `/usr/share/nginx/html/assets/`). The SPA fallback
   answered `index.html` with `Content-Type: text/html` for the JS request,
   the browser refused to run it, and the page stayed white. Fix: trailing
   slash on the 8091 block only, which strips the prefix. The API block must
   keep no slash because the backend basePath needs the full path
3. **Browser cache.** After the nginx fix the old broken asset response was
   still cached. A hard refresh or private window fixed the display

Rule of thumb from findings 1 and 2: the API block keeps the path, the
frontend block strips it. Never change one to match the other.

## Final verification, all through the public URL on 2026-09-21

- `GET /webdev/w14/` returned 200 with the app shell and correct asset paths
- `GET /webdev/w14/api/hello` returned `{"message":"hello world"}`
- `GET /webdev/w14/api/item` without login returned 401 Unauthorized
- Admin login returned 200 with a working cookie, `/api/me` returned the
  admin user, and the item list returned 201
- Plain http 301 redirected to https
- Regression sweep stayed 200 for `/`, `/api/products`, `/go/api/products`,
  `/content/`, and `/aubounty/`

## How to update the app later

1. Push changes to GitHub
2. On the VM: `cd ~/apps/webdev/w14 && git pull`
3. `docker compose up --build`. Frontend changes always need the rebuild
   because `VITE_API_URL` is a build argument baked into the bundle
4. Backend `.env` changes need only `docker compose stop backend` then
   `docker compose up backend`, no rebuild
5. nginx needs no changes unless the paths or ports change

## Still open

- Confirm the submission requirements on MS Teams, the OneNote section has
  no submission page
- Submit repo link plus hosted link
