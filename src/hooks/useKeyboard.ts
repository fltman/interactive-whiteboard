import { useEffect } from 'react';
import { useWhiteboardStore } from '../stores/whiteboard';

export function useKeyboard() {
  const { undo, redo, deleteObject, selectedObjectIds, setActiveTool, clearSelection, bringToFront, sendToBack, bringForward, sendBackward, saveToHistory } =
    useWhiteboardStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInputFocused) return;

      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }

      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        selectedObjectIds.forEach((id) => deleteObject(id));
        return;
      }

      // Escape: Clear selection
      if (e.key === 'Escape') {
        e.preventDefault();
        clearSelection();
        return;
      }

      // Z-order: Ctrl+Up/Down, Ctrl+Shift+Up/Down
      if ((e.ctrlKey || e.metaKey) && selectedObjectIds.length === 1) {
        const id = selectedObjectIds[0];
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (e.shiftKey) {
            bringToFront(id);
          } else {
            bringForward(id);
          }
          saveToHistory();
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (e.shiftKey) {
            sendToBack(id);
          } else {
            sendBackward(id);
          }
          saveToHistory();
          return;
        }
      }

      // Tool shortcuts
      const toolShortcuts: Record<string, Parameters<typeof setActiveTool>[0]> = {
        v: 'select',
        p: 'pen',
        e: 'eraser',
        r: 'rectangle',
        o: 'ellipse',
        l: 'line',
        a: 'arrow',
        t: 'text',
        s: 'sticky',
        i: 'image',
      };

      if (toolShortcuts[e.key.toLowerCase()] && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveTool(toolShortcuts[e.key.toLowerCase()]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, deleteObject, selectedObjectIds, setActiveTool, clearSelection, bringToFront, sendToBack, bringForward, sendBackward, saveToHistory]);
}
