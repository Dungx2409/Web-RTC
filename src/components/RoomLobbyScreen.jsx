import { Users, PhoneCall, LogOut, Copy, Check, UserCircle, Crown } from 'lucide-react';
import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const RoomLobbyScreen = () => {
  const { 
    roomId, 
    roomMembers, 
    currentUser,
    startGroupCall, 
    leaveRoom,
    isHost
  } = useAppContext();
  
  const [copied, setCopied] = useState(false);

  const handleCopyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const canStartCall = roomMembers.length >= 2;

  return (
    <div className="min-h-screen bg-meet-dark flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Room Header */}
        <div className="bg-meet-gray/30 rounded-2xl p-6 shadow-meet mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-medium text-white">Room Lobby</h2>
              <p className="text-meet-light-gray text-sm mt-1">
                Waiting for participants to join
              </p>
            </div>
            <div className="w-12 h-12 bg-meet-blue/20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-meet-blue" />
            </div>
          </div>

          {/* Room ID with Copy */}
          <div className="bg-meet-darker rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-meet-light-gray uppercase tracking-wide mb-1">
                Room ID
              </p>
              <p className="text-lg font-mono text-white">{roomId}</p>
            </div>
            <button
              onClick={handleCopyRoomId}
              className="p-3 bg-meet-gray hover:bg-meet-gray/80 rounded-xl transition-all tooltip"
              data-tooltip={copied ? 'Copied!' : 'Copy Room ID'}
            >
              {copied ? (
                <Check className="w-5 h-5 text-meet-green" />
              ) : (
                <Copy className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Members List */}
        <div className="bg-meet-gray/30 rounded-2xl p-6 shadow-meet mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">
              Members Online
            </h3>
            <span className="px-3 py-1 bg-meet-blue/20 text-meet-blue text-sm font-medium rounded-full">
              {roomMembers.length} {roomMembers.length === 1 ? 'person' : 'people'}
            </span>
          </div>

          {/* Member List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {roomMembers.map((member, index) => (
              <div
                key={member.id || index}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  member.isLocal || member.name === currentUser.name
                    ? 'bg-meet-blue/10 border border-meet-blue/30'
                    : 'bg-meet-darker hover:bg-meet-gray/50'
                }`}
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-meet-gray rounded-full flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-meet-light-gray" />
                  </div>
                  {/* Online indicator */}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-meet-green border-2 border-meet-dark rounded-full" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">
                      {member.name}
                      {(member.isLocal || member.name === currentUser.name) && (
                        <span className="ml-2 text-meet-blue text-sm">(You)</span>
                      )}
                    </p>
                    {/* Host badge - show for the first member (creator) or if current user is host and local */}
                    {((member.isLocal || member.name === currentUser.name) && isHost) && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-meet-yellow/20 text-meet-yellow text-xs rounded-full">
                        <Crown className="w-3 h-3" />
                        Host
                      </span>
                    )}
                  </div>
                  <p className="text-meet-light-gray text-xs">Ready to join call</p>
                </div>

                {/* Status badge */}
                <span className="px-2 py-1 bg-meet-green/20 text-meet-green text-xs rounded-full">
                  Online
                </span>
              </div>
            ))}
          </div>

          {/* Waiting indicator */}
          {roomMembers.length < 2 && (
            <div className="mt-4 p-4 bg-meet-yellow/10 border border-meet-yellow/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-meet-yellow rounded-full animate-pulse-slow" />
                <p className="text-meet-yellow text-sm">
                  Waiting for more participants to join...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={startGroupCall}
            disabled={!canStartCall}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-meet-green text-white font-medium rounded-xl hover:bg-meet-green/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-meet-hover"
          >
            <PhoneCall className="w-5 h-5" />
            Start Group Call
          </button>
          
          <button
            onClick={leaveRoom}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-meet-red/20 text-meet-red font-medium rounded-xl hover:bg-meet-red/30 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Leave Room
          </button>
        </div>

        {!canStartCall && (
          <p className="text-center text-meet-light-gray text-sm mt-4">
            At least 2 participants are required to start a call
          </p>
        )}
      </div>
    </div>
  );
};

export default RoomLobbyScreen;
