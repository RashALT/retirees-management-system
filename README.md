# نظام إدارة المتقاعدين — Retirees Management System

Arabic RTL PWA for managing retirees and heirs — General Command of Sharjah Police.
React + Vite. Flat repository (all files at the root — no src/ or public/ folders).

## Requirements
- Node.js 18+ and npm

## Install & run
```bash
npm install
npm run dev
```

## Production build
```bash
npm run build      # outputs to dist/
npm run preview
```

## Deploy (Netlify)
Build command: `npm run build` · Publish directory: `dist` (see netlify.toml).

## Files (all at root)
- index.html — Vite entry
- main.jsx — entry point + service-worker registration
- RetireesMVP.jsx — application (source of truth)
- manifest.json, service-worker.js, icon-192.png, icon-512.png — PWA assets
- vite.config.js, package.json, netlify.toml, .gitignore
