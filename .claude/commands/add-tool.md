# Lägg till nytt ritverktyg

Hjälp mig implementera ett nytt ritverktyg för whiteboarden.

## Steg

1. **Analysera befintliga verktyg** - Läs igenom hur andra verktyg är implementerade i `src/components/Toolbar/` och `src/hooks/useTool.ts`

2. **Definiera verktygets beteende**:
   - Vad händer vid mousedown/touchstart?
   - Vad händer vid mousemove/touchmove?
   - Vad händer vid mouseup/touchend?
   - Vilka egenskaper ska verktyget ha (färg, storlek, etc.)?

3. **Skapa verktygskomponent** i Toolbar

4. **Implementera verktygslogik** i useTool hook

5. **Lägg till i store** med relevanta actions

6. **Testa** - Verifiera i webbläsaren med `npm run dev`

## Verktyg som argument

$ARGUMENTS

## Checklista

- [ ] Verktygsikon i toolbar
- [ ] Cursor ändras vid aktivering
- [ ] Mousedown startar operation
- [ ] Mousemove uppdaterar preview
- [ ] Mouseup skapar objekt
- [ ] Undo/redo fungerar
- [ ] Touch-events fungerar
