import { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { APP_STATES } from './data/mockData';
import JoinRoomScreen from './components/JoinRoomScreen';
import RoomLobbyScreen from './components/RoomLobbyScreen';
import RoomListScreen from './components/RoomListScreen';
import VideoCallScreen from './components/VideoCallScreen';
import CallEndedScreen from './components/CallEndedScreen';

// Main app content with state-based routing
const AppContent = () => {
  const { appState, joinRoom } = useAppContext();
  const [showRoomList, setShowRoomList] = useState(false);
  const [nickname, setNickname] = useState('');

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
      return <JoinRoomScreen onShowRoomList={() => setShowRoomList(true)} />;
    case APP_STATES.IN_ROOM:
      return <RoomLobbyScreen />;
    case APP_STATES.CALLING:
      return <VideoCallScreen />;
    case APP_STATES.ENDED:
      return <CallEndedScreen />;
    default:
      return <JoinRoomScreen onShowRoomList={() => setShowRoomList(true)} />;
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
