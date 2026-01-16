import { useState, useRef, useEffect } from 'react';
import { WhiteboardObject, StickyData } from '../../types/whiteboard';
import { useMediaTransform } from './useMediaTransform';
import { SelectionHandles } from './SelectionHandles';

interface StickyElementProps {
  object: WhiteboardObject;
  isSelected: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onUpdate: (id: string, updates: Partial<WhiteboardObject>) => void;
  onTransformEnd: () => void;
}

const stickyColors = [
  '#fef08a', // Yellow
  '#fecaca', // Red
  '#bbf7d0', // Green
  '#bfdbfe', // Blue
  '#ddd6fe', // Purple
  '#fed7aa', // Orange
  '#fbcfe8', // Pink
  '#e5e7eb', // Gray
];

export function StickyElement({
  object,
  isSelected,
  onSelect,
  onUpdate,
  onTransformEnd,
}: StickyElementProps) {
  const { startTransform, getCursor } = useMediaTransform(object, onUpdate, onTransformEnd);
  const [isEditing, setIsEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const data = object.data as StickyData;
  const width = object.size?.width || 200;
  const height = object.size?.height || 200;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(object.id, e.shiftKey);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && isSelected && !isEditing) {
      startTransform(e, 'move');
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onTransformEnd();
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(object.id, {
      data: { ...data, content: e.target.value },
    });
  };

  const handleColorChange = (color: string) => {
    onUpdate(object.id, {
      data: { ...data, backgroundColor: color },
    });
    setShowColorPicker(false);
    onTransformEnd();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
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
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="w-full h-full rounded-lg shadow-lg p-3 flex flex-col"
        style={{ backgroundColor: data.backgroundColor || '#fef08a' }}
      >
        {/* Color picker button */}
        {isSelected && !isEditing && (
          <div className="absolute -top-2 -right-2 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
              }}
              className="w-6 h-6 rounded-full bg-white shadow border-2 border-gray-200 flex items-center justify-center text-xs hover:scale-110 transition-transform"
              title="Byt färg"
            >
              🎨
            </button>

            {showColorPicker && (
              <div className="absolute top-8 right-0 bg-white rounded-lg shadow-lg p-2 grid grid-cols-4 gap-1 z-20">
                {stickyColors.map((color) => (
                  <button
                    key={color}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleColorChange(color);
                    }}
                    className={`w-6 h-6 rounded ${
                      data.backgroundColor === color
                        ? 'ring-2 ring-blue-500 ring-offset-1'
                        : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={data.content}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="flex-1 w-full bg-transparent resize-none outline-none text-gray-800"
            style={{ fontSize: '14px', lineHeight: '1.5' }}
          />
        ) : (
          <div
            className="flex-1 overflow-auto text-gray-800 whitespace-pre-wrap"
            style={{ fontSize: '14px', lineHeight: '1.5' }}
          >
            {data.content || 'Dubbelklicka för att redigera...'}
          </div>
        )}
      </div>

      {isSelected && !isEditing && (
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
