import { HandleType } from './useMediaTransform';

interface SelectionHandlesProps {
  width: number;
  height: number;
  onHandleMouseDown: (e: React.MouseEvent, handle: HandleType) => void;
  getCursor: (handle: HandleType) => string;
}

export function SelectionHandles({
  width,
  height,
  onHandleMouseDown,
  getCursor,
}: SelectionHandlesProps) {
  const handleSize = 10;
  const halfHandle = handleSize / 2;

  const handles: { type: HandleType; x: number; y: number }[] = [
    { type: 'nw', x: -halfHandle, y: -halfHandle },
    { type: 'n', x: width / 2 - halfHandle, y: -halfHandle },
    { type: 'ne', x: width - halfHandle, y: -halfHandle },
    { type: 'w', x: -halfHandle, y: height / 2 - halfHandle },
    { type: 'e', x: width - halfHandle, y: height / 2 - halfHandle },
    { type: 'sw', x: -halfHandle, y: height - halfHandle },
    { type: 's', x: width / 2 - halfHandle, y: height - halfHandle },
    { type: 'se', x: width - halfHandle, y: height - halfHandle },
  ];

  return (
    <>
      {/* Selection border */}
      <div
        className="absolute inset-0 border-2 border-blue-500 pointer-events-none"
        style={{ margin: -2 }}
      />

      {/* Resize handles */}
      {handles.map((handle) => (
        <div
          key={handle.type}
          className="absolute w-[10px] h-[10px] bg-white border-2 border-blue-500 rounded-sm pointer-events-auto"
          style={{
            left: handle.x,
            top: handle.y,
            cursor: getCursor(handle.type),
          }}
          onMouseDown={(e) => onHandleMouseDown(e, handle.type)}
        />
      ))}

      {/* Rotate handle */}
      <div
        className="absolute pointer-events-auto"
        style={{
          left: width / 2 - 8,
          top: -30,
          width: 16,
          height: 16,
        }}
      >
        <div className="w-[1px] h-[14px] bg-blue-500 mx-auto" />
        <div
          className="w-4 h-4 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center cursor-grab text-[10px]"
          onMouseDown={(e) => onHandleMouseDown(e, 'rotate')}
        >
          ↻
        </div>
      </div>
    </>
  );
}
