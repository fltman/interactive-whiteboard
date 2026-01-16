import { useState } from 'react';
import { useWhiteboardStore } from '../../stores/whiteboard';
import { v4 as uuidv4 } from 'uuid';
import type { ImageData } from '../../types/whiteboard';

interface AIImagePromptProps {
  position: { x: number; y: number };
  size: { width: number; height: number };
  onClose: () => void;
  canvasOffset: { x: number; y: number };
  zoom: number;
  canvasImage: string | null;
  objectIdsInRegion: string[];
}

const DEFAULT_SYSTEM_PROMPT = `Based on the provided sketch/drawing, generate a polished image.
Try to replicate the original image's objects, directions, concepts, and composition as closely as possible.
Maintain the same layout, positioning, and spatial relationships between elements.`;

export function AIImagePrompt({ position, size, onClose, canvasOffset, zoom, canvasImage, objectIdsInRegion }: AIImagePromptProps) {
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addObject, deleteObject, activeLayerId, currentStyle, setActiveTool, saveToHistory } = useWhiteboardStore();

  const handleGenerate = async () => {
    // Require prompt only if there's no image
    if (!prompt.trim() && !canvasImage) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          image: canvasImage, // Send captured canvas region if any
          systemPrompt: canvasImage ? systemPrompt : null, // Only send system prompt when there's an image
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      if (data.success && data.url) {
        // Delete objects that were in the region
        for (const id of objectIdsInRegion) {
          deleteObject(id);
        }

        // Create an image object at the drawn position
        const imageObject = {
          id: uuidv4(),
          type: 'image' as const,
          position: { x: position.x, y: position.y },
          size: { width: size.width, height: size.height },
          style: currentStyle,
          layerId: activeLayerId,
          locked: false,
          rotation: 0,
          data: {
            src: data.url,
            originalSize: { width: size.width, height: size.height },
          } as ImageData,
        };

        addObject(imageObject);
        saveToHistory();
        setActiveTool('select');
        onClose();
      } else {
        throw new Error('No image URL in response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
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
        className="fixed z-50 border-2 border-dashed border-purple-500 bg-purple-500/10 flex flex-col justify-end p-2"
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

        {/* Settings panel */}
        {showSettings && canvasImage && (
          <div className="mb-2 bg-white rounded-lg shadow-lg p-2">
            <div className="text-xs text-gray-500 mb-1">Systemprompt (för skiss-input):</div>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full p-2 text-xs border border-gray-200 rounded resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
              rows={3}
              disabled={isLoading}
            />
          </div>
        )}

        <div className="flex gap-2 w-full bg-white rounded-lg shadow-lg p-2">
          {canvasImage && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-2 py-2 text-gray-400 hover:text-gray-600 transition-colors text-sm"
              title="Inställningar"
            >
              ⚙️
            </button>
          )}
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Beskriv bilden..."
            className="flex-1 px-3 py-2 text-sm border-0 focus:outline-none focus:ring-0"
            autoFocus
            disabled={isLoading}
          />
          <button
            onClick={handleGenerate}
            disabled={(!prompt.trim() && !canvasImage) || isLoading}
            className="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              '✨'
            )}
          </button>
        </div>
      </div>
    </>
  );
}
