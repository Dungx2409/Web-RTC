import { CheckCircle, Home } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { APP_STATES } from '../data/mockData';

const CallEndedScreen = () => {
  const { setAppState } = useAppContext();

  return (
    <div className="min-h-screen bg-meet-dark flex items-center justify-center p-4">
      <div className="text-center animate-fade-in">
        {/* Success Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-meet-green/20 rounded-full mb-6">
          <CheckCircle className="w-10 h-10 text-meet-green" />
        </div>

        {/* Message */}
        <h1 className="text-2xl font-medium text-white mb-2">
          Call Ended
        </h1>
        <p className="text-meet-light-gray mb-8">
          Thank you for using WebRTC Meet
        </p>

        {/* Call Summary (mock) */}
        <div className="bg-meet-gray/30 rounded-xl p-6 mb-6 max-w-sm mx-auto">
          <h3 className="text-sm text-meet-light-gray mb-4">Call Summary</h3>
          <div className="space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-gray-400">Duration</span>
              <span className="text-white">15:23</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Participants</span>
              <span className="text-white">4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Connection</span>
              <span className="text-meet-yellow">TURN Relay</span>
            </div>
          </div>
        </div>

        {/* Back to Home Button */}
        <button
          onClick={() => setAppState(APP_STATES.IDLE)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-meet-blue text-meet-dark font-medium rounded-xl hover:bg-meet-blue-hover transition-all"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default CallEndedScreen;
