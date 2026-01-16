import { useState, useRef, useEffect } from 'react';
import { Point } from '../../types/whiteboard';

interface StickyNoteInputProps {
  position: Point;
  initialValue?: string;
  backgroundColor?: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

const STICKY_COLORS = [
  '#fef08a', // yellow
  '#fca5a5', // red
  '#86efac', // green
  '#93c5fd', // blue
  '#c4b5fd', // purple
  '#fdba74', // orange
];

export function StickyNoteInput({
  position,
  initialValue = '',
  backgroundColor = '#fef08a',
  onSubmit,
  onCancel,
}: StickyNoteInputProps) {
  const [value, setValue] = useState(initialValue);
  const [color, setColor] = useState(backgroundColor);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value);
    } else {
      onCancel();
    }
  };

  return (
    <div
      className="absolute shadow-lg rounded-sm"
      style={{
        left: position.x,
        top: position.y,
        width: '200px',
        backgroundColor: color,
      }}
    >
      <div className="flex gap-1 p-1 border-b border-black/10">
        {STICKY_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-5 h-5 rounded-full border-2 ${
              color === c ? 'border-gray-600' : 'border-transparent'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full h-32 p-2 bg-transparent border-none outline-none resize-none"
        placeholder="Skriv en anteckning..."
      />
      <div className="flex justify-end gap-2 p-2 border-t border-black/10">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-sm text-gray-600 hover:bg-black/10 rounded"
        >
          Avbryt
        </button>
        <button
          onClick={handleSubmit}
          className="px-3 py-1 text-sm bg-black/20 hover:bg-black/30 rounded"
        >
          Skapa
        </button>
      </div>
    </div>
  );
}
