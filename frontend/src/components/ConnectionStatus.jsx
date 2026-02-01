import { getStatusColor, getStatusText } from '../data/mockData';

const ConnectionStatus = ({ connectionState, iceState, showTurnFallback = false }) => {
  return (
    <div className="flex items-center gap-3">
      {/* Main connection status */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-meet-gray/30 rounded-full">
        <span 
          className={`w-2.5 h-2.5 rounded-full ${getStatusColor(connectionState)} ${
            connectionState === 'connecting' ? 'animate-pulse-slow' : ''
          }`}
        />
        <span className="text-sm text-white font-medium">
          {getStatusText(connectionState)}
        </span>
      </div>

      {/* ICE state (if different from connection state) */}
      {iceState && iceState !== connectionState && (
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-meet-gray/20 rounded-full">
          <span className="text-xs text-meet-light-gray">ICE:</span>
          <span 
            className={`w-2 h-2 rounded-full ${getStatusColor(iceState)}`}
          />
          <span className="text-xs text-meet-light-gray">
            {getStatusText(iceState)}
          </span>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
