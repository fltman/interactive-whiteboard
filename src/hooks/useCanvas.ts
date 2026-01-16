import { useRef, useEffect, useCallback } from 'react';
import { useWhiteboardStore } from '../stores/whiteboard';
import { drawObject } from '../utils/canvas';

export function useCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { objects, layers, selectedObjectIds, zoom, canvasOffset } = useWhiteboardStore();

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvasOffset.x, canvasOffset.y);
    ctx.scale(zoom, zoom);

    const sortedLayers = [...layers].sort((a, b) => a.order - b.order);

    for (const layer of sortedLayers) {
      if (!layer.visible) continue;

      // Filter out objects that are rendered as HTML by MediaLayer
      const layerObjects = objects.filter(
        (obj) =>
          obj.layerId === layer.id &&
          obj.type !== 'image' &&
          obj.type !== 'text' &&
          obj.type !== 'sticky' &&
          obj.type !== 'web'
      );
      for (const object of layerObjects) {
        drawObject(ctx, object, selectedObjectIds.includes(object.id));
      }
    }

    ctx.restore();
  }, [objects, layers, selectedObjectIds, zoom, canvasOffset]);

  useEffect(() => {
    render();
  }, [render]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    render();
  }, [render]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Capture a region of the canvas as base64 image
  const captureRegion = useCallback((x: number, y: number, width: number, height: number): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Create a temporary canvas for the region
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return null;

    // Calculate screen coordinates
    const screenX = x * zoom + canvasOffset.x;
    const screenY = y * zoom + canvasOffset.y;
    const screenWidth = width * zoom;
    const screenHeight = height * zoom;

    // Draw the region from the main canvas to the temp canvas
    tempCtx.drawImage(
      canvas,
      screenX, screenY, screenWidth, screenHeight,
      0, 0, width, height
    );

    // Check if the region has any non-transparent pixels
    const imageData = tempCtx.getImageData(0, 0, width, height);
    let hasContent = false;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] > 0) {
        hasContent = true;
        break;
      }
    }

    if (!hasContent) return null;

    return tempCanvas.toDataURL('image/png');
  }, [zoom, canvasOffset]);

  return { canvasRef, render, captureRegion };
}
