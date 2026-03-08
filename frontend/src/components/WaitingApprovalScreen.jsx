import { useState } from 'react';
import { Users, Clock, LogOut, UserCircle, Crown, Loader2, HandMetal } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const WaitingApprovalScreen = () => {
  const { 
    roomId, 
    activeCallMembers,
    leaveRoom,
    currentUser,
    requestJoinCall,
    waitingForApproval
  } = useAppContext();

  const [hasRequested, setHasRequested] = useState(false);

  const handleRequestJoin = () => {
    requestJoinCall(roomId, currentUser.name);
    setHasRequested(true);
  };

  return (
    <div className="min-h-screen bg-meet-dark flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Header */}
        <div className="bg-meet-gray/30 rounded-2xl p-6 shadow-meet mb-4">
          <div className="flex flex-col items-center text-center mb-6">
            {hasRequested ? (
              <>
                <div className="w-16 h-16 bg-meet-blue/20 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 text-meet-blue animate-spin" />
                </div>
                <h2 className="text-xl font-medium text-white mb-2">
                  Waiting for approval
                </h2>
                <p className="text-meet-light-gray text-sm">
                  Your request to join has been sent to the host.
                  <br />
                  Please wait while the host reviews your request.
                </p>
                {/* Animated waiting dots */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="w-2 h-2 bg-meet-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-meet-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-meet-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-meet-yellow/20 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-meet-yellow" />
                </div>
                <h2 className="text-xl font-medium text-white mb-2">
                  Meeting in progress
                </h2>
                <p className="text-meet-light-gray text-sm">
                  This meeting has already started. You can request to join
                  <br />
                  and the host will be notified.
                </p>
              </>
            )}
          </div>

          {/* Your info */}
          <div className="bg-meet-darker rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-meet-blue/20 rounded-full flex items-center justify-center">
              <UserCircle className="w-6 h-6 text-meet-blue" />
            </div>
            <div>
              <p className="text-white font-medium">{currentUser.name}</p>
              <p className="text-meet-light-gray text-xs">Room {roomId}</p>
            </div>
          </div>
        </div>

        {/* Meeting Participants */}
        <div className="bg-meet-gray/30 rounded-2xl p-6 shadow-meet mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-meet-blue" />
              In the meeting
            </h3>
            <span className="px-3 py-1 bg-meet-green/20 text-meet-green text-sm font-medium rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-meet-green rounded-full animate-pulse" />
              Live
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {activeCallMembers.map((member, index) => (
              <div
                key={member.id || index}
                className="flex items-center gap-3 p-3 rounded-xl bg-meet-darker"
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-meet-gray rounded-full flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-meet-light-gray" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-meet-green border-2 border-meet-dark rounded-full" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{member.name}</p>
                    {member.isHost && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-meet-yellow/20 text-meet-yellow text-xs rounded-full">
                        <Crown className="w-3 h-3" />
                        Host
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {!hasRequested && (
            <button
              onClick={handleRequestJoin}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-meet-blue text-white font-medium rounded-xl hover:bg-meet-blue/90 transition-all hover:shadow-meet-hover"
            >
              <HandMetal className="w-5 h-5" />
              Request to Join
            </button>
          )}
          
          <button
            onClick={leaveRoom}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-meet-red/20 text-meet-red font-medium rounded-xl hover:bg-meet-red/30 transition-all"
          >
            <LogOut className="w-5 h-5" />
            {hasRequested ? 'Cancel & Leave' : 'Leave'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaitingApprovalScreen;
