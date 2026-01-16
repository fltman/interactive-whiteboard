import { useState } from 'react';
import { useWhiteboardStore } from '../../stores/whiteboard';
import { v4 as uuidv4 } from 'uuid';
import type { WebData } from '../../types/whiteboard';

interface AIWebPromptProps {
  position: { x: number; y: number };
  size: { width: number; height: number };
  onClose: () => void;
  canvasOffset: { x: number; y: number };
  zoom: number;
}

export function AIWebPrompt({ position, size, onClose, canvasOffset, zoom }: AIWebPromptProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addObject, activeLayerId, currentStyle, setActiveTool, saveToHistory } = useWhiteboardStore();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-web', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate web content');
      }

      if (data.success && data.html) {
        // Create a web object at the drawn position
        const webObject = {
          id: uuidv4(),
          type: 'web' as const,
          position: { x: position.x, y: position.y },
          size: { width: size.width, height: size.height },
          style: currentStyle,
          layerId: activeLayerId,
          locked: false,
          rotation: 0,
          data: {
            html: data.html,
            prompt: prompt.trim(),
          } as WebData,
        };

        addObject(webObject);
        saveToHistory();
        setActiveTool('select');
        onClose();
      } else {
        throw new Error('No HTML in response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate web content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Calculate screen position
  const screenX = position.x * zoom + canvasOffset.x;
  const screenY = position.y * zoom + canvasOffset.y;
  const screenWidth = size.width * zoom;
  const screenHeight = size.height * zoom;

  return (
    <>
      {/* Overlay to capture clicks outside */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Input inside the rectangle */}
      <div
        className="fixed z-50 border-2 border-dashed border-cyan-500 bg-cyan-500/10 flex flex-col justify-end p-2"
        style={{
          left: screenX,
          top: screenY,
          width: screenWidth,
          height: screenHeight,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {error && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
            {error}
          </div>
        )}

        <div className="flex gap-2 w-full bg-white rounded-lg shadow-lg p-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Beskriv webbinnehållet... (t.ex. 'en klocka', 'tetris-spel')"
            className="flex-1 px-3 py-2 text-sm border-0 focus:outline-none focus:ring-0"
            autoFocus
            disabled={isLoading}
          />
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isLoading}
            className="px-3 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              '<>'
            )}
          </button>
        </div>
      </div>
    </>
  );
}
