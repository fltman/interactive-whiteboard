import { useWhiteboardStore } from '../../stores/whiteboard';

export function LayerPanel() {
  const {
    layers,
    activeLayerId,
    addLayer,
    deleteLayer,
    setActiveLayer,
    toggleLayerVisibility,
  } = useWhiteboardStore();

  const sortedLayers = [...layers].sort((a, b) => b.order - a.order);

  return (
    <div className="fixed right-4 top-4 w-56 bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
        <span className="text-sm font-medium text-gray-700">Lager</span>
        <button
          onClick={() => addLayer(`Lager ${layers.length + 1}`)}
          className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded"
          title="Lägg till lager"
        >
          +
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {sortedLayers.map((layer) => (
          <div
            key={layer.id}
            onClick={() => setActiveLayer(layer.id)}
            className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${
              activeLayerId === layer.id
                ? 'bg-blue-50 border-l-2 border-blue-500'
                : 'hover:bg-gray-50'
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLayerVisibility(layer.id);
              }}
              className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600"
              title={layer.visible ? 'Dölj lager' : 'Visa lager'}
            >
              {layer.visible ? '👁' : '👁‍🗨'}
            </button>
            <span className="flex-1 text-sm truncate">{layer.name}</span>
            {layers.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteLayer(layer.id);
                }}
                className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-500"
                title="Ta bort lager"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
