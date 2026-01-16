import { WhiteboardObject, ImageData } from '../../types/whiteboard';
import { useMediaTransform } from './useMediaTransform';
import { SelectionHandles } from './SelectionHandles';

interface ImageElementProps {
  object: WhiteboardObject;
  isSelected: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onUpdate: (id: string, updates: Partial<WhiteboardObject>) => void;
  onTransformEnd: () => void;
}

export function ImageElement({
  object,
  isSelected,
  onSelect,
  onUpdate,
  onTransformEnd,
}: ImageElementProps) {
  const { startTransform, getCursor } = useMediaTransform(object, onUpdate, onTransformEnd);
  const data = object.data as ImageData;
  const width = object.size?.width || 200;
  const height = object.size?.height || 200;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(object.id, e.shiftKey);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && isSelected) {
      startTransform(e, 'move');
    }
  };

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        left: object.position.x,
        top: object.position.y,
        width,
        height,
        transform: `rotate(${object.rotation || 0}deg)`,
        transformOrigin: 'center center',
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      <img
        src={data.src}
        alt="Whiteboard image"
        className="w-full h-full object-contain rounded shadow-lg"
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
        draggable={false}
      />

      {isSelected && (
        <SelectionHandles
          width={width}
          height={height}
          onHandleMouseDown={startTransform}
          getCursor={getCursor}
        />
      )}
    </div>
  );
}
