import { useWhiteboardStore } from '../../stores/whiteboard';

export function PropertyPanel() {
  const { objects, selectedObjectIds, updateObject, deleteObject, setCurrentStyle } =
    useWhiteboardStore();

  const selectedObjects = objects.filter((obj) => selectedObjectIds.includes(obj.id));

  if (selectedObjects.length === 0) {
    return null;
  }

  const selectedObject = selectedObjects[0];

  const handleColorChange = (color: string) => {
    selectedObjects.forEach((obj) => {
      updateObject(obj.id, {
        style: { ...obj.style, strokeColor: color },
      });
    });
    setCurrentStyle({ strokeColor: color });
  };

  const handleFillChange = (color: string) => {
    selectedObjects.forEach((obj) => {
      updateObject(obj.id, {
        style: { ...obj.style, fillColor: color },
      });
    });
    setCurrentStyle({ fillColor: color });
  };

  const handleStrokeWidthChange = (width: number) => {
    selectedObjects.forEach((obj) => {
      updateObject(obj.id, {
        style: { ...obj.style, strokeWidth: width },
      });
    });
    setCurrentStyle({ strokeWidth: width });
  };

  const handleOpacityChange = (opacity: number) => {
    selectedObjects.forEach((obj) => {
      updateObject(obj.id, {
        style: { ...obj.style, opacity },
      });
    });
  };

  const handleDelete = () => {
    selectedObjects.forEach((obj) => {
      deleteObject(obj.id);
    });
  };

  return (
    <div className="fixed right-4 bottom-4 w-56 bg-white rounded-xl shadow-lg p-3">
      <div className="text-sm font-medium text-gray-700 mb-3">
        {selectedObjects.length === 1
          ? `${selectedObject.type}`
          : `${selectedObjects.length} objekt valda`}
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Linjefärg</label>
          <input
            type="color"
            value={selectedObject.style.strokeColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-full h-8 rounded cursor-pointer"
          />
        </div>

        {selectedObject.type === 'shape' && (
          <div>
            <label className="text-xs text-gray-500 block mb-1">Fyllnadsfärg</label>
            <div className="flex gap-1">
              <button
                onClick={() => handleFillChange('transparent')}
                className={`flex-1 h-8 border rounded text-xs ${
                  selectedObject.style.fillColor === 'transparent'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                }`}
              >
                Ingen
              </button>
              <input
                type="color"
                value={
                  selectedObject.style.fillColor === 'transparent'
                    ? '#ffffff'
                    : selectedObject.style.fillColor
                }
                onChange={(e) => handleFillChange(e.target.value)}
                className="w-12 h-8 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-xs text-gray-500 block mb-1">
            Linjetjocklek: {selectedObject.style.strokeWidth}px
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={selectedObject.style.strokeWidth}
            onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">
            Opacitet: {Math.round(selectedObject.style.opacity * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={selectedObject.style.opacity * 100}
            onChange={(e) => handleOpacityChange(Number(e.target.value) / 100)}
            className="w-full"
          />
        </div>

        <button
          onClick={handleDelete}
          className="w-full py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm"
        >
          Ta bort
        </button>
      </div>
    </div>
  );
}
