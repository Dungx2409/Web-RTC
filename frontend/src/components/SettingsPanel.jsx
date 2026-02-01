import { X, Server, Shield, RefreshCw } from 'lucide-react';
import { useState } from 'react';

const SettingsPanel = ({ isOpen, onClose }) => {
  const [turnConfig, setTurnConfig] = useState({
    urls: 'turn:turn.example.com:3478',
    username: 'webrtc-user',
    credential: '********',
    iceTransportPolicy: 'all'
  });

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

        {/* TURN Server URL */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            TURN Server URL
          </label>
          <input
            type="text"
            value={turnConfig.urls}
            onChange={(e) => setTurnConfig({ ...turnConfig, urls: e.target.value })}
            className="w-full px-4 py-3 bg-meet-dark border border-meet-gray rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-meet-blue/50 focus:border-meet-blue font-mono text-sm"
            placeholder="turn:server.com:3478"
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

        {/* ICE Servers Info */}
        <div className="bg-meet-gray/20 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white mb-3">
            Configured ICE Servers
          </h3>
          <div className="space-y-2">
            <div className="p-3 bg-meet-darker rounded-lg">
              <p className="text-xs text-meet-green mb-1">STUN Server</p>
              <p className="text-sm text-white font-mono">stun:stun.l.google.com:19302</p>
            </div>
            <div className="p-3 bg-meet-darker rounded-lg">
              <p className="text-xs text-meet-blue mb-1">TURN Server (UDP)</p>
              <p className="text-sm text-white font-mono">{turnConfig.urls}</p>
            </div>
            <div className="p-3 bg-meet-darker rounded-lg">
              <p className="text-xs text-meet-yellow mb-1">TURN Server (TCP)</p>
              <p className="text-sm text-white font-mono">turn:turn.example.com:443?transport=tcp</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-meet-gray hover:bg-meet-gray/80 text-white font-medium rounded-xl transition-all">
            <RefreshCw className="w-4 h-4" />
            Test Connection
          </button>
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-meet-blue text-meet-dark font-medium rounded-xl hover:bg-meet-blue-hover transition-all"
          >
            Save Settings
          </button>
        </div>

        {/* Note */}
        <p className="text-xs text-gray-500 text-center">
          Note: This is a UI demo. Settings are not persisted.
        </p>
      </div>
    </div>
  );
};

export default SettingsPanel;
