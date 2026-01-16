import { useState } from 'react';
import { ReceivedItem } from '../../types/p2p';

interface InboxProps {
  items: ReceivedItem[];
  onPlaceItem: (item: ReceivedItem) => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
}

export function Inbox({ items, onPlaceItem, onRemoveItem, onClearAll }: InboxProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (items.length === 0) {
    return null;
  }

  const getItemIcon = (type: ReceivedItem['type']) => {
    switch (type) {
      case 'text':
        return 'T';
      case 'link':
        return '🔗';
      case 'image':
        return '🖼️';
      case 'youtube':
        return '▶️';
      default:
        return '?';
    }
  };

  const getItemPreview = (item: ReceivedItem) => {
    switch (item.type) {
      case 'text':
        return item.content.slice(0, 50) + (item.content.length > 50 ? '...' : '');
      case 'link':
        return item.title || item.content;
      case 'image':
        return 'Bild';
      case 'youtube':
        return item.title || 'YouTube-video';
      default:
        return item.content;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-72 bg-white rounded-xl shadow-lg overflow-hidden z-40">
      <div
        className="flex items-center justify-between px-3 py-2 bg-blue-500 text-white cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📥</span>
          <span className="font-medium">Inkorg</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
            {items.length}
          </span>
        </div>
        <button className="text-lg">{isExpanded ? '▼' : '▲'}</button>
      </div>

      {isExpanded && (
        <>
          <div className="max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2 p-3 border-b hover:bg-gray-50 group"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded text-sm">
                  {getItemIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {getItemPreview(item)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(item.timestamp).toLocaleTimeString('sv-SE')}
                  </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onPlaceItem(item)}
                    className="w-7 h-7 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                    title="Placera på whiteboard"
                  >
                    +
                  </button>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="w-7 h-7 flex items-center justify-center bg-gray-200 text-gray-600 rounded hover:bg-gray-300 text-xs"
                    title="Ta bort"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          {items.length > 1 && (
            <div className="p-2 border-t">
              <button
                onClick={onClearAll}
                className="w-full py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                Rensa alla
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
