import { useState } from 'react';
import { WhiteboardObject, StickyData } from '../../types/whiteboard';
import { useMediaTransform } from './useMediaTransform';
import { SelectionHandles } from './SelectionHandles';

interface LinkElementProps {
  object: WhiteboardObject;
  isSelected: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onUpdate: (id: string, updates: Partial<WhiteboardObject>) => void;
  onTransformEnd: () => void;
}

export function LinkElement({
  object,
  isSelected,
  onSelect,
  onUpdate,
  onTransformEnd,
}: LinkElementProps) {
  const { startTransform, getCursor } = useMediaTransform(object, onUpdate, onTransformEnd);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const data = object.data as StickyData;
  const width = object.size?.width || 400;
  const height = object.size?.height || (isExpanded ? 300 : 80);

  // Extract title and URL from content (format: "🔗 Title\nURL")
  const lines = data.content.split('\n');
  const title = lines[0]?.replace('🔗 ', '') || 'Länk';
  const url = lines[1] || '';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(object.id, e.shiftKey);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && isSelected) {
      startTransform(e, 'move');
    }
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    // Update size when expanding/collapsing
    onUpdate(object.id, {
      size: { width, height: isExpanded ? 80 : 300 },
    });
  };

  const handleOpenExternal = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Try to get domain for display
  let domain = '';
  try {
    domain = new URL(url).hostname;
  } catch {
    domain = url;
  }

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        left: object.position.x,
        top: object.position.y,
        width,
        height: isExpanded ? height : 80,
        transform: `rotate(${object.rotation || 0}deg)`,
        transformOrigin: 'center center',
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      <div
        className="w-full h-full rounded-lg shadow-lg overflow-hidden flex flex-col"
        style={{ backgroundColor: data.backgroundColor || '#dbeafe' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 p-3 bg-white/50 border-b">
          <span className="text-lg">🔗</span>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-800 truncate">{title}</div>
            <div className="text-xs text-gray-500 truncate">{domain}</div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleToggleExpand}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/10 text-sm"
              title={isExpanded ? 'Minimera' : 'Visa förhandsgranskning'}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
            <button
              onClick={handleOpenExternal}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/10 text-sm"
              title="Öppna i ny flik"
            >
              ↗
            </button>
          </div>
        </div>

        {/* Iframe preview */}
        {isExpanded && (
          <div className="flex-1 relative bg-white">
            {loadError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                <span className="text-4xl mb-2">🚫</span>
                <p className="text-sm">Sidan kunde inte laddas i förhandsgranskning</p>
                <button
                  onClick={handleOpenExternal}
                  className="mt-2 text-blue-500 hover:underline text-sm"
                >
                  Öppna i ny flik istället
                </button>
              </div>
            ) : (
              <iframe
                src={url}
                title={title}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms"
                scrolling="yes"
                style={{
                  pointerEvents: isSelected ? 'none' : 'auto',
                  overflow: 'auto',
                }}
                onError={() => setLoadError(true)}
              />
            )}
          </div>
        )}
      </div>

      {isSelected && (
        <SelectionHandles
          width={width}
          height={isExpanded ? height : 80}
          onHandleMouseDown={startTransform}
          getCursor={getCursor}
        />
      )}
    </div>
  );
}
