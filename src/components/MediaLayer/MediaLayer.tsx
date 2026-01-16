import { useWhiteboardStore } from '../../stores/whiteboard';
import { ImageElement } from './ImageElement';
import { YouTubeElement } from './YouTubeElement';
import { LinkElement } from './LinkElement';
import { StickyElement } from './StickyElement';
import { TextElement } from './TextElement';
import { DocumentElement, isDocumentUrl } from './DocumentElement';
import { WebElement } from './WebElement';
import { WhiteboardObject } from '../../types/whiteboard';

export function MediaLayer() {
  const { objects, layers, selectedObjectIds, selectObject, updateObject, saveToHistory, canvasOffset, zoom } = useWhiteboardStore();

  // Get visible layer IDs
  const visibleLayerIds = layers.filter((layer) => layer.visible).map((layer) => layer.id);

  // Filter objects that should be rendered as HTML elements AND are on visible layers
  const mediaObjects = objects.filter(
    (obj) =>
      (obj.type === 'image' || obj.type === 'sticky' || obj.type === 'text' || obj.type === 'web') &&
      visibleLayerIds.includes(obj.layerId)
  );

  const handleSelect = (id: string, addToSelection: boolean) => {
    selectObject(id, addToSelection);
  };

  const handleUpdate = (id: string, updates: Partial<WhiteboardObject>) => {
    updateObject(id, updates);
  };

  const handleTransformEnd = () => {
    saveToHistory();
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{
        transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
        transformOrigin: '0 0',
      }}
    >
      {mediaObjects.map((obj) => {
        const isSelected = selectedObjectIds.includes(obj.id);
        const commonProps = {
          key: obj.id,
          object: obj,
          isSelected,
          onSelect: handleSelect,
          onUpdate: handleUpdate,
          onTransformEnd: handleTransformEnd,
        };

        switch (obj.type) {
          case 'image':
            return <ImageElement {...commonProps} />;
          case 'text':
            return <TextElement {...commonProps} />;
          case 'web':
            return <WebElement {...commonProps} />;
          case 'sticky':
            // Check if it's a special type based on content
            const stickyData = obj.data as { content: string; backgroundColor: string };

            // Check for document prefix or document URL in link
            if (stickyData.content.startsWith('📄')) {
              return <DocumentElement {...commonProps} />;
            }

            // Check for link - might be a document URL
            if (stickyData.content.startsWith('🔗')) {
              const lines = stickyData.content.split('\n');
              const url = lines[1] || '';
              if (isDocumentUrl(url)) {
                return <DocumentElement {...commonProps} />;
              }
              return <LinkElement {...commonProps} />;
            }

            if (stickyData.content.startsWith('▶️ YouTube')) {
              return <YouTubeElement {...commonProps} />;
            }
            return <StickyElement {...commonProps} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
