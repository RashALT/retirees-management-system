# نظام إدارة المتقاعدين — Retirees Management System

تطبيق ويب (Arabic RTL, PWA) لإدارة المتقاعدين والورثة — القيادة العامة لشرطة الشارقة.
Built with React + Vite. Deploys as a static PWA.

## Requirements
- Node.js 18+ and npm

## Local development
```bash
npm install
npm run dev
```

## Production build
```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

## Deploy (Netlify)
Connect the repository to Netlify. Build settings are read from `netlify.toml`:
- Build command: `npm run build`
- Publish directory: `dist`

## Structure
- `src/RetireesMVP.jsx` — application (source of truth)
- `src/main.jsx` — entry point + service-worker registration
- `public/` — PWA manifest, service worker, and icons
- `index.html` — Vite HTML entry
