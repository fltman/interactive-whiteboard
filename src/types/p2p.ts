export type ReceivedItemType = 'text' | 'link' | 'image' | 'youtube' | 'document' | 'pdf';

export interface ReceivedItem {
  id: string;
  type: ReceivedItemType;
  content: string;
  thumbnail?: string;
  title?: string;
  timestamp: number;
  fromPeerId: string;
}

export interface PeerMessage {
  type: 'content';
  item: Omit<ReceivedItem, 'id' | 'timestamp' | 'fromPeerId'>;
}

export interface ConnectedPeer {
  id: string;
  connectedAt: number;
}
