# AIonOS ACMS Web Frontend

Modern web console for the Automated Crew Management System. It implements the planner, OCC, admin, management and support screens from the ACMS frontend blueprint.

## What is included

- React + Vite frontend, deployable to GitHub Pages.
- 32 web screen concepts mapped into working navigation and interactive pages.
- Live demo mode with mock data.
- Apps Script webhook client for the Google Sheets backend.
- Screens for operations command center, roster editor, crew profile, recovery, scenario lab, rule console, analytics, Apps Script monitor, AI copilot and admin workflows.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Connect to Apps Script backend

1. Deploy the Apps Script backend from the `acms-appscript-backend` package as a Web App.
2. Copy the Web App `/exec` URL.
3. In this web app, paste it in **Admin > API URL** or create `.env` using `.env.example`:

```bash
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

The client uses simple `text/plain` JSON POST requests for Apps Script compatibility.

## GitHub Pages deployment

Upload this repo to GitHub, enable GitHub Pages from GitHub Actions, then run the included deploy workflow.
