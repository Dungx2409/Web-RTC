import { useEffect, useState, useRef } from 'react';
import { config } from '../services/config';
import { webRTCService } from '../services/webrtc';
import { useAppContext } from '../context/AppContext';

const DebugPanel = () => {
  const { serverLogs } = useAppContext();
  const [iceServers, setIceServers] = useState(config.iceServers);
  const [meteredStatus, setMeteredStatus] = useState('');
  const logsEndRef = useRef(null);

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

  // Auto-scroll to bottom of logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serverLogs]);

  return (
    <div className="fixed bottom-4 left-4 bg-black/85 text-white text-xs p-4 rounded-lg max-w-lg w-[400px] flex flex-col max-h-[60vh] z-50 shadow-2xl border border-gray-700">
      <h3 className="font-bold mb-3 flex items-center justify-between">
        <span>🔧 Debug Panel</span>
      </h3>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {/* Config Section */}
        <div className="space-y-1 pb-3 border-b border-gray-700">
          <div>
            <strong className="text-meet-blue">Signaling:</strong>
            <br />
            {config.SIGNALING_URL}
          </div>
          <div>
            <strong className="text-meet-blue">ICE Servers:</strong>
            {config.METERED_TURN_URL && (
              <span className="ml-2 text-yellow-400">({meteredStatus})</span>
            )}
            {iceServers.map((server, i) => (
              <div key={i} className="ml-2 mt-1 text-gray-400">
                • {typeof server.urls === 'string' ? server.urls : server.urls?.[0]}
                {server.username && ` (${server.username})`}
              </div>
            ))}
          </div>
        </div>

        {/* Server Logs Section */}
        <div className="flex flex-col h-48">
          <strong className="text-meet-blue mb-2 sticky top-0 bg-black/85 py-1">Backend Server Logs:</strong>
          <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[10px] bg-black p-2 rounded border border-gray-800">
            {serverLogs && serverLogs.length > 0 ? (
              serverLogs.map((log, i) => {
                const time = new Date(log.timestamp).toLocaleTimeString([], { hour12: false });
                let colorClass = 'text-gray-300';
                if (log.level === 'error') colorClass = 'text-red-400';
                if (log.level === 'warn') colorClass = 'text-yellow-400';
                
                return (
                  <div key={i} className={`break-words ${colorClass}`}>
                    <span className="text-gray-600 mr-2">[{time}]</span>
                    {log.message}
                  </div>
                );
              })
            ) : (
              <div className="text-gray-500 italic">No logs received yet...</div>
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
