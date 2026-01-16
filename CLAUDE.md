# Interactive Whiteboard

> En webbaserad interaktiv whiteboard byggd med React + TypeScript och Canvas API.

## Projektöversikt

**Tech Stack:**
- Frontend: React 18 + TypeScript
- Styling: Tailwind CSS
- State: Zustand
- Build: Vite
- Canvas: HTML5 Canvas API

**Verktyg som ska implementeras:**
- Penna (olika storlekar/färger)
- Raderare
- Former (rektangel, cirkel, linje, pil)
- Text
- Sticky notes
- Bilduppladdning
- Layers/lager

## Kommandon

```bash
npm install          # Installera dependencies
npm run dev          # Starta utvecklingsserver (localhost:5173)
npm run build        # Bygg för produktion
npm run typecheck    # Kör TypeScript-kontroll
npm run lint         # Kör linter
```

## Projektstruktur

```
src/
├── components/
│   ├── Canvas/           # Huvudcanvas och rendering
│   ├── Toolbar/          # Verktygspaletten
│   ├── LayerPanel/       # Lagerhantering
│   └── PropertyPanel/    # Egenskaper för valt objekt
├── hooks/
│   ├── useCanvas.ts      # Canvas-logik
│   ├── useTool.ts        # Verktygshantering
│   └── useHistory.ts     # Undo/redo
├── stores/
│   └── whiteboard.ts     # Zustand store för state
├── types/
│   └── whiteboard.ts     # TypeScript-typer
└── utils/
    ├── canvas.ts         # Canvas-hjälpfunktioner
    └── geometry.ts       # Geometriberäkningar
```

## Arkitekturprinciper

### Canvas-rendering
- Använd en **offscreen canvas** för bättre prestanda
- Rendera endast vid ändringar (dirty flag pattern)
- Separera objekt i lager för flexibilitet

### State Management
- **Zustand** för global state (verktyg, objekt, lager)
- Immutable updates för undo/redo-funktionalitet
- Debounce för historia-sparning

### Objektmodell
Varje element på whiteboarden är ett objekt med:
```typescript
interface WhiteboardObject {
  id: string;
  type: 'path' | 'shape' | 'text' | 'sticky' | 'image';
  position: { x: number; y: number };
  size?: { width: number; height: number };
  style: ObjectStyle;
  layerId: string;
  locked: boolean;
}
```

## Arbetsflöde

1. **Planera först** - Använd `/plan` eller beskriv vad du ska göra
2. **En feature i taget** - Håll PRs små och fokuserade
3. **Testa lokalt** - Kör `npm run dev` och verifiera i webbläsaren
4. **Typecheck** - Kör alltid `npm run typecheck` innan commit

## Subagenter

Teamet har tillgång till specialiserade agenter:

- **canvas-specialist** - För canvas-rendering och prestanda
- **ux-designer** - För UI/UX-beslut och användbarhet
- **state-architect** - För state management och dataflöden

## Framtida utbyggnad

Projektet är förberett för:
- [ ] Realtidssamarbete (WebSocket/Socket.io)
- [ ] Export till PNG/SVG/PDF
- [ ] Mallar och komponenter
- [ ] Touch/pen-stöd för tablets

## Viktigt

- Canvas-koordinater: (0,0) är övre vänstra hörnet
- Använd `requestAnimationFrame` för smooth rendering
- Testa med stora antal objekt för prestandakontroll
