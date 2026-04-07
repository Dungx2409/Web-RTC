import { X, Users, UserCircle, Crown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const MembersPanel = ({ isOpen, onClose }) => {
  const { participants, isHost } = useAppContext();

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-y-0 right-0 w-80 bg-meet-darker shadow-2xl transform transition-transform duration-300 ease-in-out z-40 flex flex-col border-l border-meet-gray/30 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-meet-gray/30">
        <div className="flex items-center gap-2 text-white">
          <Users className="w-5 h-5" />
          <h2 className="font-medium">People</h2>
          <span className="bg-meet-gray/50 text-xs px-2 py-0.5 rounded-full">
            {participants.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-meet-gray/50 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-meet-light-gray" />
        </button>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {participants.map(participant => (
          <div key={participant.id} className="flex items-center gap-3 p-2 hover:bg-meet-gray/20 rounded-xl transition-colors">
            <div className="relative">
              <div className="w-10 h-10 bg-meet-gray rounded-full flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-meet-light-gray" />
              </div>
              <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-meet-darker rounded-full ${
                participant.connectionState === 'connected' ? 'bg-meet-green' : 
                participant.connectionState === 'connecting' ? 'bg-meet-yellow' : 'bg-meet-red'
              }`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-white truncate">
                  {participant.name}
                  {participant.isLocal && <span className="text-meet-light-gray font-normal ml-1">(You)</span>}
                </p>
                {/* Host Badge - In a real app we'd need to track host state per participant properly. For now we just show it for local if they are host */}
                {participant.isLocal && isHost && (
                  <span className="bg-meet-yellow/20 text-meet-yellow text-[10px] px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                  </span>
                )}
              </div>
              <p className="text-xs text-meet-light-gray truncate">
                {participant.isMuted ? 'Muted' : 'Microphone on'} • {participant.isCameraOff ? 'Camera off' : 'Camera on'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MembersPanel;
