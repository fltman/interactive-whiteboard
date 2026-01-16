import { useState, useCallback, useRef } from 'react';
import { Point, WhiteboardObject } from '../types/whiteboard';
import { getObjectBounds } from '../utils/canvas';

export type HandleType =
  | 'nw' | 'n' | 'ne'
  | 'w' | 'e'
  | 'sw' | 's' | 'se'
  | 'rotate'
  | 'move';

interface TransformState {
  isTransforming: boolean;
  handleType: HandleType | null;
  startPoint: Point | null;
  startBounds: { x: number; y: number; width: number; height: number } | null;
  startRotation: number;
}

export function useTransform() {
  const [transformState, setTransformState] = useState<TransformState>({
    isTransforming: false,
    handleType: null,
    startPoint: null,
    startBounds: null,
    startRotation: 0,
  });

  const originalObjectRef = useRef<WhiteboardObject | null>(null);

  const getHandleAtPoint = useCallback(
    (point: Point, object: WhiteboardObject): HandleType | null => {
      const bounds = getObjectBounds(object);
      const handleSize = 12;
      const rotateHandleDistance = 30;

      // Rotation handle (above the object)
      const rotateHandle = {
        x: bounds.x + bounds.width / 2,
        y: bounds.y - rotateHandleDistance,
      };
      if (
        Math.abs(point.x - rotateHandle.x) < handleSize &&
        Math.abs(point.y - rotateHandle.y) < handleSize
      ) {
        return 'rotate';
      }

      // Corner and edge handles
      const handles: { type: HandleType; x: number; y: number }[] = [
        { type: 'nw', x: bounds.x, y: bounds.y },
        { type: 'n', x: bounds.x + bounds.width / 2, y: bounds.y },
        { type: 'ne', x: bounds.x + bounds.width, y: bounds.y },
        { type: 'w', x: bounds.x, y: bounds.y + bounds.height / 2 },
        { type: 'e', x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
        { type: 'sw', x: bounds.x, y: bounds.y + bounds.height },
        { type: 's', x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
        { type: 'se', x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      ];

      for (const handle of handles) {
        if (
          Math.abs(point.x - handle.x) < handleSize &&
          Math.abs(point.y - handle.y) < handleSize
        ) {
          return handle.type;
        }
      }

      // Check if inside bounds for move
      if (
        point.x >= bounds.x &&
        point.x <= bounds.x + bounds.width &&
        point.y >= bounds.y &&
        point.y <= bounds.y + bounds.height
      ) {
        return 'move';
      }

      return null;
    },
    []
  );

  const startTransform = useCallback(
    (point: Point, object: WhiteboardObject, handleType: HandleType) => {
      const bounds = getObjectBounds(object);
      originalObjectRef.current = { ...object };
      setTransformState({
        isTransforming: true,
        handleType,
        startPoint: point,
        startBounds: bounds,
        startRotation: object.rotation,
      });
    },
    []
  );

  const updateTransform = useCallback(
    (
      currentPoint: Point,
      object: WhiteboardObject
    ): Partial<WhiteboardObject> | null => {
      const { isTransforming, handleType, startPoint, startBounds, startRotation } = transformState;

      if (!isTransforming || !handleType || !startPoint || !startBounds) {
        return null;
      }

      const dx = currentPoint.x - startPoint.x;
      const dy = currentPoint.y - startPoint.y;

      if (handleType === 'move') {
        return {
          position: {
            x: object.position.x + dx,
            y: object.position.y + dy,
          },
        };
      }

      if (handleType === 'rotate') {
        const centerX = startBounds.x + startBounds.width / 2;
        const centerY = startBounds.y + startBounds.height / 2;

        const startAngle = Math.atan2(startPoint.y - centerY, startPoint.x - centerX);
        const currentAngle = Math.atan2(currentPoint.y - centerY, currentPoint.x - centerX);
        const rotation = startRotation + (currentAngle - startAngle) * (180 / Math.PI);

        return { rotation };
      }

      // Resize handling
      let newX = startBounds.x;
      let newY = startBounds.y;
      let newWidth = startBounds.width;
      let newHeight = startBounds.height;

      const minSize = 20;

      switch (handleType) {
        case 'nw':
          newX = startBounds.x + dx;
          newY = startBounds.y + dy;
          newWidth = startBounds.width - dx;
          newHeight = startBounds.height - dy;
          break;
        case 'n':
          newY = startBounds.y + dy;
          newHeight = startBounds.height - dy;
          break;
        case 'ne':
          newY = startBounds.y + dy;
          newWidth = startBounds.width + dx;
          newHeight = startBounds.height - dy;
          break;
        case 'w':
          newX = startBounds.x + dx;
          newWidth = startBounds.width - dx;
          break;
        case 'e':
          newWidth = startBounds.width + dx;
          break;
        case 'sw':
          newX = startBounds.x + dx;
          newWidth = startBounds.width - dx;
          newHeight = startBounds.height + dy;
          break;
        case 's':
          newHeight = startBounds.height + dy;
          break;
        case 'se':
          newWidth = startBounds.width + dx;
          newHeight = startBounds.height + dy;
          break;
      }

      // Enforce minimum size
      if (newWidth < minSize) {
        if (handleType.includes('w')) {
          newX = startBounds.x + startBounds.width - minSize;
        }
        newWidth = minSize;
      }
      if (newHeight < minSize) {
        if (handleType.includes('n')) {
          newY = startBounds.y + startBounds.height - minSize;
        }
        newHeight = minSize;
      }

      return {
        position: { x: newX, y: newY },
        size: { width: newWidth, height: newHeight },
      };
    },
    [transformState]
  );

  const endTransform = useCallback(() => {
    setTransformState({
      isTransforming: false,
      handleType: null,
      startPoint: null,
      startBounds: null,
      startRotation: 0,
    });
    originalObjectRef.current = null;
  }, []);

  const getCursorForHandle = useCallback((handleType: HandleType | null): string => {
    if (!handleType) return 'default';

    const cursors: Record<HandleType, string> = {
      nw: 'nwse-resize',
      n: 'ns-resize',
      ne: 'nesw-resize',
      w: 'ew-resize',
      e: 'ew-resize',
      sw: 'nesw-resize',
      s: 'ns-resize',
      se: 'nwse-resize',
      rotate: 'grab',
      move: 'move',
    };

    return cursors[handleType];
  }, []);

  return {
    transformState,
    getHandleAtPoint,
    startTransform,
    updateTransform,
    endTransform,
    getCursorForHandle,
  };
}
