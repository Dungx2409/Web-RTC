import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  BarChart3, 
  Settings,
  Users
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const ControlBar = () => {
  const { 
    currentUser, 
    toggleMic, 
    toggleCamera, 
    endCall,
    showStats,
    setShowStats,
    showSettings,
    setShowSettings,
    participants
  } = useAppContext();

  const controlButtons = [
    {
      id: 'mic',
      icon: currentUser.isMuted ? MicOff : Mic,
      label: currentUser.isMuted ? 'Unmute' : 'Mute',
      onClick: toggleMic,
      isActive: !currentUser.isMuted,
      activeClass: 'bg-meet-gray hover:bg-meet-gray/80',
      inactiveClass: 'bg-meet-red hover:bg-meet-red/90'
    },
    {
      id: 'camera',
      icon: currentUser.isCameraOff ? VideoOff : Video,
      label: currentUser.isCameraOff ? 'Turn on camera' : 'Turn off camera',
      onClick: toggleCamera,
      isActive: !currentUser.isCameraOff,
      activeClass: 'bg-meet-gray hover:bg-meet-gray/80',
      inactiveClass: 'bg-meet-red hover:bg-meet-red/90'
    },
    {
      id: 'hangup',
      icon: PhoneOff,
      label: 'Leave call',
      onClick: endCall,
      isActive: false,
      activeClass: '',
      inactiveClass: 'bg-meet-red hover:bg-meet-red/90',
      isHangup: true
    }
  ];

  const secondaryButtons = [
    {
      id: 'stats',
      icon: BarChart3,
      label: 'Statistics',
      onClick: () => setShowStats(!showStats),
      isActive: showStats
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      onClick: () => setShowSettings(!showSettings),
      isActive: showSettings
    }
  ];

  return (
    <div className="bg-meet-darker border-t border-meet-gray/30 px-4 py-4">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Left side - Room info */}
        <div className="hidden sm:flex items-center gap-2 text-meet-light-gray">
          <Users className="w-4 h-4" />
          <span className="text-sm">{participants.length} participants</span>
        </div>

        {/* Center - Main controls */}
        <div className="flex items-center gap-3">
          {controlButtons.map((btn) => {
            const Icon = btn.icon;
            const buttonClass = btn.isActive ? btn.activeClass : btn.inactiveClass;
            
            return (
              <button
                key={btn.id}
                onClick={btn.onClick}
                className={`
                  relative p-4 rounded-full transition-all tooltip
                  ${buttonClass}
                  ${btn.isHangup ? 'px-6' : ''}
                  hover:scale-105 active:scale-95
                `}
                data-tooltip={btn.label}
              >
                <Icon className="w-6 h-6 text-white" />
              </button>
            );
          })}
        </div>

        {/* Right side - Secondary controls */}
        <div className="flex items-center gap-2">
          {secondaryButtons.map((btn) => {
            const Icon = btn.icon;
            
            return (
              <button
                key={btn.id}
                onClick={btn.onClick}
                className={`
                  p-3 rounded-full transition-all tooltip hidden sm:block
                  ${btn.isActive 
                    ? 'bg-meet-blue/20 text-meet-blue' 
                    : 'bg-meet-gray/30 text-meet-light-gray hover:bg-meet-gray/50 hover:text-white'
                  }
                `}
                data-tooltip={btn.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ControlBar;
