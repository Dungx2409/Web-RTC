import { AppProvider, useAppContext } from './context/AppContext';
import { APP_STATES } from './data/mockData';
import JoinRoomScreen from './components/JoinRoomScreen';
import RoomLobbyScreen from './components/RoomLobbyScreen';
import VideoCallScreen from './components/VideoCallScreen';
import CallEndedScreen from './components/CallEndedScreen';

// Main app content with state-based routing
const AppContent = () => {
  const { appState } = useAppContext();

  switch (appState) {
    case APP_STATES.IDLE:
      return <JoinRoomScreen />;
    case APP_STATES.IN_ROOM:
      return <RoomLobbyScreen />;
    case APP_STATES.CALLING:
      return <VideoCallScreen />;
    case APP_STATES.ENDED:
      return <CallEndedScreen />;
    default:
      return <JoinRoomScreen />;
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
