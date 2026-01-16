import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { WhiteboardObject, TextData } from '../../types/whiteboard';
import { useMediaTransform } from './useMediaTransform';
import { SelectionHandles } from './SelectionHandles';

interface TextElementProps {
  object: WhiteboardObject;
  isSelected: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onUpdate: (id: string, updates: Partial<WhiteboardObject>) => void;
  onTransformEnd: () => void;
}

export function TextElement({
  object,
  isSelected,
  onSelect,
  onUpdate,
  onTransformEnd,
}: TextElementProps) {
  const { startTransform, getCursor } = useMediaTransform(object, onUpdate, onTransformEnd);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const data = object.data as TextData;
  const width = object.size?.width || 300;
  const height = object.size?.height || 100;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Place cursor at end
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(object.id, e.shiftKey);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && isSelected && !isEditing) {
      startTransform(e, 'move');
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onTransformEnd();
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(object.id, {
      data: { ...data, content: e.target.value },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
    // Allow Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        const newValue = value.substring(0, start) + '  ' + value.substring(end);
        onUpdate(object.id, {
          data: { ...data, content: newValue },
        });
        // Set cursor position after the inserted spaces
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
    }
  };

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        left: object.position.x,
        top: object.position.y,
        width,
        minHeight: height,
        transform: `rotate(${object.rotation || 0}deg)`,
        transformOrigin: 'center center',
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="w-full h-full bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-4"
        style={{
          color: object.style.strokeColor || '#000',
          fontSize: data.fontSize || 16,
          fontFamily: data.fontFamily || 'system-ui, sans-serif',
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={data.content}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full h-full min-h-[80px] bg-transparent resize-none outline-none font-mono text-sm"
            placeholder="Skriv text här... (Markdown stöds)"
          />
        ) : (
          <div className="prose prose-sm max-w-none overflow-auto">
            <ReactMarkdown
              components={{
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const inline = !match && !className;
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-md text-sm"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code
                      className="bg-gray-100 px-1 py-0.5 rounded text-red-600 text-sm"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>;
                },
                h1({ children }) {
                  return <h1 className="text-2xl font-bold mb-2">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="text-xl font-bold mb-2">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="text-lg font-bold mb-2">{children}</h3>;
                },
                ul({ children }) {
                  return <ul className="list-disc list-inside mb-2">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal list-inside mb-2">{children}</ol>;
                },
                li({ children }) {
                  return <li className="mb-1">{children}</li>;
                },
                a({ href, children }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {children}
                    </a>
                  );
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600">
                      {children}
                    </blockquote>
                  );
                },
              }}
            >
              {data.content || '*Dubbelklicka för att redigera...*'}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {isSelected && !isEditing && (
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
