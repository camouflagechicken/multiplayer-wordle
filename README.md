# Multiplayer Wordle

A real-time multiplayer Wordle clone built with React, Vite, Tailwind CSS, and Socket.io.

## Architecture

This project is designed to be split into two separate deployments for production:
1. **Frontend (Static Site):** Hosted on GitHub Pages (or Vercel/Netlify).
2. **Backend (WebSocket Server):** Hosted on Render (or Heroku/Railway).

---

## 🚀 Deployment Guide

### Part 1: Deploying the Backend to Render

The backend is a lightweight Node.js + Express + Socket.io server contained in `server.ts`.

1. Create a new **Web Service** on [Render](https://render.com/).
2. Connect your GitHub repository.
3. Configure the service:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npx tsx server.ts` (This runs the TypeScript server file directly).
4. **Environment Variables:**
   - Add `NODE_ENV` and set it to `production`.
5. Click **Deploy**.
6. Once deployed, copy the Render URL (e.g., `https://your-backend-app.onrender.com`). You will need this for the frontend.

### Part 2: Deploying the Frontend to GitHub Pages

The frontend is a static React application built with Vite.

1. In your project, create a `.env` file (or set the environment variable in your CI/CD pipeline) with the Render URL from Part 1:
   ```env
   VITE_SOCKET_URL=https://your-backend-app.onrender.com
   ```
2. If you are deploying to a subdirectory on GitHub Pages (e.g., `https://username.github.io/repo-name/`), update your `vite.config.ts` to include the base path:
   ```ts
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import tailwindcss from '@tailwindcss/vite'

   export default defineConfig({
     plugins: [react(), tailwindcss()],
     base: '/repo-name/', // Replace with your repository name
   })
   ```
3. Build the frontend:
   ```bash
   npm run build
   ```
4. The build output will be in the `dist/` directory. You can deploy this directory to GitHub Pages using the `gh-pages` npm package or via GitHub Actions.

#### Example GitHub Actions Workflow (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout 🛎️
        uses: actions/checkout@v3

      - name: Install and Build 🔧
        run: |
          npm ci
          npm run build
        env:
          VITE_SOCKET_URL: ${{ secrets.VITE_SOCKET_URL }} # Set this in GitHub Repository Secrets

      - name: Deploy 🚀
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: dist
```

---

## 💻 Local Development

To run the project locally with both the frontend and backend running together:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server (runs both Vite and the Socket.io server):
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser. The frontend will automatically connect to the local WebSocket server.

## How it Works

- **Game Loop:** The answer changes every 15 minutes based on a seeded random generator (tied to the current time epoch).
- **Multiplayer State:** Every time a player submits a valid guess, their entire grid state is emitted to the server via `playerStateUpdate`.
- **Broadcasting:** The server broadcasts this state to all other connected clients, who render a miniature version of the opponent's board in the side panel.
