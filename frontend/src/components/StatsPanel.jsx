import { X, Activity, Wifi, Clock, ArrowDown, ArrowUp } from 'lucide-react';
import { 
  getStatusColor, 
  getStatusText,
  formatBytes,
  formatBitrate
} from '../data/mockData';
import { useAppContext } from '../context/AppContext';

const StatsPanel = ({ isOpen, onClose }) => {
  const { getAggregatedStats, callDuration, connectionState, iceState } = useAppContext();
  
  if (!isOpen) return null;

  const stats = getAggregatedStats() || {
    callStart: '',
    duration: callDuration,
    iceState: iceState,
    connectionState: connectionState,
    candidateType: 'unknown',
    localCandidate: { type: 'unknown', protocol: 'unknown', address: '', port: '' },
    remoteCandidate: { type: 'unknown', protocol: 'unknown', address: '', port: '' },
    bytesReceived: 0,
    bytesSent: 0,
    packetsReceived: 0,
    packetsSent: 0,
    packetsLost: 0,
    jitter: 0,
    roundTripTime: 0,
    availableOutgoingBitrate: 0,
    availableIncomingBitrate: 0,
    videoResolution: { width: 0, height: 0, frameRate: 0 },
    audioCodec: 'unknown',
    videoCodec: 'unknown'
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-meet-darker border-l border-meet-gray/30 shadow-2xl z-40 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-meet-gray/30">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-meet-blue" />
          <h2 className="text-lg font-medium text-white">WebRTC Statistics</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-meet-gray/50 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-meet-light-gray" />
        </button>
      </div>

      {/* Stats Content */}
      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-80px)]">
        {/* Call Info */}
        <div className="bg-meet-gray/20 rounded-xl p-4">
          <h3 className="text-sm font-medium text-meet-light-gray mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Call Information
          </h3>
          <div className="space-y-2">
            <StatRow label="Call Start" value={stats.callStart || 'N/A'} />
            <StatRow label="Duration" value={stats.duration || callDuration} />
          </div>
        </div>

        {/* Connection State */}
        <div className="bg-meet-gray/20 rounded-xl p-4">
          <h3 className="text-sm font-medium text-meet-light-gray mb-3 flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            Connection State
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">ICE State</span>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${getStatusColor(stats.iceState)}`} />
                <span className="text-sm text-white">{getStatusText(stats.iceState)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Connection State</span>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${getStatusColor(stats.connectionState)}`} />
                <span className="text-sm text-white">{getStatusText(stats.connectionState)}</span>
              </div>
            </div>
            <StatRow 
              label="Candidate Type" 
              value={stats.candidateType.toUpperCase()}
              highlight={stats.candidateType === 'relay'}
            />
          </div>
        </div>

        {/* Candidates */}
        <div className="bg-meet-gray/20 rounded-xl p-4">
          <h3 className="text-sm font-medium text-meet-light-gray mb-3">
            ICE Candidates
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-meet-darker rounded-lg">
              <p className="text-xs text-meet-blue mb-1">Local Candidate</p>
              <p className="text-sm text-white font-mono">
                {stats.localCandidate.type} / {stats.localCandidate.protocol}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.localCandidate.address}:{stats.localCandidate.port}
              </p>
            </div>
            <div className="p-3 bg-meet-darker rounded-lg">
              <p className="text-xs text-meet-green mb-1">Remote Candidate</p>
              <p className="text-sm text-white font-mono">
                {stats.remoteCandidate.type} / {stats.remoteCandidate.protocol}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.remoteCandidate.address}:{stats.remoteCandidate.port}
              </p>
            </div>
          </div>
        </div>

        {/* Traffic Stats */}
        <div className="bg-meet-gray/20 rounded-xl p-4">
          <h3 className="text-sm font-medium text-meet-light-gray mb-3">
            Traffic Statistics
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-meet-darker rounded-lg">
              <div className="flex items-center gap-1 text-meet-green mb-1">
                <ArrowDown className="w-3 h-3" />
                <span className="text-xs">Received</span>
              </div>
              <p className="text-lg font-medium text-white">
                {formatBytes(stats.bytesReceived)}
              </p>
              <p className="text-xs text-gray-500">
                {stats.packetsReceived.toLocaleString()} packets
              </p>
            </div>
            <div className="p-3 bg-meet-darker rounded-lg">
              <div className="flex items-center gap-1 text-meet-blue mb-1">
                <ArrowUp className="w-3 h-3" />
                <span className="text-xs">Sent</span>
              </div>
              <p className="text-lg font-medium text-white">
                {formatBytes(stats.bytesSent)}
              </p>
              <p className="text-xs text-gray-500">
                {stats.packetsSent.toLocaleString()} packets
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <StatRow label="Packets Lost" value={stats.packetsLost} />
            <StatRow label="Jitter" value={`${(stats.jitter * 1000).toFixed(1)} ms`} />
            <StatRow label="Round Trip Time" value={`${stats.roundTripTime} ms`} />
          </div>
        </div>

        {/* Bitrate */}
        <div className="bg-meet-gray/20 rounded-xl p-4">
          <h3 className="text-sm font-medium text-meet-light-gray mb-3">
            Bitrate
          </h3>
          <div className="space-y-2">
            <StatRow 
              label="Outgoing" 
              value={formatBitrate(stats.availableOutgoingBitrate)} 
            />
            <StatRow 
              label="Incoming" 
              value={formatBitrate(stats.availableIncomingBitrate)} 
            />
          </div>
        </div>

        {/* Media Info */}
        <div className="bg-meet-gray/20 rounded-xl p-4">
          <h3 className="text-sm font-medium text-meet-light-gray mb-3">
            Media Information
          </h3>
          <div className="space-y-2">
            <StatRow 
              label="Video Resolution" 
              value={`${stats.videoResolution.width}x${stats.videoResolution.height}`} 
            />
            <StatRow 
              label="Frame Rate" 
              value={`${stats.videoResolution.frameRate} fps`} 
            />
            <StatRow label="Audio Codec" value={stats.audioCodec.toUpperCase()} />
            <StatRow label="Video Codec" value={stats.videoCodec} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for stat rows
const StatRow = ({ label, value, highlight = false }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-400">{label}</span>
    <span className={`text-sm font-medium ${highlight ? 'text-meet-yellow' : 'text-white'}`}>
      {value}
    </span>
  </div>
);

export default StatsPanel;
