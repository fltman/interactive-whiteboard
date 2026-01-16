import { useMemo } from 'react';
import { WhiteboardObject, WebData } from '../../types/whiteboard';
import { useMediaTransform } from './useMediaTransform';
import { SelectionHandles } from './SelectionHandles';

interface WebElementProps {
  object: WhiteboardObject;
  isSelected: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onUpdate: (id: string, updates: Partial<WhiteboardObject>) => void;
  onTransformEnd: () => void;
}

export function WebElement({
  object,
  isSelected,
  onSelect,
  onUpdate,
  onTransformEnd,
}: WebElementProps) {
  const { startTransform, getCursor } = useMediaTransform(object, onUpdate, onTransformEnd);
  const data = object.data as WebData;
  const width = object.size?.width || 400;
  const height = object.size?.height || 300;

  // Create a blob URL for the HTML content
  const srcDoc = useMemo(() => {
    return data.html;
  }, [data.html]);

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
      <div className="w-full h-full rounded-lg shadow-lg overflow-hidden border border-gray-300 bg-white">
        {/* Header bar */}
        <div className="h-6 bg-gray-100 border-b border-gray-200 flex items-center px-2 gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="ml-2 text-xs text-gray-500 truncate flex-1" title={data.prompt}>
            {data.prompt || 'AI Web'}
          </span>
        </div>

        {/* Iframe container */}
        <iframe
          srcDoc={srcDoc}
          title="AI Generated Web Content"
          className="w-full border-0"
          style={{
            height: height - 24, // Subtract header height
            pointerEvents: isSelected ? 'none' : 'auto',
          }}
          sandbox="allow-scripts"
        />
      </div>

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
