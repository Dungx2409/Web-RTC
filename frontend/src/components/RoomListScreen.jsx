import { useState, useEffect } from 'react';
import { Users, Video, Clock, RefreshCw, ExternalLink, Search } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { config } from '../services/config';

const RoomListScreen = ({ onSelectRoom, onBack }) => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Get API URL from signaling URL
  const getApiUrl = () => {
    const signalingUrl = config.SIGNALING_URL;
    // Convert ws:// or wss:// to http:// or https://
    return signalingUrl.replace('ws://', 'http://').replace('wss://', 'https://');
  };

  const fetchRooms = async () => {
    try {
      setError(null);
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/rooms`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }
      
      const data = await response.json();
      setRooms(data);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Failed to load rooms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    
    // Auto refresh every 5 seconds if enabled
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchRooms, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const filteredRooms = rooms.filter(room => 
    room.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = () => {
    setIsLoading(true);
    fetchRooms();
  };

  return (
    <div className="min-h-screen bg-meet-dark p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-medium text-white mb-1">
                Active Rooms
              </h1>
              <p className="text-meet-light-gray text-sm">
                {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'} available
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Auto-refresh toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  autoRefresh
                    ? 'bg-meet-blue text-white'
                    : 'bg-meet-gray text-gray-300 hover:bg-meet-gray/80'
                }`}
              >
                <RefreshCw className={`w-4 h-4 inline mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto
              </button>
              
              {/* Manual refresh */}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-3 py-2 bg-meet-gray text-white rounded-lg hover:bg-meet-gray/80 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              
              {/* Back button */}
              <button
                onClick={onBack}
                className="px-4 py-2 bg-meet-gray text-white rounded-lg hover:bg-meet-gray/80 transition-all"
              >
                Back
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms by ID..."
              className="w-full pl-10 pr-4 py-3 bg-meet-gray border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-meet-blue transition-all"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="w-12 h-12 text-meet-blue animate-spin mb-4" />
            <p className="text-gray-400">Loading rooms...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-meet-gray/50 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl text-white mb-2">
              {searchQuery ? 'No rooms found' : 'No active rooms'}
            </h3>
            <p className="text-gray-400 mb-6 max-w-md">
              {searchQuery 
                ? 'Try a different search term'
                : 'Be the first to create a room and start a video call!'
              }
            </p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-meet-blue text-white rounded-lg hover:bg-meet-blue/90 transition-all font-medium"
            >
              Create Room
            </button>
          </div>
        ) : (
          /* Room list */
          <div className="grid gap-3">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className="bg-meet-gray/30 border border-gray-700 rounded-xl p-4 hover:border-meet-blue/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-shrink-0 w-10 h-10 bg-meet-blue/20 rounded-lg flex items-center justify-center">
                        <Video className="w-5 h-5 text-meet-blue" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-medium truncate">
                            Room {room.id}
                          </h3>
                          {room.callActive && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                              Live
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {room.memberCount} {room.memberCount === 1 ? 'member' : 'members'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(room.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onSelectRoom(room.id)}
                    className="ml-4 px-4 py-2 bg-meet-blue text-white rounded-lg hover:bg-meet-blue/90 transition-all font-medium flex items-center gap-2 opacity-0 group-hover:opacity-100"
                  >
                    Join
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          {autoRefresh && (
            <p>Auto-refreshing every 5 seconds</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomListScreen;
