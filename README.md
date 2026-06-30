# Interactive Whiteboard

[![Support me on Patreon](https://img.shields.io/badge/Patreon-Support%20my%20work-FF424D?style=flat&logo=patreon&logoColor=white)](https://www.patreon.com/AndersBjarby)

A web-based interactive whiteboard built with React + TypeScript and the HTML5 Canvas API, with peer-to-peer collaboration and AI-powered content generation. Draw, drop in media, share a board via QR code, and let Claude/Gemini generate images or web snippets straight onto the canvas.

## Features

- Canvas drawing tools, sticky notes, text and shapes
- Media layer: images, YouTube embeds, web embeds, documents and links
- Image upload and file handling (up to 50 MB)
- AI image generation via OpenRouter (Gemini image model)
- AI web-content generation (inline, self-contained HTML)
- Peer-to-peer collaboration using PeerJS, with QR-code session sharing
- State managed with Zustand

## Setup

```bash
npm install
cp .env.example .env   # add your OPENROUTER_API_KEY
npm start              # runs the Vite client and the Express server together
```

- Client (Vite) runs on `localhost:5173`
- API server (Express) runs on port `3001` and exposes `/api/upload`, `/api/generate-image` and `/api/generate-web`

You can also run the pieces separately with `npm run dev` (client) and `npm run server` (API). Build with `npm run build`; type-check with `npm run typecheck`.

## Tech

React 18, TypeScript, Vite, Tailwind CSS, Zustand, HTML5 Canvas. Backend: Express + Multer, OpenRouter (OpenAI SDK), PeerJS and QRCode.
