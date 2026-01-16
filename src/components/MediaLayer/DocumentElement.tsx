import { useState } from 'react';
import { WhiteboardObject, StickyData } from '../../types/whiteboard';
import { useMediaTransform } from './useMediaTransform';
import { SelectionHandles } from './SelectionHandles';

interface DocumentElementProps {
  object: WhiteboardObject;
  isSelected: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onUpdate: (id: string, updates: Partial<WhiteboardObject>) => void;
  onTransformEnd: () => void;
}

type DocumentType = 'word' | 'excel' | 'powerpoint' | 'google-doc' | 'google-sheet' | 'google-slides' | 'pdf' | 'unknown';

interface DocumentInfo {
  type: DocumentType;
  embedUrl: string;
  icon: string;
  label: string;
  color: string;
}

function getDocumentInfo(url: string): DocumentInfo {
  // Convert relative URLs to absolute URLs using current origin
  const absoluteUrl = url.startsWith('/') ? `${window.location.origin}${url}` : url;
  const lowerUrl = absoluteUrl.toLowerCase();

  // Google Docs
  if (lowerUrl.includes('docs.google.com/document')) {
    const embedUrl = url.replace(/\/edit.*$/, '/preview').replace(/\/view.*$/, '/preview');
    return {
      type: 'google-doc',
      embedUrl,
      icon: '📄',
      label: 'Google Dokument',
      color: '#4285f4',
    };
  }

  // Google Sheets
  if (lowerUrl.includes('docs.google.com/spreadsheets')) {
    const embedUrl = url.replace(/\/edit.*$/, '/preview').replace(/\/view.*$/, '/preview');
    return {
      type: 'google-sheet',
      embedUrl,
      icon: '📊',
      label: 'Google Kalkylark',
      color: '#0f9d58',
    };
  }

  // Google Slides
  if (lowerUrl.includes('docs.google.com/presentation')) {
    const embedUrl = url.replace(/\/edit.*$/, '/embed').replace(/\/view.*$/, '/embed');
    return {
      type: 'google-slides',
      embedUrl,
      icon: '📽️',
      label: 'Google Presentationer',
      color: '#f4b400',
    };
  }

  // Microsoft Office files (via Google Docs Viewer - works better with ngrok)
  if (lowerUrl.match(/\.(docx?|rtf)(\?|$)/i)) {
    return {
      type: 'word',
      embedUrl: `https://docs.google.com/viewer?url=${encodeURIComponent(absoluteUrl)}&embedded=true`,
      icon: '📝',
      label: 'Word-dokument',
      color: '#2b579a',
    };
  }

  if (lowerUrl.match(/\.(xlsx?|csv)(\?|$)/i)) {
    return {
      type: 'excel',
      embedUrl: `https://docs.google.com/viewer?url=${encodeURIComponent(absoluteUrl)}&embedded=true`,
      icon: '📊',
      label: 'Excel-kalkylark',
      color: '#217346',
    };
  }

  if (lowerUrl.match(/\.(pptx?|pps)(\?|$)/i)) {
    return {
      type: 'powerpoint',
      embedUrl: `https://docs.google.com/viewer?url=${encodeURIComponent(absoluteUrl)}&embedded=true`,
      icon: '📽️',
      label: 'PowerPoint-presentation',
      color: '#d24726',
    };
  }

  // OneDrive/SharePoint links
  if (lowerUrl.includes('onedrive.live.com') || lowerUrl.includes('sharepoint.com')) {
    // Try to determine type from URL or default to document
    let icon = '📄';
    let label = 'Office-dokument';
    let color = '#0078d4';

    if (lowerUrl.includes('xlsx') || lowerUrl.includes('excel')) {
      icon = '📊';
      label = 'Excel-kalkylark';
      color = '#217346';
    } else if (lowerUrl.includes('pptx') || lowerUrl.includes('powerpoint')) {
      icon = '📽️';
      label = 'PowerPoint-presentation';
      color = '#d24726';
    } else if (lowerUrl.includes('docx') || lowerUrl.includes('word')) {
      icon = '📝';
      label = 'Word-dokument';
      color = '#2b579a';
    }

    return {
      type: 'word',
      embedUrl: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteUrl)}`,
      icon,
      label,
      color,
    };
  }

  // PDF files
  if (lowerUrl.match(/\.pdf(\?|$)/i)) {
    return {
      type: 'pdf',
      embedUrl: absoluteUrl,
      icon: '📕',
      label: 'PDF-dokument',
      color: '#f40f02',
    };
  }

  // Unknown document type
  return {
    type: 'unknown',
    embedUrl: absoluteUrl,
    icon: '📄',
    label: 'Dokument',
    color: '#666666',
  };
}

export function isDocumentUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.includes('docs.google.com') ||
    lowerUrl.match(/\.(docx?|xlsx?|pptx?|pdf|rtf|csv|pps)(\?|$)/i) !== null ||
    lowerUrl.includes('onedrive.live.com') ||
    lowerUrl.includes('sharepoint.com')
  );
}

export function DocumentElement({
  object,
  isSelected,
  onSelect,
  onUpdate,
  onTransformEnd,
}: DocumentElementProps) {
  const { startTransform, getCursor } = useMediaTransform(object, onUpdate, onTransformEnd);
  const [isExpanded, setIsExpanded] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const data = object.data as StickyData;
  const width = object.size?.width || 600;
  const height = object.size?.height || 450;

  // Extract URL from content (format: "📄 Document\nURL")
  const lines = data.content.split('\n');
  const url = lines[1] || lines[0] || '';
  const docInfo = getDocumentInfo(url);

  // Check if we're on ngrok (external embeds won't work due to interstitial)
  const isNgrok = window.location.hostname.includes('ngrok');
  const canEmbed = !isNgrok || docInfo.type === 'pdf' || docInfo.type.startsWith('google');

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
    onUpdate(object.id, {
      size: { width, height: isExpanded ? 60 : 450 },
    });
  };

  const handleOpenExternal = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        left: object.position.x,
        top: object.position.y,
        width,
        height: isExpanded ? height : 60,
        transform: `rotate(${object.rotation || 0}deg)`,
        transformOrigin: 'center center',
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      <div className="w-full h-full rounded-lg shadow-lg overflow-hidden flex flex-col bg-white border">
        {/* Header */}
        <div
          className="flex items-center gap-2 px-3 py-2 border-b"
          style={{ backgroundColor: docInfo.color + '15' }}
        >
          <span className="text-xl">{docInfo.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-800 truncate text-sm">
              {docInfo.label}
            </div>
            <div className="text-xs text-gray-500 truncate">{url}</div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleToggleExpand}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-black/10 text-sm"
              title={isExpanded ? 'Minimera' : 'Expandera'}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
            <button
              onClick={handleOpenExternal}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-black/10 text-sm"
              title="Öppna i ny flik"
            >
              ↗
            </button>
          </div>
        </div>

        {/* Document preview */}
        {isExpanded && (
          <div className="flex-1 relative bg-gray-50">
            {loadError || !canEmbed ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                <span className="text-4xl mb-2">{docInfo.icon}</span>
                <p className="text-sm">
                  {!canEmbed
                    ? 'Förhandsgranskning ej tillgänglig via ngrok'
                    : 'Dokumentet kunde inte laddas'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {!canEmbed
                    ? 'Office-dokument kan inte bäddas in via ngrok'
                    : 'Kontrollera att filen är publikt tillgänglig'}
                </p>
                <div className="flex gap-2 mt-3">
                  <a
                    href={url}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                  >
                    Ladda ner
                  </a>
                  <button
                    onClick={handleOpenExternal}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    Öppna i ny flik
                  </button>
                </div>
              </div>
            ) : (
              <iframe
                src={docInfo.embedUrl}
                title={docInfo.label}
                className="w-full h-full border-0"
                style={{
                  pointerEvents: isSelected ? 'none' : 'auto',
                }}
                onError={() => setLoadError(true)}
                allow="fullscreen"
              />
            )}
          </div>
        )}
      </div>

      {isSelected && (
        <SelectionHandles
          width={width}
          height={isExpanded ? height : 60}
          onHandleMouseDown={startTransform}
          getCursor={getCursor}
        />
      )}
    </div>
  );
}
