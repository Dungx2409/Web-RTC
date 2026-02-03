import { useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, UserCircle, UserX } from 'lucide-react';
import { getStatusColor, getStatusText } from '../data/mockData';

const VideoTile = ({ 
  participant, 
  isLocal = false, 
  showStatus = true,
  size = 'normal', // 'normal' | 'small' | 'large'
  isHost = false,
  onRemove
}) => {
  const videoRef = useRef(null);
  
  const sizeClasses = {
    small: 'min-h-[120px]',
    normal: 'min-h-[200px]',
    large: 'min-h-[300px] lg:min-h-[400px]'
  };

  // Attach MediaStream to video element
  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  const hasVideoStream = participant.stream && !participant.isCameraOff;

  return (
    <div 
      className={`relative bg-meet-darker rounded-2xl overflow-hidden shadow-meet group transition-all ${
        sizeClasses[size]
      } ${
        isLocal ? 'ring-2 ring-meet-blue ring-opacity-50' : ''
      }`}
    >
      {/* Video Element or Avatar Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        {hasVideoStream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal} // Mute local video to prevent echo
            className={`absolute inset-0 w-full h-full object-cover ${
              isLocal ? 'transform scale-x-[-1]' : ''
            }`}
          />
        ) : participant.isCameraOff ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 bg-meet-gray rounded-full flex items-center justify-center">
              <UserCircle className="w-12 h-12 text-meet-light-gray" />
            </div>
            <span className="text-meet-light-gray text-sm">Camera off</span>
          </div>
        ) : (
          // Avatar placeholder when no stream yet
          <div className="absolute inset-0 bg-gradient-to-br from-meet-gray via-meet-darker to-meet-dark">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-meet-gray/50 rounded-full flex items-center justify-center">
                <span className="text-4xl font-medium text-white">
                  {participant.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          {/* Name and Status */}
          <div className="flex items-center gap-2">
            <span className="text-white font-medium text-sm truncate max-w-[150px]">
              {participant.name}
              {isLocal && (
                <span className="ml-1 text-meet-blue">(You)</span>
              )}
            </span>
            
            {showStatus && (
              <div className="flex items-center gap-1">
                <span 
                  className={`w-2 h-2 rounded-full ${getStatusColor(participant.connectionState)}`}
                  title={getStatusText(participant.connectionState)}
                />
              </div>
            )}
          </div>

          {/* Media Controls Indicators */}
          <div className="flex items-center gap-2">
            {participant.isMuted ? (
              <div className="p-1.5 bg-meet-red/80 rounded-full">
                <MicOff className="w-3.5 h-3.5 text-white" />
              </div>
            ) : (
              <div className="p-1.5 bg-meet-gray/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Mic className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            
            {participant.isCameraOff ? (
              <div className="p-1.5 bg-meet-red/80 rounded-full">
                <VideoOff className="w-3.5 h-3.5 text-white" />
              </div>
            ) : (
              <div className="p-1.5 bg-meet-gray/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Video className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Connection Status Text (shown on hover) */}
        {showStatus && (
          <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-gray-400">
              Status: {getStatusText(participant.connectionState)}
            </span>
          </div>
        )}
      </div>

      {/* Local User Badge */}
      {isLocal && (
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 bg-meet-blue/90 text-white text-xs font-medium rounded-full">
            You
          </span>
        </div>
      )}

      {/* Remove Button (for host only, on non-local participants) */}
      {isHost && !isLocal && onRemove && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onRemove(participant.id, participant.name)}
            className="p-2 bg-meet-red/90 hover:bg-meet-red rounded-full transition-all tooltip shadow-lg"
            data-tooltip="Remove participant"
          >
            <UserX className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {/* Connecting Overlay */}
      {participant.connectionState === 'connecting' && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-3 border-meet-blue border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-sm">Connecting...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoTile;
