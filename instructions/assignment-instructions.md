# Azure VM Deployment Assignment

Source: OneNote section `Deploy to Azure VM` (11 pages), exported 2026-09-21.

## Goal

Deploy the existing W13 app (Next.js backend plus Vite React frontend) to an
Azure VM with Docker Compose behind Nginx and HTTPS.

## Professor's step overview

1. Create an Ubuntu 24.04 VM on Azure for Students
2. Map a DNS name to the VM, required for SSL
3. Open ports 80 and 443 in the Network Security Group
4. Adjust frontend and backend environment values for the DNS name
5. Create a Dockerfile for the backend: standalone Next output plus a basePath
   (professor's fresh-VM value: `/backend`)
6. Create a Dockerfile for the frontend: Vite build arg plus nginx:alpine
   serving `dist` with an SPA fallback
7. Clone the project to the server
8. Create a docker-compose.yml with backend, frontend, and an nginx-certbot
   container that binds 80/443 and fetches Let's Encrypt certificates
9. Build both images and start the services

## Submission

The OneNote section has no assignment or submission page yet. Confirm on MS
Teams what must be turned in. Likely the repo link plus the hosted URL.

## Approved deviations for this VM

The professor approved reusing the existing VM and subpath hosting, so the
fresh-VM steps do not apply:

- Reuse the existing VM `sai-aike-shwe-tun-aung-backend2.indonesiacentral.cloudapp.azure.com`
- Host under subpaths: `FQDN/webdev/w14/` (frontend) and `FQDN/webdev/w14/api/`
  (backend). The `/webdev/` prefix separates future Web Dev course projects
- `basePath` is `/webdev/w14` instead of `/backend`, and the Vite `base` is
  `/webdev/w14/`
- Skip `install_docker.sh`. Docker 29.8.1 with compose is installed, and the
  script removes running packages first
- Skip the nginx-certbot container, the `nginx-proxy` network, the `nginx/`
  conf dir, and the `/etc/letsencrypt` setup. Host nginx already owns 80/443
  with valid auto-renewing certificates
- Skip `apt update && apt upgrade` to avoid service restarts on a machine
  running five live projects
- Containers publish loopback ports only: backend `127.0.0.1:3002`, frontend
  `127.0.0.1:8091`. Host nginx adds one location block per path

## What changed from W13 and why

- `backend/next.config.mjs`: `output: "standalone"` and `basePath: "/webdev/w14"`
  so the backend answers under the subpath and the Docker image runs a small
  self-contained server
- `backend/src/proxy.js`: matcher stays on the plain W13 paths. Testing on
  Next 16.3.2 showed that Next strips the basePath before matching proxy
  paths, so a matcher written with the prefix never fires and the protected
  APIs become open. The non-working prefixed matcher is kept as a comment in
  the file
- `frontend/vite.config.js`: `base: "/webdev/w14/"` so built asset URLs
  resolve under the subpath
- `backend/Dockerfile`, `backend/.dockerignore`, `frontend/Dockerfile`,
  `frontend/.dockerignore`, `frontend/nginx.conf`, and the root
  `docker-compose.yml` added per the professor's pages, adapted to the
  existing-VM pattern
- `frontend/.env.development` now points at `http://localhost:3000/webdev/w14`
  so local dev matches the basePath
