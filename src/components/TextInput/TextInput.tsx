import { useState, useRef, useEffect } from 'react';
import { Point } from '../../types/whiteboard';

interface TextInputProps {
  position: Point;
  initialValue?: string;
  fontSize?: number;
  color?: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

export function TextInput({
  position,
  initialValue = '',
  fontSize = 16,
  color = '#000000',
  onSubmit,
  onCancel,
}: TextInputProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSubmit(value);
      } else {
        onCancel();
      }
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleBlur = () => {
    if (value.trim()) {
      onSubmit(value);
    } else {
      onCancel();
    }
  };

  return (
    <textarea
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className="absolute bg-transparent border-none outline-none resize-none overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        fontSize: `${fontSize}px`,
        color,
        minWidth: '100px',
        minHeight: '1.5em',
        fontFamily: 'sans-serif',
      }}
      placeholder="Skriv text..."
    />
  );
}
