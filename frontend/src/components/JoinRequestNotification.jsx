import { UserPlus, Check, X, UserCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const JoinRequestNotification = () => {
  const { joinRequests, approveJoinRequest, rejectJoinRequest } = useAppContext();

  if (!joinRequests || joinRequests.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {joinRequests.map((request) => (
        <div
          key={request.requesterId}
          className="bg-meet-gray/95 backdrop-blur-sm border border-meet-blue/30 rounded-2xl p-4 shadow-meet animate-fade-in"
        >
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0 relative">
              <div className="w-10 h-10 bg-meet-blue/20 rounded-full flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-meet-blue" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-meet-blue rounded-full flex items-center justify-center">
                <UserPlus className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm">
                {request.name}
              </p>
              <p className="text-meet-light-gray text-xs mt-0.5">
                wants to join the meeting
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => approveJoinRequest(request.requesterId)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-meet-green text-white text-sm font-medium rounded-lg hover:bg-meet-green/90 transition-all"
                >
                  <Check className="w-4 h-4" />
                  Admit
                </button>
                <button
                  onClick={() => rejectJoinRequest(request.requesterId)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-meet-red/20 text-meet-red text-sm font-medium rounded-lg hover:bg-meet-red/30 transition-all"
                >
                  <X className="w-4 h-4" />
                  Deny
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default JoinRequestNotification;
