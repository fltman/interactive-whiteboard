import { useWhiteboardStore } from '../../stores/whiteboard';
import { ToolType } from '../../types/whiteboard';

interface ToolbarProps {
  onShowQR: () => void;
  peerConnected: boolean;
}

const tools: { type: ToolType; label: string; icon: string }[] = [
  { type: 'select', label: 'Välj', icon: '⬚' },
  { type: 'pen', label: 'Penna', icon: '✏️' },
  { type: 'eraser', label: 'Sudd', icon: '🧹' },
  { type: 'rectangle', label: 'Rektangel', icon: '▢' },
  { type: 'ellipse', label: 'Ellips', icon: '○' },
  { type: 'line', label: 'Linje', icon: '/' },
  { type: 'arrow', label: 'Pil', icon: '→' },
  { type: 'text', label: 'Text', icon: 'T' },
  { type: 'sticky', label: 'Sticky', icon: '📝' },
  { type: 'image', label: 'Bild', icon: '🖼️' },
  { type: 'ai-image', label: 'AI-bild', icon: '✨' },
  { type: 'ai-web', label: 'AI-webb', icon: '</>' },
];

const colors = [
  '#000000',
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#ffff00',
  '#ff00ff',
  '#00ffff',
  '#ffffff',
];

const strokeWidths = [2, 4, 8, 16];

export function Toolbar({ onShowQR, peerConnected }: ToolbarProps) {
  const { activeTool, setActiveTool, currentStyle, setCurrentStyle, undo, redo } =
    useWhiteboardStore();

  return (
    <div className="fixed left-4 top-4 bottom-4 flex flex-col gap-2">
      {/* QR-knapp - alltid synlig överst */}
      <button
        onClick={onShowQR}
        className={`w-12 h-12 flex items-center justify-center rounded-xl shadow-lg transition-colors relative ${
          peerConnected
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-white hover:bg-gray-100'
        }`}
        title="Anslut enhet via QR-kod"
      >
        <span className="text-xl">📱</span>
        {peerConnected && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-300 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Scrollbar toolbar */}
      <div className="flex-1 bg-white rounded-xl shadow-lg p-2 flex flex-col gap-2 overflow-y-auto">
        <div className="flex flex-col gap-1">
          {tools.map((tool) => (
            <button
              key={tool.type}
              onClick={() => setActiveTool(tool.type)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                activeTool === tool.type
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-100'
              }`}
              title={tool.label}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        <hr className="border-gray-200" />

        <div className="flex flex-col gap-1">
          <div className="text-xs text-gray-500 px-1">Färg</div>
          <div className="grid grid-cols-2 gap-1">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setCurrentStyle({ strokeColor: color })}
                className={`w-4 h-4 rounded border ${
                  currentStyle.strokeColor === color
                    ? 'ring-2 ring-blue-500 ring-offset-1'
                    : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        <hr className="border-gray-200" />

        <div className="flex flex-col gap-1">
          <div className="text-xs text-gray-500 px-1">Storlek</div>
          <div className="flex flex-col gap-1">
            {strokeWidths.map((width) => (
              <button
                key={width}
                onClick={() => setCurrentStyle({ strokeWidth: width })}
                className={`h-6 flex items-center justify-center rounded ${
                  currentStyle.strokeWidth === width
                    ? 'bg-blue-100'
                    : 'hover:bg-gray-100'
                }`}
                title={`${width}px`}
              >
                <div
                  className="bg-black rounded-full"
                  style={{ width: width * 1.5, height: width * 1.5 }}
                />
              </button>
            ))}
          </div>
        </div>

        <hr className="border-gray-200" />

        <div className="flex gap-1">
          <button
            onClick={undo}
            className="flex-1 h-8 flex items-center justify-center rounded hover:bg-gray-100"
            title="Ångra (Ctrl+Z)"
          >
            ↩
          </button>
          <button
            onClick={redo}
            className="flex-1 h-8 flex items-center justify-center rounded hover:bg-gray-100"
            title="Gör om (Ctrl+Y)"
          >
            ↪
          </button>
        </div>
      </div>
    </div>
  );
}
