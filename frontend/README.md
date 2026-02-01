# WebRTC Meet Clone

A Google Meet-style video conferencing UI built with React, Vite, and Tailwind CSS.

## Features

- 🎥 **Video Call UI** - Grid layout supporting 1-6+ participants
- 🎤 **Media Controls** - Mute/unmute, camera on/off, hangup
- 📊 **WebRTC Stats Panel** - View connection statistics (mock data)
- 🔄 **TURN Fallback UI** - Visual indicators for P2P vs relay connections
- 📱 **Responsive Design** - Works on desktop and mobile
- 🎨 **Google Meet Style** - Clean, minimal UI design

## Tech Stack

- **React 18** - Component-based UI
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── JoinRoomScreen.jsx     # Landing page - create/join room
│   ├── RoomLobbyScreen.jsx    # Room lobby - view members
│   ├── VideoCallScreen.jsx    # Main video call UI
│   ├── VideoGrid.jsx          # Responsive video grid
│   ├── VideoTile.jsx          # Individual video card
│   ├── ControlBar.jsx         # Bottom control buttons
│   ├── ConnectionStatus.jsx   # Status indicator
│   ├── StatsPanel.jsx         # WebRTC statistics panel
│   ├── SettingsPanel.jsx      # ICE/TURN settings
│   ├── Toast.jsx              # Notification toasts
│   └── CallEndedScreen.jsx    # Call ended summary
├── context/
│   └── AppContext.jsx         # Global state management
├── data/
│   └── mockData.js            # Mock data and utilities
├── App.jsx                    # Main app with routing
├── main.jsx                   # Entry point
└── index.css                  # Global styles
```

## Screens

### 1. Join Room Screen
- Enter nickname
- Create new room or join existing
- Input validation

### 2. Room Lobby
- View room ID (copy to clipboard)
- See online members
- Start group call when 2+ members

### 3. Video Call
- Video grid (auto-adjusts layout)
- Control bar (mic, camera, hangup, stats, settings)
- Connection status indicator
- TURN fallback notifications

### 4. Stats Panel
- Call duration
- ICE/Connection states
- Candidate types (host/srflx/relay)
- Traffic statistics
- Bitrate and codec info

### 5. Settings Panel
- TURN server configuration (UI only)
- ICE transport policy

## UI States

| State | Description |
|-------|-------------|
| `idle` | Not in a room |
| `inRoom` | In room lobby |
| `calling` | Active video call |
| `ended` | Call ended |

## Connection States

| State | Color | Description |
|-------|-------|-------------|
| `new` | Gray | Initial state |
| `connecting` | Yellow | Establishing connection |
| `connected` | Green | Successfully connected |
| `failed` | Red | Connection failed |

## Mock Data

This UI uses mock data to simulate:
- User participants
- WebRTC statistics
- Connection state changes
- TURN fallback scenarios

## License

MIT
