import { createContext, useContext, useState, useCallback } from 'react';
import { APP_STATES, mockUsers, generateRoomId } from '../data/mockData';

const AppContext = createContext(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // App state
  const [appState, setAppState] = useState(APP_STATES.IDLE);
  
  // User info
  const [currentUser, setCurrentUser] = useState({
    id: 'user-local',
    name: '',
    isLocal: true,
    isMuted: false,
    isCameraOff: false
  });
  
  // Host status (room creator)
  const [isHost, setIsHost] = useState(false);
  
  // Room info
  const [roomId, setRoomId] = useState('');
  const [roomMembers, setRoomMembers] = useState([]);
  
  // Call participants (for video call)
  const [participants, setParticipants] = useState([]);
  
  // Connection status
  const [connectionState, setConnectionState] = useState('new');
  const [iceState, setIceState] = useState('new');
  
  // UI states
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notification, setNotification] = useState(null);

  // Create room
  const createRoom = useCallback((nickname) => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    setCurrentUser(prev => ({ ...prev, name: nickname }));
    setRoomMembers([{ ...currentUser, name: nickname }]);
    setIsHost(true); // Creator is the host
    setAppState(APP_STATES.IN_ROOM);
    
    // Simulate other members joining after delay
    setTimeout(() => {
      setRoomMembers(prev => [
        ...prev,
        { ...mockUsers[1], id: 'user-2' },
        { ...mockUsers[2], id: 'user-3' }
      ]);
    }, 2000);
  }, [currentUser]);

  // Join room
  const joinRoom = useCallback((nickname, roomIdInput) => {
    setRoomId(roomIdInput);
    setCurrentUser(prev => ({ ...prev, name: nickname }));
    setIsHost(false); // Joining user is not the host
    
    // Simulate existing members in room
    const existingMembers = mockUsers.slice(1, 3).map((u, i) => ({
      ...u,
      id: `user-${i + 2}`
    }));
    
    setRoomMembers([
      { ...currentUser, name: nickname },
      ...existingMembers
    ]);
    setAppState(APP_STATES.IN_ROOM);
  }, [currentUser]);

  // Leave room
  const leaveRoom = useCallback(() => {
    setRoomId('');
    setRoomMembers([]);
    setParticipants([]);
    setIsHost(false);
    setAppState(APP_STATES.IDLE);
    setConnectionState('new');
    setIceState('new');
  }, []);

  // Start group call
  const startGroupCall = useCallback(() => {
    setAppState(APP_STATES.CALLING);
    setConnectionState('connecting');
    setIceState('checking');
    
    // Set initial participants
    const callParticipants = roomMembers.map((member, index) => ({
      ...member,
      connectionState: index === 0 ? 'connected' : 'connecting',
      iceState: index === 0 ? 'connected' : 'checking'
    }));
    setParticipants(callParticipants);
    
    // Simulate connection progress
    setTimeout(() => {
      setConnectionState('connected');
      setIceState('connected');
      setParticipants(prev => prev.map(p => ({
        ...p,
        connectionState: 'connected',
        iceState: 'connected'
      })));
    }, 3000);
    
    // Simulate TURN fallback notification
    setTimeout(() => {
      setNotification({
        type: 'warning',
        message: 'P2P failed, trying TURN...'
      });
      
      setTimeout(() => {
        setNotification({
          type: 'success',
          message: 'Connected via TURN relay'
        });
        
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      }, 2000);
    }, 1500);
  }, [roomMembers]);

  // End call
  const endCall = useCallback(() => {
    setAppState(APP_STATES.ENDED);
    setParticipants([]);
    setConnectionState('closed');
    setIceState('closed');
    
    // Return to idle after delay
    setTimeout(() => {
      setAppState(APP_STATES.IDLE);
      setRoomId('');
      setRoomMembers([]);
      setConnectionState('new');
      setIceState('new');
    }, 2000);
  }, []);

  // Toggle mic
  const toggleMic = useCallback(() => {
    setCurrentUser(prev => ({ ...prev, isMuted: !prev.isMuted }));
    setParticipants(prev => prev.map(p => 
      p.isLocal ? { ...p, isMuted: !p.isMuted } : p
    ));
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    setCurrentUser(prev => ({ ...prev, isCameraOff: !prev.isCameraOff }));
    setParticipants(prev => prev.map(p => 
      p.isLocal ? { ...p, isCameraOff: !p.isCameraOff } : p
    ));
  }, []);

  // Add participant (for demo)
  const addParticipant = useCallback(() => {
    const newUserIndex = participants.length;
    if (newUserIndex < mockUsers.length) {
      const newUser = {
        ...mockUsers[newUserIndex],
        id: `user-${newUserIndex + 1}`,
        connectionState: 'connected',
        iceState: 'connected'
      };
      setParticipants(prev => [...prev, newUser]);
    }
  }, [participants]);

  // Remove participant (host only)
  const removeParticipant = useCallback((userId, userName) => {
    if (!isHost) {
      setNotification({
        type: 'error',
        message: 'Only the host can remove participants'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    setParticipants(prev => prev.filter(p => p.id !== userId));
    setRoomMembers(prev => prev.filter(m => m.id !== userId));
    
    // Show notification
    setNotification({
      type: 'info',
      message: `${userName || 'Participant'} has been removed from the call`
    });
    setTimeout(() => setNotification(null), 3000);
  }, [isHost]);

  const value = {
    // State
    appState,
    currentUser,
    roomId,
    roomMembers,
    participants,
    connectionState,
    iceState,
    showStats,
    showSettings,
    notification,
    isHost,
    
    // Actions
    setAppState,
    createRoom,
    joinRoom,
    leaveRoom,
    startGroupCall,
    endCall,
    toggleMic,
    toggleCamera,
    setShowStats,
    setShowSettings,
    setNotification,
    addParticipant,
    removeParticipant
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
