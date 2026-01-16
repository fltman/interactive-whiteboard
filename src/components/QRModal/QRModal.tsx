import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ConnectedPeer } from '../../types/p2p';

interface QRModalProps {
  peerId: string;
  connectedPeers: ConnectedPeer[];
  onClose: () => void;
}

export function QRModal({ peerId, connectedPeers, onClose }: QRModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [customIp, setCustomIp] = useState<string>('');

  // Check if running on localhost
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // Generate the URL that the mobile device will open
  const baseUrl = customIp
    ? `http://${customIp}:${window.location.port}`
    : window.location.origin;
  const senderUrl = `${baseUrl}/sender.html?peer=${peerId}`;

  useEffect(() => {
    // Only generate QR if we have a valid URL (not localhost without custom IP)
    if (isLocalhost && !customIp) {
      setQrDataUrl('');
      return;
    }

    QRCode.toDataURL(senderUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [senderUrl, isLocalhost, customIp]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Anslut enhet</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full"
          >
            ×
          </button>
        </div>

        {isLocalhost && !customIp ? (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm">
                <strong>Localhost fungerar inte för mobiler.</strong>
              </p>
              <p className="text-amber-700 text-xs mt-1">
                Ange din dators lokala IP-adress för att mobilen ska kunna ansluta.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Din lokala IP-adress
              </label>
              <input
                type="text"
                placeholder="t.ex. 192.168.1.100"
                value={customIp}
                onChange={(e) => setCustomIp(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Hitta din IP: <code className="bg-gray-100 px-1 rounded">ifconfig | grep "inet "</code>
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Tips:</strong> Se till att mobilen är på samma WiFi-nätverk som datorn.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR-kod för att ansluta"
                className="w-64 h-64 border rounded-lg"
              />
            ) : (
              <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">Laddar QR-kod...</span>
              </div>
            )}

            <p className="text-center text-gray-600 mt-4 text-sm">
              Skanna QR-koden med din mobil för att skicka innehåll till whiteboarden
            </p>

            <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-500 break-all max-w-full">
              {senderUrl}
            </div>

            {isLocalhost && customIp && (
              <button
                onClick={() => setCustomIp('')}
                className="mt-2 text-xs text-blue-500 hover:underline"
              >
                Ändra IP-adress
              </button>
            )}
          </div>
        )}

        {connectedPeers.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Anslutna enheter ({connectedPeers.length})
            </h3>
            <div className="space-y-1">
              {connectedPeers.map((peer) => (
                <div
                  key={peer.id}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>{peer.id}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
