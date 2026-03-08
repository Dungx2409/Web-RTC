import { useState, useEffect } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { APP_STATES } from './data/mockData';
import JoinRoomScreen from './components/JoinRoomScreen';
import RoomLobbyScreen from './components/RoomLobbyScreen';
import RoomListScreen from './components/RoomListScreen';
import VideoCallScreen from './components/VideoCallScreen';
import CallEndedScreen from './components/CallEndedScreen';
import DebugPanel from './components/DebugPanel';

// Main app content with state-based routing
const AppContent = () => {
  const { appState, joinRoom } = useAppContext();
  const [showRoomList, setShowRoomList] = useState(false);
  const [nickname, setNickname] = useState('');
  const [showDebug, setShowDebug] = useState(false);

  // Toggle debug panel with Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebug(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle room selection from room list
  const handleSelectRoom = (roomId) => {
    const name = nickname || `User${Math.floor(Math.random() * 1000)}`;
    setShowRoomList(false);
    joinRoom(name, roomId);
  };

  // Show room list view
  if (showRoomList) {
    return (
      <RoomListScreen 
        onSelectRoom={handleSelectRoom}
        onBack={() => setShowRoomList(false)}
      />
    );
  }

  switch (appState) {
    case APP_STATES.IDLE:
      return (
        <>
          <JoinRoomScreen onShowRoomList={() => setShowRoomList(true)} />
          {showDebug && <DebugPanel />}
        </>
      );
    case APP_STATES.IN_ROOM:
      return (
        <>
          <RoomLobbyScreen />
          {showDebug && <DebugPanel />}
        </>
      );
    case APP_STATES.CALLING:
      return (
        <>
          <VideoCallScreen />
          {showDebug && <DebugPanel />}
        </>
      );
    case APP_STATES.ENDED:
      return (
        <>
          <CallEndedScreen />
          {showDebug && <DebugPanel />}
        </>
      );
    default:
      return (
        <>
          <JoinRoomScreen onShowRoomList={() => setShowRoomList(true)} />
          {showDebug && <DebugPanel />}
        </>
      );
  }
};

// App wrapper with provider
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
