# 🎵 PlayPod - Full-Stack Music Web Application

Live App (Vercel): https://play-pod-web-app.vercel.app
---

## 📌 Project Overview

**PlayPod** is a simple full-stack music streaming web app. It allows users to:
- Browse and play popular tracks
- View albums and tracks inside them
- Search music by title or artist
- Add/remove favorite tracks
- Keep history of listened songs
- Control music playback (play, pause, shuffle, repeat)

---

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js + Express.js
- **External API**: Deezer Public API (proxied through backend)
- **Deployment**: Vercel (frontend), Render (backend)
- **Storage**: localStorage for favorites & history
- **No database**: all content is fetched live from Deezer API

---

## How to Run Locally

1. Clone the repository:

```bash
git clone https://github.com/Magzhan1M/PlayPod-web-app.git
cd PlayPod-web-app
```
2.	Install dependencies:
```bash
npm install
```
3.	Start the server:
```bash
node server.js
```
4.	Open index.html in your browser (via Live Server or by hosting frontend)

---

## 🛠️ Development & Design Process

- Initially designed as a static frontend using the Deezer API.
- Then built a backend server to proxy API requests and avoid CORS issues.
- Implemented reusable rendering functions for albums/tracks.
- Added music controls and dynamic UI updates.
- Used `localStorage` to manage favorites and play history without a backend database.
- Made the app mobile-friendly and responsive using CSS grid/flexbox.

---

## Unique Features & Methods

- Live search from Deezer API via custom backend.
- Seamless switch between sections (Home, Albums, Favorites, History).
- Dynamic rendering and interactivity with pure JavaScript.
- Persistent favorites and history stored locally per user.
- Backend response formatting matches frontend expectations for cleaner integration.

---

## Development Trade-offs

- No authentication or real database: `localStorage` was used instead.
- Search and filtering is live via Deezer, so app depends on external API uptime.
- Favorites/history are not shared across devices since no user login system.
- Used Vanilla JS instead of React to keep app lightweight and easier to deploy.

---

## Known Issues

- Audio autoplay might be blocked by some browsers — user must click play.
- No pagination for albums or search — only first page of Deezer API results used.
- Network issues on Deezer API may affect responsiveness.

---

## Why This Stack?

- **Node.js + Express**: Lightweight server, easy to set up proxy routes.
- **Deezer API**: Publicly available music data with album, track, and preview audio.
- **HTML/CSS/JS**: Good base for frontend structure and control, with no need for frameworks in small projects.
- **Vercel + Render**: Free and reliable platforms to deploy full-stack applications without complex configs.

---
