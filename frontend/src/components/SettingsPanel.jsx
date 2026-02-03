import { X, Server, Shield, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { config } from '../services/config';
import { useAppContext } from '../context/AppContext';

const SettingsPanel = ({ isOpen, onClose }) => {
  const { webRTCService, notification, setNotification } = useAppContext();
  
  const [turnConfig, setTurnConfig] = useState({
    stunUrl: '',
    turnUdpUrl: '',
    turnTcpUrl: '',
    turnTlsUrl: '',
    username: '',
    credential: '',
    iceTransportPolicy: 'all'
  });
  
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  // Load current config
  useEffect(() => {
    const iceServers = config.iceServers;
    const stunServer = iceServers.find(s => s.urls?.includes('stun:'));
    const turnUdpServer = iceServers.find(s => s.urls?.includes('transport=udp'));
    const turnTcpServer = iceServers.find(s => s.urls?.includes('transport=tcp') && !s.urls?.includes('turns:'));
    const turnTlsServer = iceServers.find(s => s.urls?.includes('turns:'));
    
    setTurnConfig({
      stunUrl: stunServer?.urls || 'stun:stun.l.google.com:19302',
      turnUdpUrl: turnUdpServer?.urls || '',
      turnTcpUrl: turnTcpServer?.urls || '',
      turnTlsUrl: turnTlsServer?.urls || '',
      username: turnUdpServer?.username || '',
      credential: turnUdpServer?.credential || '',
      iceTransportPolicy: 'all'
    });
  }, []);

  // Test ICE connection
  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: turnConfig.stunUrl },
          { 
            urls: turnConfig.turnUdpUrl, 
            username: turnConfig.username, 
            credential: turnConfig.credential 
          }
        ]
      });
      
      const candidates = [];
      
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          candidates.push(event.candidate);
        }
      };
      
      // Create data channel to trigger ICE gathering
      pc.createDataChannel('test');
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Wait for ICE gathering
      await new Promise((resolve) => {
        if (pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === 'complete') {
              resolve();
            }
          };
          // Timeout after 5 seconds
          setTimeout(resolve, 5000);
        }
      });
      
      pc.close();
      
      const hasHost = candidates.some(c => c.candidate.includes('host'));
      const hasSrflx = candidates.some(c => c.candidate.includes('srflx'));
      const hasRelay = candidates.some(c => c.candidate.includes('relay'));
      
      setTestResult({
        success: true,
        host: hasHost,
        srflx: hasSrflx,
        relay: hasRelay,
        totalCandidates: candidates.length
      });
      
    } catch (error) {
      console.error('ICE test failed:', error);
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-meet-darker border-l border-meet-gray/30 shadow-2xl z-40 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-meet-gray/30">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-meet-blue" />
          <h2 className="text-lg font-medium text-white">ICE/TURN Settings</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-meet-gray/50 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-meet-light-gray" />
        </button>
      </div>

      {/* Settings Content */}
      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-80px)]">
        {/* Info Banner */}
        <div className="bg-meet-blue/10 border border-meet-blue/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-meet-blue flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-meet-blue font-medium">
                TURN Server Configuration
              </p>
              <p className="text-xs text-meet-light-gray mt-1">
                Configure your TURN server settings for fallback when P2P connections fail.
              </p>
            </div>
          </div>
        </div>

        {/* STUN Server URL */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            STUN Server URL
          </label>
          <input
            type="text"
            value={turnConfig.stunUrl}
            onChange={(e) => setTurnConfig({ ...turnConfig, stunUrl: e.target.value })}
            className="w-full px-4 py-3 bg-meet-dark border border-meet-gray rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-meet-blue/50 focus:border-meet-blue font-mono text-sm"
            placeholder="stun:stun.l.google.com:19302"
          />
        </div>

        {/* TURN Server URL (UDP) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            TURN Server (UDP)
          </label>
          <input
            type="text"
            value={turnConfig.turnUdpUrl}
            onChange={(e) => setTurnConfig({ ...turnConfig, turnUdpUrl: e.target.value })}
            className="w-full px-4 py-3 bg-meet-dark border border-meet-gray rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-meet-blue/50 focus:border-meet-blue font-mono text-sm"
            placeholder="turn:server.com:3478?transport=udp"
          />
        </div>

        {/* TURN Server URL (TCP) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            TURN Server (TCP)
          </label>
          <input
            type="text"
            value={turnConfig.turnTcpUrl}
            onChange={(e) => setTurnConfig({ ...turnConfig, turnTcpUrl: e.target.value })}
            className="w-full px-4 py-3 bg-meet-dark border border-meet-gray rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-meet-blue/50 focus:border-meet-blue font-mono text-sm"
            placeholder="turn:server.com:3478?transport=tcp"
          />
        </div>

        {/* TURN Server URL (TLS) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            TURN Server (TLS)
          </label>
          <input
            type="text"
            value={turnConfig.turnTlsUrl}
            onChange={(e) => setTurnConfig({ ...turnConfig, turnTlsUrl: e.target.value })}
            className="w-full px-4 py-3 bg-meet-dark border border-meet-gray rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-meet-blue/50 focus:border-meet-blue font-mono text-sm"
            placeholder="turns:server.com:5349?transport=tcp"
          />
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Username
          </label>
          <input
            type="text"
            value={turnConfig.username}
            onChange={(e) => setTurnConfig({ ...turnConfig, username: e.target.value })}
            className="w-full px-4 py-3 bg-meet-dark border border-meet-gray rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-meet-blue/50 focus:border-meet-blue text-sm"
            placeholder="username"
          />
        </div>

        {/* Credential */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Credential
          </label>
          <input
            type="password"
            value={turnConfig.credential}
            onChange={(e) => setTurnConfig({ ...turnConfig, credential: e.target.value })}
            className="w-full px-4 py-3 bg-meet-dark border border-meet-gray rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-meet-blue/50 focus:border-meet-blue text-sm"
            placeholder="••••••••"
          />
        </div>

        {/* ICE Transport Policy */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            ICE Transport Policy
          </label>
          <select
            value={turnConfig.iceTransportPolicy}
            onChange={(e) => setTurnConfig({ ...turnConfig, iceTransportPolicy: e.target.value })}
            className="w-full px-4 py-3 bg-meet-dark border border-meet-gray rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-meet-blue/50 focus:border-meet-blue text-sm"
          >
            <option value="all">All (P2P + TURN)</option>
            <option value="relay">Relay Only (TURN)</option>
          </select>
          <p className="text-xs text-gray-500 mt-2">
            "Relay Only" forces all traffic through TURN server
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-meet-gray/30 my-4" />

        {/* Test Result */}
        {testResult && (
          <div className={`rounded-xl p-4 ${testResult.success ? 'bg-meet-green/10 border border-meet-green/30' : 'bg-meet-red/10 border border-meet-red/30'}`}>
            <div className="flex items-center gap-2 mb-2">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-meet-green" />
              ) : (
                <XCircle className="w-5 h-5 text-meet-red" />
              )}
              <span className={`font-medium ${testResult.success ? 'text-meet-green' : 'text-meet-red'}`}>
                {testResult.success ? 'Connection Test Passed' : 'Connection Test Failed'}
              </span>
            </div>
            {testResult.success ? (
              <div className="text-sm text-gray-300 space-y-1">
                <p>Total candidates: {testResult.totalCandidates}</p>
                <p>Host: {testResult.host ? '✅' : '❌'} | SRFLX: {testResult.srflx ? '✅' : '❌'} | Relay: {testResult.relay ? '✅' : '❌'}</p>
              </div>
            ) : (
              <p className="text-sm text-meet-red">{testResult.error}</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button 
            onClick={testConnection}
            disabled={isTesting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-meet-gray hover:bg-meet-gray/80 text-white font-medium rounded-xl transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-meet-blue text-meet-dark font-medium rounded-xl hover:bg-meet-blue-hover transition-all"
          >
            Close
          </button>
        </div>

        {/* Note */}
        <p className="text-xs text-gray-500 text-center">
          Configure TURN server in environment variables (.env) for persistence.
        </p>
      </div>
    </div>
  );
};

export default SettingsPanel;
