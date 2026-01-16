# Testa feature

Systematiskt testa en whiteboard-feature.

## Feature att testa

$ARGUMENTS

## Testprotokoll

### 1. Grundfunktion
- [ ] Fungerar som förväntat vid normal användning
- [ ] Visuell feedback är korrekt

### 2. Edge cases
- [ ] Tom canvas
- [ ] Många objekt (100+)
- [ ] Små/stora värden
- [ ] Snabba upprepade operationer

### 3. Interaktion med andra features
- [ ] Fungerar med olika verktyg
- [ ] Fungerar med selection
- [ ] Fungerar med undo/redo
- [ ] Fungerar med layers

### 4. Input-metoder
- [ ] Mus
- [ ] Touch (om tillämpligt)
- [ ] Keyboard shortcuts

### 5. State
- [ ] State uppdateras korrekt
- [ ] Inga memory leaks
- [ ] Serialisering fungerar (spara/ladda)

## Rapportera

Lista eventuella buggar med:
1. Steg för att reproducera
2. Förväntat beteende
3. Faktiskt beteende
