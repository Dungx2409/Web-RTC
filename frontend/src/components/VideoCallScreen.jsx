import { useAppContext } from '../context/AppContext';
import VideoGrid from './VideoGrid';
import ControlBar from './ControlBar';
import ConnectionStatus from './ConnectionStatus';
import StatsPanel from './StatsPanel';
import SettingsPanel from './SettingsPanel';
import Toast from './Toast';

const VideoCallScreen = () => {
  const { 
    roomId,
    participants,
    connectionState,
    iceState,
    callDuration,
    showStats,
    setShowStats,
    showSettings,
    setShowSettings,
    notification,
    setNotification
  } = useAppContext();

  return (
    <div className="h-screen bg-meet-dark flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-meet-darker border-b border-meet-gray/30">
        <div className="flex items-center gap-4">
          {/* Room ID */}
          <div className="hidden sm:block">
            <p className="text-xs text-meet-light-gray">Room</p>
            <p className="text-sm text-white font-mono">{roomId}</p>
          </div>
          
          {/* Connection Status */}
          <ConnectionStatus 
            connectionState={connectionState} 
            iceState={iceState}
          />
        </div>

        {/* Call Timer */}
        <div className="text-white font-mono text-sm">
          {callDuration}
        </div>
      </div>

      {/* Video Grid */}
      <VideoGrid participants={participants} />

      {/* Control Bar */}
      <ControlBar />

      {/* Stats Panel (Slide-in) */}
      <StatsPanel 
        isOpen={showStats} 
        onClose={() => setShowStats(false)} 
      />

      {/* Settings Panel (Slide-in) */}
      <SettingsPanel 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />

      {/* Toast Notifications */}
      <Toast 
        notification={notification}
        onClose={() => setNotification(null)}
      />

      {/* Overlay when panels are open */}
      {(showStats || showSettings) && (
        <div 
          className="fixed inset-0 bg-black/30 z-30"
          onClick={() => {
            setShowStats(false);
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
};

export default VideoCallScreen;
