import { useRef } from 'react';
import { useWhiteboardStore } from '../../stores/whiteboard';
import { ImageData } from '../../types/whiteboard';

interface ImageUploadProps {
  position: { x: number; y: number };
  onComplete: () => void;
}

export function ImageUpload({ position, onComplete }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { addObject, currentStyle, saveToHistory } = useWhiteboardStore();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      onComplete();
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 400;
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }

        addObject({
          type: 'image',
          position,
          size: { width, height },
          style: currentStyle,
          locked: false,
          rotation: 0,
          data: {
            src: event.target?.result as string,
            originalSize: { width: img.width, height: img.height },
          } as ImageData,
        });

        saveToHistory();
        onComplete();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      onChange={handleFileSelect}
      className="hidden"
      autoFocus
    />
  );
}

export function useImageUpload() {
  const triggerUpload = (callback: (file: File) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) callback(file);
    };
    input.click();
  };

  return { triggerUpload };
}
