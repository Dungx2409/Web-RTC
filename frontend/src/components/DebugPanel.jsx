import { useEffect, useState } from 'react';
import { config } from '../services/config';
import { webRTCService } from '../services/webrtc';

const DebugPanel = () => {
  const [iceServers, setIceServers] = useState(config.iceServers);
  const [meteredStatus, setMeteredStatus] = useState('');

  useEffect(() => {
    console.log('=== WebRTC Configuration ===');
    console.log('Signaling URL:', config.SIGNALING_URL);
    console.log('ICE Servers:', config.iceServers);
    console.log('P2P Timeout:', config.P2P_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!config.METERED_TURN_URL) {
        setMeteredStatus('Not configured (using static TURN)');
        setIceServers(config.iceServers);
        return;
      }
      setMeteredStatus('Fetching...');
      const servers = await webRTCService.ensureIceServersReady();
      setIceServers(servers);
      setMeteredStatus(servers !== config.iceServers ? '✅ Metered API' : '⚠️ Fallback');
    };
    load();
  }, []);

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-4 rounded-lg max-w-md overflow-auto max-h-96 z-50">
      <h3 className="font-bold mb-2">🔧 Debug Config</h3>
      <div className="space-y-1">
        <div>
          <strong>Signaling:</strong>
          <br />
          {config.SIGNALING_URL}
        </div>
        <div>
          <strong>ICE Servers:</strong>
          {config.METERED_TURN_URL && (
            <span className="ml-2 text-yellow-400">({meteredStatus})</span>
          )}
          {iceServers.map((server, i) => (
            <div key={i} className="ml-2 mt-1 text-gray-300">
              • {typeof server.urls === 'string' ? server.urls : server.urls?.[0]}
              {server.username && ` (${server.username})`}
            </div>
          ))}
        </div>
        <div>
          <strong>P2P Timeout:</strong> {config.P2P_TIMEOUT_MS}ms
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
