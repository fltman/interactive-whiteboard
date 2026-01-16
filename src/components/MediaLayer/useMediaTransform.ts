import { useState, useCallback, useRef, useEffect } from 'react';
import { WhiteboardObject, Point } from '../../types/whiteboard';

export type HandleType = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se' | 'rotate' | 'move';

interface TransformState {
  isDragging: boolean;
  isResizing: boolean;
  isRotating: boolean;
  handle: HandleType | null;
  startPos: Point;
  startObjectPos: Point;
  startObjectSize: { width: number; height: number };
  startRotation: number;
}

const initialState: TransformState = {
  isDragging: false,
  isResizing: false,
  isRotating: false,
  handle: null,
  startPos: { x: 0, y: 0 },
  startObjectPos: { x: 0, y: 0 },
  startObjectSize: { width: 0, height: 0 },
  startRotation: 0,
};

export function useMediaTransform(
  object: WhiteboardObject,
  onUpdate: (id: string, updates: Partial<WhiteboardObject>) => void,
  onTransformEnd: () => void
) {
  const [state, setState] = useState<TransformState>(initialState);
  const objectRef = useRef(object);
  objectRef.current = object;

  const startTransform = useCallback(
    (e: React.MouseEvent, handle: HandleType) => {
      e.stopPropagation();
      e.preventDefault();

      const obj = objectRef.current;
      setState({
        isDragging: handle === 'move',
        isResizing: handle !== 'move' && handle !== 'rotate',
        isRotating: handle === 'rotate',
        handle,
        startPos: { x: e.clientX, y: e.clientY },
        startObjectPos: { ...obj.position },
        startObjectSize: obj.size ? { ...obj.size } : { width: 200, height: 100 },
        startRotation: obj.rotation || 0,
      });
    },
    []
  );

  const updateTransform = useCallback(
    (e: MouseEvent) => {
      if (!state.isDragging && !state.isResizing && !state.isRotating) return;

      const dx = e.clientX - state.startPos.x;
      const dy = e.clientY - state.startPos.y;
      const obj = objectRef.current;

      if (state.isDragging) {
        onUpdate(obj.id, {
          position: {
            x: state.startObjectPos.x + dx,
            y: state.startObjectPos.y + dy,
          },
        });
      } else if (state.isResizing && state.handle) {
        let newWidth = state.startObjectSize.width;
        let newHeight = state.startObjectSize.height;
        let newX = state.startObjectPos.x;
        let newY = state.startObjectPos.y;

        const handle = state.handle;

        // Handle resize based on which handle is being dragged
        if (handle.includes('e')) {
          newWidth = Math.max(50, state.startObjectSize.width + dx);
        }
        if (handle.includes('w')) {
          newWidth = Math.max(50, state.startObjectSize.width - dx);
          newX = state.startObjectPos.x + dx;
        }
        if (handle.includes('s')) {
          newHeight = Math.max(50, state.startObjectSize.height + dy);
        }
        if (handle.includes('n')) {
          newHeight = Math.max(50, state.startObjectSize.height - dy);
          newY = state.startObjectPos.y + dy;
        }

        onUpdate(obj.id, {
          position: { x: newX, y: newY },
          size: { width: newWidth, height: newHeight },
        });
      } else if (state.isRotating) {
        // Calculate rotation based on mouse position relative to object center
        const centerX = state.startObjectPos.x + state.startObjectSize.width / 2;
        const centerY = state.startObjectPos.y + state.startObjectSize.height / 2;

        const startAngle = Math.atan2(
          state.startPos.y - centerY,
          state.startPos.x - centerX
        );
        const currentAngle = Math.atan2(
          e.clientY - centerY,
          e.clientX - centerX
        );

        const deltaAngle = (currentAngle - startAngle) * (180 / Math.PI);
        let newRotation = state.startRotation + deltaAngle;

        // Snap to 15 degree increments if shift is held
        if (e.shiftKey) {
          newRotation = Math.round(newRotation / 15) * 15;
        }

        onUpdate(obj.id, { rotation: newRotation });
      }
    },
    [state, onUpdate]
  );

  const endTransform = useCallback(() => {
    if (state.isDragging || state.isResizing || state.isRotating) {
      onTransformEnd();
    }
    setState(initialState);
  }, [state, onTransformEnd]);

  useEffect(() => {
    if (state.isDragging || state.isResizing || state.isRotating) {
      const handleMouseMove = (e: MouseEvent) => updateTransform(e);
      const handleMouseUp = () => endTransform();

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [state.isDragging, state.isResizing, state.isRotating, updateTransform, endTransform]);

  const getCursor = (handle: HandleType): string => {
    if (handle === 'move') return 'move';
    if (handle === 'rotate') return 'grab';
    const cursorMap: Record<string, string> = {
      nw: 'nwse-resize',
      se: 'nwse-resize',
      ne: 'nesw-resize',
      sw: 'nesw-resize',
      n: 'ns-resize',
      s: 'ns-resize',
      e: 'ew-resize',
      w: 'ew-resize',
    };
    return cursorMap[handle] || 'default';
  };

  return {
    isTransforming: state.isDragging || state.isResizing || state.isRotating,
    startTransform,
    getCursor,
  };
}
