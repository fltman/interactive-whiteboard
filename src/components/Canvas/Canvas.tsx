import { useRef, useState, useCallback } from 'react';
import { useCanvas } from '../../hooks/useCanvas';
import { useWhiteboardStore } from '../../stores/whiteboard';
import { useTransform } from '../../hooks/useTransform';
import { Point, PathData, ShapeData, TextData, StickyData, ImageData, Size } from '../../types/whiteboard';
import { isPointInObject } from '../../utils/canvas';
import { AIImagePrompt } from '../AIImagePrompt';
import { AIWebPrompt } from '../AIWebPrompt';

export function Canvas() {
  const { canvasRef, render, captureRegion } = useCanvas();
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [cursor, setCursor] = useState('crosshair');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentPathRef = useRef<Point[]>([]);
  const pendingImagePosition = useRef<Point | null>(null);

  // AI Image state
  const [aiImagePrompt, setAiImagePrompt] = useState<{
    position: Point;
    size: Size;
    canvasImage: string | null;
    objectIdsInRegion: string[];
  } | null>(null);
  const [aiPreviewRect, setAiPreviewRect] = useState<{
    position: Point;
    size: Size;
  } | null>(null);

  // AI Web state
  const [aiWebPrompt, setAiWebPrompt] = useState<{
    position: Point;
    size: Size;
  } | null>(null);
  const [aiWebPreviewRect, setAiWebPreviewRect] = useState<{
    position: Point;
    size: Size;
  } | null>(null);

  const {
    transformState,
    getHandleAtPoint,
    startTransform,
    updateTransform,
    endTransform,
    getCursorForHandle,
  } = useTransform();

  const {
    activeTool,
    currentStyle,
    objects,
    selectedObjectIds,
    zoom,
    canvasOffset,
    addObject,
    updateObject,
    deleteObject,
    selectObjects,
    clearSelection,
    saveToHistory,
  } = useWhiteboardStore();

  // Only consider canvas-rendered objects (path, shape) for selection via canvas
  const canvasObjects = objects.filter(
    (obj) => obj.type === 'path' || obj.type === 'shape'
  );

  const getCanvasPoint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left - canvasOffset.x) / zoom,
        y: (e.clientY - rect.top - canvasOffset.y) / zoom,
      };
    },
    [canvasRef, zoom, canvasOffset]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const point = getCanvasPoint(e);

      setStartPoint(point);
      setIsDrawing(true);

      // Check if clicking on a selected canvas object's handle
      if (selectedObjectIds.length > 0 && activeTool === 'select') {
        const selectedObject = canvasObjects.find((obj) => selectedObjectIds.includes(obj.id));
        if (selectedObject) {
          const handle = getHandleAtPoint(point, selectedObject);
          if (handle) {
            startTransform(point, selectedObject, handle);
            return;
          }
        }
      }

      if (activeTool === 'select') {
        // Only select canvas objects (shapes, paths)
        const clickedObject = [...canvasObjects].reverse().find((obj) => isPointInObject(point, obj));
        if (clickedObject) {
          selectObjects([clickedObject.id]);
          startTransform(point, clickedObject, 'move');
        } else {
          clearSelection();
        }
        return;
      }

      if (activeTool === 'text') {
        // Create text object directly - editing happens via MediaLayer
        addObject({
          type: 'text',
          position: point,
          size: { width: 300, height: 100 },
          style: currentStyle,
          locked: false,
          rotation: 0,
          data: {
            content: '',
            fontSize: currentStyle.fontSize || 16,
            fontFamily: currentStyle.fontFamily || 'sans-serif',
          } as TextData,
        });
        saveToHistory();
        return;
      }

      if (activeTool === 'sticky') {
        // Create sticky object directly - editing happens via MediaLayer
        addObject({
          type: 'sticky',
          position: point,
          size: { width: 200, height: 150 },
          style: currentStyle,
          locked: false,
          rotation: 0,
          data: {
            content: '',
            backgroundColor: '#fef08a',
          } as StickyData,
        });
        saveToHistory();
        return;
      }

      if (activeTool === 'image') {
        pendingImagePosition.current = point;
        fileInputRef.current?.click();
        return;
      }

      if (activeTool === 'pen' || activeTool === 'eraser') {
        currentPathRef.current = [{ x: 0, y: 0 }];
        addObject({
          type: 'path',
          position: point,
          style: activeTool === 'eraser'
            ? { ...currentStyle, strokeWidth: 20 }
            : currentStyle,
          locked: false,
          rotation: 0,
          data: {
            points: [{ x: 0, y: 0 }],
            tool: activeTool,
          } as PathData,
        });
      }
    },
    [
      activeTool,
      canvasObjects,
      selectedObjectIds,
      currentStyle,
      getCanvasPoint,
      getHandleAtPoint,
      startTransform,
      addObject,
      selectObjects,
      clearSelection,
      saveToHistory,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const point = getCanvasPoint(e);

      // Update cursor based on what's under the mouse (canvas objects only)
      if (activeTool === 'select') {
        if (selectedObjectIds.length > 0) {
          const selectedObject = canvasObjects.find((obj) => selectedObjectIds.includes(obj.id));
          if (selectedObject) {
            const handle = getHandleAtPoint(point, selectedObject);
            if (handle) {
              setCursor(getCursorForHandle(handle));
            } else if (isPointInObject(point, selectedObject)) {
              setCursor('move');
            } else {
              setCursor('default');
            }
          } else {
            setCursor('default');
          }
        } else {
          const hoverObject = canvasObjects.find((obj) => isPointInObject(point, obj));
          setCursor(hoverObject ? 'pointer' : 'default');
        }
      } else {
        setCursor('crosshair');
      }

      // Handle active transform
      if (transformState.isTransforming && selectedObjectIds.length > 0) {
        const selectedObject = objects.find((obj) => selectedObjectIds.includes(obj.id));
        if (selectedObject) {
          const updates = updateTransform(point, selectedObject);
          if (updates) {
            updateObject(selectedObject.id, updates);
            render();
          }
        }
        return;
      }

      if (!isDrawing || !startPoint) return;

      // Update AI image preview rectangle
      if (activeTool === 'ai-image') {
        setAiPreviewRect({
          position: {
            x: Math.min(startPoint.x, point.x),
            y: Math.min(startPoint.y, point.y),
          },
          size: {
            width: Math.abs(point.x - startPoint.x),
            height: Math.abs(point.y - startPoint.y),
          },
        });
        return;
      }

      // Update AI web preview rectangle
      if (activeTool === 'ai-web') {
        setAiWebPreviewRect({
          position: {
            x: Math.min(startPoint.x, point.x),
            y: Math.min(startPoint.y, point.y),
          },
          size: {
            width: Math.abs(point.x - startPoint.x),
            height: Math.abs(point.y - startPoint.y),
          },
        });
        return;
      }

      if (activeTool === 'pen' || activeTool === 'eraser') {
        const relativePoint = {
          x: point.x - startPoint.x,
          y: point.y - startPoint.y,
        };
        currentPathRef.current.push(relativePoint);

        const currentObject = objects[objects.length - 1];
        if (currentObject && currentObject.type === 'path') {
          updateObject(currentObject.id, {
            data: {
              ...(currentObject.data as PathData),
              points: [...currentPathRef.current],
            },
          });
        }
      }

      render();
    },
    [
      isDrawing,
      startPoint,
      activeTool,
      objects,
      canvasObjects,
      selectedObjectIds,
      transformState,
      getCanvasPoint,
      getHandleAtPoint,
      getCursorForHandle,
      updateTransform,
      updateObject,
      render,
    ]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // End any active transform
      if (transformState.isTransforming) {
        endTransform();
        saveToHistory();
        return;
      }

      if (!isDrawing || !startPoint) {
        setIsDrawing(false);
        return;
      }

      const point = getCanvasPoint(e);

      // Handle AI image tool - show prompt dialog
      if (activeTool === 'ai-image') {
        const width = Math.abs(point.x - startPoint.x);
        const height = Math.abs(point.y - startPoint.y);
        const rectX = Math.min(startPoint.x, point.x);
        const rectY = Math.min(startPoint.y, point.y);

        // Only show prompt if rectangle is large enough
        if (width > 50 && height > 50) {
          // Capture the canvas region
          const canvasImage = captureRegion(rectX, rectY, width, height);

          // Find objects that overlap with the region (only canvas-rendered objects)
          const objectIdsInRegion = canvasObjects
            .filter((obj) => {
              const objPos = obj.position;
              const objSize = obj.size || { width: 0, height: 0 };
              // Check if object overlaps with rectangle
              return (
                objPos.x < rectX + width &&
                objPos.x + objSize.width > rectX &&
                objPos.y < rectY + height &&
                objPos.y + objSize.height > rectY
              );
            })
            .map((obj) => obj.id);

          setAiImagePrompt({
            position: { x: rectX, y: rectY },
            size: { width, height },
            canvasImage,
            objectIdsInRegion,
          });
        }

        setAiPreviewRect(null);
        setIsDrawing(false);
        setStartPoint(null);
        return;
      }

      // Handle AI web tool - show prompt dialog
      if (activeTool === 'ai-web') {
        const width = Math.abs(point.x - startPoint.x);
        const height = Math.abs(point.y - startPoint.y);
        const rectX = Math.min(startPoint.x, point.x);
        const rectY = Math.min(startPoint.y, point.y);

        // Only show prompt if rectangle is large enough
        if (width > 100 && height > 100) {
          setAiWebPrompt({
            position: { x: rectX, y: rectY },
            size: { width, height },
          });
        }

        setAiWebPreviewRect(null);
        setIsDrawing(false);
        setStartPoint(null);
        return;
      }

      if (activeTool === 'rectangle' || activeTool === 'ellipse') {
        addObject({
          type: 'shape',
          position: {
            x: Math.min(startPoint.x, point.x),
            y: Math.min(startPoint.y, point.y),
          },
          size: {
            width: Math.abs(point.x - startPoint.x),
            height: Math.abs(point.y - startPoint.y),
          },
          style: currentStyle,
          locked: false,
          rotation: 0,
          data: {
            shapeType: activeTool,
          } as ShapeData,
        });
        saveToHistory();
      } else if (activeTool === 'line' || activeTool === 'arrow') {
        addObject({
          type: 'shape',
          position: startPoint,
          style: currentStyle,
          locked: false,
          rotation: 0,
          data: {
            shapeType: activeTool,
            endPoint: point,
          } as ShapeData,
        });
        saveToHistory();
      } else if (activeTool === 'pen' || activeTool === 'eraser') {
        saveToHistory();
      }

      setIsDrawing(false);
      setStartPoint(null);
      currentPathRef.current = [];
      render();
    },
    [
      isDrawing,
      startPoint,
      activeTool,
      currentStyle,
      transformState,
      getCanvasPoint,
      addObject,
      saveToHistory,
      endTransform,
      render,
    ]
  );

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !pendingImagePosition.current) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxSize = 400;
          let width = img.width;
          let height = img.height;

          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }

          addObject({
            type: 'image',
            position: pendingImagePosition.current!,
            size: { width, height },
            style: currentStyle,
            locked: false,
            rotation: 0,
            data: {
              src: event.target?.result as string,
              originalSize: { width: img.width, height: img.height },
            } as ImageData,
          });

          saveToHistory();
          render();
          pendingImagePosition.current = null;
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);

      e.target.value = '';
    },
    [addObject, currentStyle, saveToHistory, render]
  );

  return (
    <div className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDrawing(false);
          if (transformState.isTransforming) {
            endTransform();
          }
        }}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* AI Image preview rectangle while drawing */}
      {aiPreviewRect && (
        <div
          className="absolute border-2 border-dashed border-purple-500 bg-purple-500/10 pointer-events-none"
          style={{
            left: aiPreviewRect.position.x * zoom + canvasOffset.x,
            top: aiPreviewRect.position.y * zoom + canvasOffset.y,
            width: aiPreviewRect.size.width * zoom,
            height: aiPreviewRect.size.height * zoom,
          }}
        />
      )}

      {/* AI Image prompt dialog */}
      {aiImagePrompt && (
        <AIImagePrompt
          position={aiImagePrompt.position}
          size={aiImagePrompt.size}
          onClose={() => setAiImagePrompt(null)}
          canvasOffset={canvasOffset}
          zoom={zoom}
          canvasImage={aiImagePrompt.canvasImage}
          objectIdsInRegion={aiImagePrompt.objectIdsInRegion}
        />
      )}

      {/* AI Web preview rectangle while drawing */}
      {aiWebPreviewRect && (
        <div
          className="absolute border-2 border-dashed border-cyan-500 bg-cyan-500/10 pointer-events-none"
          style={{
            left: aiWebPreviewRect.position.x * zoom + canvasOffset.x,
            top: aiWebPreviewRect.position.y * zoom + canvasOffset.y,
            width: aiWebPreviewRect.size.width * zoom,
            height: aiWebPreviewRect.size.height * zoom,
          }}
        />
      )}

      {/* AI Web prompt dialog */}
      {aiWebPrompt && (
        <AIWebPrompt
          position={aiWebPrompt.position}
          size={aiWebPrompt.size}
          onClose={() => setAiWebPrompt(null)}
          canvasOffset={canvasOffset}
          zoom={zoom}
        />
      )}
    </div>
  );
}
