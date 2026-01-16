import { useState } from 'react';
import { WhiteboardObject, StickyData } from '../../types/whiteboard';
import { useMediaTransform } from './useMediaTransform';
import { SelectionHandles } from './SelectionHandles';

interface YouTubeElementProps {
  object: WhiteboardObject;
  isSelected: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onUpdate: (id: string, updates: Partial<WhiteboardObject>) => void;
  onTransformEnd: () => void;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function YouTubeElement({
  object,
  isSelected,
  onSelect,
  onUpdate,
  onTransformEnd,
}: YouTubeElementProps) {
  const { startTransform, getCursor } = useMediaTransform(object, onUpdate, onTransformEnd);
  const [isPlaying, setIsPlaying] = useState(false);

  const data = object.data as StickyData;
  const width = object.size?.width || 560;
  const height = object.size?.height || 315;

  // Extract YouTube URL from content (format: "▶️ YouTube\nURL")
  const lines = data.content.split('\n');
  const url = lines[1] || '';
  const videoId = extractYouTubeId(url);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(object.id, e.shiftKey);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && isSelected && !isPlaying) {
      startTransform(e, 'move');
    }
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // First select the element, then play on second click
    if (!isSelected) {
      onSelect(object.id, e.shiftKey);
      return;
    }
    setIsPlaying(true);
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
      {isPlaying && videoId ? (
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="rounded-lg shadow-lg"
          style={{ pointerEvents: isSelected ? 'none' : 'auto' }}
        />
      ) : (
        <div
          className="w-full h-full bg-gray-900 rounded-lg shadow-lg flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden"
          onClick={handlePlayClick}
        >
          {/* Thumbnail */}
          {videoId && (
            <img
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt="YouTube thumbnail"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                // Fallback to default thumbnail
                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
              }}
            />
          )}

          {/* Play button overlay */}
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <div className="w-0 h-0 border-l-[24px] border-l-white border-t-[14px] border-t-transparent border-b-[14px] border-b-transparent ml-1" />
            </div>
          </div>

          {/* YouTube logo */}
          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            YouTube
          </div>
        </div>
      )}

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
