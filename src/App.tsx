import { useState, useCallback } from 'react';
import { Canvas } from './components/Canvas/Canvas';
import { MediaLayer } from './components/MediaLayer/MediaLayer';
import { Toolbar } from './components/Toolbar/Toolbar';
import { LayerPanel } from './components/LayerPanel/LayerPanel';
import { PropertyPanel } from './components/PropertyPanel/PropertyPanel';
import { QRModal } from './components/QRModal/QRModal';
import { Inbox } from './components/Inbox/Inbox';
import { useKeyboard } from './hooks/useKeyboard';
import { usePeer } from './hooks/usePeer';
import { useWhiteboardStore } from './stores/whiteboard';
import { ReceivedItem } from './types/p2p';
import { TextData, StickyData, ImageData } from './types/whiteboard';

function App() {
  useKeyboard();
  const [showQRModal, setShowQRModal] = useState(false);
  const { peerId, connectedPeers, receivedItems, removeReceivedItem, clearReceivedItems } = usePeer();
  const { addObject, currentStyle, saveToHistory } = useWhiteboardStore();

  const handlePlaceItem = useCallback((item: ReceivedItem) => {
    // Place item in center of viewport
    const centerX = window.innerWidth / 2 - 100;
    const centerY = window.innerHeight / 2 - 50;

    switch (item.type) {
      case 'text':
        addObject({
          type: 'text',
          position: { x: centerX, y: centerY },
          style: currentStyle,
          locked: false,
          rotation: 0,
          data: {
            content: item.content,
            fontSize: 16,
            fontFamily: 'sans-serif',
          } as TextData,
        });
        break;

      case 'link':
        addObject({
          type: 'sticky',
          position: { x: centerX, y: centerY },
          size: { width: 250, height: 100 },
          style: currentStyle,
          locked: false,
          rotation: 0,
          data: {
            content: `🔗 ${item.title || 'Länk'}\n${item.content}`,
            backgroundColor: '#dbeafe',
          } as StickyData,
        });
        break;

      case 'image':
        // Create image and get dimensions
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
            position: { x: centerX - width / 2, y: centerY - height / 2 },
            size: { width, height },
            style: currentStyle,
            locked: false,
            rotation: 0,
            data: {
              src: item.content,
              originalSize: { width: img.width, height: img.height },
            } as ImageData,
          });
          saveToHistory();
        };
        img.src = item.content;
        break;

      case 'youtube':
        addObject({
          type: 'sticky',
          position: { x: centerX, y: centerY },
          size: { width: 320, height: 200 },
          style: currentStyle,
          locked: false,
          rotation: 0,
          data: {
            content: `▶️ YouTube\n${item.content}`,
            backgroundColor: '#fef3c7',
          } as StickyData,
        });
        break;

      case 'document':
        addObject({
          type: 'sticky',
          position: { x: centerX, y: centerY },
          size: { width: 600, height: 450 },
          style: currentStyle,
          locked: false,
          rotation: 0,
          data: {
            content: `📄 ${item.title || 'Dokument'}\n${item.content}`,
            backgroundColor: '#e0e7ff',
          } as StickyData,
        });
        break;
    }

    saveToHistory();
    removeReceivedItem(item.id);
  }, [addObject, currentStyle, saveToHistory, removeReceivedItem]);

  return (
    <div className="h-screen w-screen bg-gray-50 overflow-hidden">
      <div className="relative h-full w-full">
        <Canvas />
        <MediaLayer />
        <Toolbar onShowQR={() => setShowQRModal(true)} peerConnected={connectedPeers.length > 0} />
        <LayerPanel />
        <PropertyPanel />

        <Inbox
          items={receivedItems}
          onPlaceItem={handlePlaceItem}
          onRemoveItem={removeReceivedItem}
          onClearAll={clearReceivedItems}
        />

        {showQRModal && peerId && (
          <QRModal
            peerId={peerId}
            connectedPeers={connectedPeers}
            onClose={() => setShowQRModal(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
