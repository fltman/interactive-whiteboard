# Prestandakontroll

Analysera och optimera whiteboard-prestandan.

## Steg

1. **Mät nuvarande prestanda**
   - Antal objekt som kan renderas smooth (60fps)
   - Memory usage
   - Initial load time

2. **Identifiera flaskhalsar**
   - Canvas rendering
   - State updates
   - Event handlers
   - Re-renders

3. **Föreslå optimeringar**
   - Canvas: offscreen, dirty rects, caching
   - State: selectors, memoization
   - Events: throttling, debouncing

4. **Implementera förbättringar**

5. **Verifiera** - Mät igen och jämför

## Verktyg att använda

```bash
# Chrome DevTools
- Performance tab för rendering
- Memory tab för heap snapshots
- Lighthouse för övergripande

# React DevTools
- Profiler för re-renders
- Components för state
```

## Mål

- 60fps vid 500+ objekt
- < 100ms response på verktygsval
- < 50MB memory vid normal användning
