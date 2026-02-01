import { useState } from 'react';
import { Video, Users, ArrowRight, Plus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const JoinRoomScreen = () => {
  const { createRoom, joinRoom } = useAppContext();
  
  const [nickname, setNickname] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateInputs = (requireRoomId = false) => {
    const newErrors = {};
    
    if (!nickname.trim()) {
      newErrors.nickname = 'Please enter your nickname';
    } else if (nickname.trim().length < 2) {
      newErrors.nickname = 'Nickname must be at least 2 characters';
    }
    
    if (requireRoomId && !roomIdInput.trim()) {
      newErrors.roomId = 'Please enter a Room ID';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateRoom = async () => {
    if (!validateInputs(false)) return;
    
    setIsLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    createRoom(nickname.trim());
    setIsLoading(false);
  };

  const handleJoinRoom = async () => {
    if (!validateInputs(true)) return;
    
    setIsLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    joinRoom(nickname.trim(), roomIdInput.trim());
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (roomIdInput.trim()) {
        handleJoinRoom();
      } else {
        handleCreateRoom();
      }
    }
  };

  return (
    <div className="min-h-screen bg-meet-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-meet-blue/20 rounded-full mb-4">
            <Video className="w-8 h-8 text-meet-blue" />
          </div>
          <h1 className="text-3xl font-medium text-white mb-2">
            WebRTC Meet
          </h1>
          <p className="text-meet-light-gray text-sm">
            Video calls for everyone. No account needed.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-meet-gray/30 rounded-2xl p-6 shadow-meet">
          {/* Nickname Input */}
          <div className="mb-4">
            <label 
              htmlFor="nickname" 
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Your Name
            </label>
            <div className="relative">
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  if (errors.nickname) {
                    setErrors(prev => ({ ...prev, nickname: '' }));
                  }
                }}
                onKeyPress={handleKeyPress}
                placeholder="Enter your nickname"
                className={`w-full px-4 py-3 bg-meet-darker border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                  errors.nickname 
                    ? 'border-meet-red focus:ring-meet-red/50' 
                    : 'border-meet-gray focus:ring-meet-blue/50 focus:border-meet-blue'
                }`}
                disabled={isLoading}
              />
              <Users className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>
            {errors.nickname && (
              <p className="mt-1 text-sm text-meet-red animate-fade-in">
                {errors.nickname}
              </p>
            )}
          </div>

          {/* Room ID Input */}
          <div className="mb-6">
            <label 
              htmlFor="roomId" 
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Room ID <span className="text-gray-500">(optional for new room)</span>
            </label>
            <input
              id="roomId"
              type="text"
              value={roomIdInput}
              onChange={(e) => {
                setRoomIdInput(e.target.value);
                if (errors.roomId) {
                  setErrors(prev => ({ ...prev, roomId: '' }));
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder="abc-def-ghi"
              className={`w-full px-4 py-3 bg-meet-darker border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                errors.roomId 
                  ? 'border-meet-red focus:ring-meet-red/50' 
                  : 'border-meet-gray focus:ring-meet-blue/50 focus:border-meet-blue'
              }`}
              disabled={isLoading}
            />
            {errors.roomId && (
              <p className="mt-1 text-sm text-meet-red animate-fade-in">
                {errors.roomId}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCreateRoom}
              disabled={isLoading || !nickname.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-meet-blue text-meet-dark font-medium rounded-xl hover:bg-meet-blue-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-meet-hover"
            >
              <Plus className="w-5 h-5" />
              Create Room
            </button>
            
            <button
              onClick={handleJoinRoom}
              disabled={isLoading || !nickname.trim() || !roomIdInput.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-transparent border border-meet-blue text-meet-blue font-medium rounded-xl hover:bg-meet-blue/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join Room
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-meet-light-gray">
              <div className="w-4 h-4 border-2 border-meet-blue border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Connecting...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-meet-light-gray text-xs mt-6">
          By using this service, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default JoinRoomScreen;
