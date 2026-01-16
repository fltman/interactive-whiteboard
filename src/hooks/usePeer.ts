import { useState, useEffect, useCallback, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { v4 as uuidv4 } from 'uuid';
import { ReceivedItem, PeerMessage, ConnectedPeer } from '../types/p2p';

interface UsePeerReturn {
  peerId: string | null;
  isReady: boolean;
  connectedPeers: ConnectedPeer[];
  receivedItems: ReceivedItem[];
  removeReceivedItem: (id: string) => void;
  clearReceivedItems: () => void;
}

export function usePeer(): UsePeerReturn {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [connectedPeers, setConnectedPeers] = useState<ConnectedPeer[]>([]);
  const [receivedItems, setReceivedItems] = useState<ReceivedItem[]>([]);
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());

  useEffect(() => {
    // Generate a short, readable peer ID
    const id = `wb-${uuidv4().slice(0, 8)}`;

    const peer = new Peer(id, {
      debug: 1,
    });

    peerRef.current = peer;

    peer.on('open', (openedId) => {
      console.log('Peer opened with ID:', openedId);
      setPeerId(openedId);
      setIsReady(true);
    });

    peer.on('connection', (conn) => {
      console.log('Incoming connection from:', conn.peer);

      conn.on('open', () => {
        console.log('Connection opened with:', conn.peer);
        connectionsRef.current.set(conn.peer, conn);
        setConnectedPeers((prev) => [
          ...prev,
          { id: conn.peer, connectedAt: Date.now() },
        ]);
      });

      conn.on('data', (data) => {
        console.log('Received data:', data);
        const message = data as PeerMessage;

        if (message.type === 'content') {
          const newItem: ReceivedItem = {
            id: uuidv4(),
            ...message.item,
            timestamp: Date.now(),
            fromPeerId: conn.peer,
          };
          setReceivedItems((prev) => [...prev, newItem]);
        }
      });

      conn.on('close', () => {
        console.log('Connection closed with:', conn.peer);
        connectionsRef.current.delete(conn.peer);
        setConnectedPeers((prev) => prev.filter((p) => p.id !== conn.peer));
      });

      conn.on('error', (err) => {
        console.error('Connection error:', err);
      });
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
    });

    return () => {
      connectionsRef.current.forEach((conn) => conn.close());
      peer.destroy();
    };
  }, []);

  const removeReceivedItem = useCallback((id: string) => {
    setReceivedItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearReceivedItems = useCallback(() => {
    setReceivedItems([]);
  }, []);

  return {
    peerId,
    isReady,
    connectedPeers,
    receivedItems,
    removeReceivedItem,
    clearReceivedItems,
  };
}
