// Mock data for WebRTC Meet Clone UI

// Connection states
export const CONNECTION_STATES = {
  NEW: 'new',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  FAILED: 'failed',
  CLOSED: 'closed'
};

// ICE connection states
export const ICE_STATES = {
  NEW: 'new',
  CHECKING: 'checking',
  CONNECTED: 'connected',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DISCONNECTED: 'disconnected',
  CLOSED: 'closed'
};

// App states
export const APP_STATES = {
  IDLE: 'idle',
  IN_ROOM: 'inRoom',
  CALLING: 'calling',
  ENDED: 'ended'
};

// Candidate types
export const CANDIDATE_TYPES = {
  HOST: 'host',
  SRFLX: 'srflx',
  RELAY: 'relay'
};

// Mock users data
export const mockUsers = [
  {
    id: 'user-1',
    name: 'Alice',
    isLocal: true,
    isMuted: false,
    isCameraOff: false,
    connectionState: CONNECTION_STATES.CONNECTED,
    iceState: ICE_STATES.CONNECTED
  },
  {
    id: 'user-2',
    name: 'Bob',
    isLocal: false,
    isMuted: false,
    isCameraOff: false,
    connectionState: CONNECTION_STATES.CONNECTED,
    iceState: ICE_STATES.CONNECTED
  },
  {
    id: 'user-3',
    name: 'Charlie',
    isLocal: false,
    isMuted: true,
    isCameraOff: false,
    connectionState: CONNECTION_STATES.CONNECTED,
    iceState: ICE_STATES.CONNECTED
  },
  {
    id: 'user-4',
    name: 'David',
    isLocal: false,
    isMuted: false,
    isCameraOff: true,
    connectionState: CONNECTION_STATES.CONNECTING,
    iceState: ICE_STATES.CHECKING
  },
  {
    id: 'user-5',
    name: 'Eve',
    isLocal: false,
    isMuted: false,
    isCameraOff: false,
    connectionState: CONNECTION_STATES.CONNECTED,
    iceState: ICE_STATES.CONNECTED
  },
  {
    id: 'user-6',
    name: 'Frank',
    isLocal: false,
    isMuted: true,
    isCameraOff: true,
    connectionState: CONNECTION_STATES.CONNECTED,
    iceState: ICE_STATES.CONNECTED
  }
];

// Mock rooms data
export const mockRooms = [
  {
    id: 'room-123',
    name: 'Team Meeting',
    createdAt: '2026-02-01T10:30:00Z',
    members: ['user-1', 'user-2', 'user-3']
  },
  {
    id: 'room-456',
    name: 'Project Discussion',
    createdAt: '2026-02-01T11:00:00Z',
    members: ['user-1', 'user-4', 'user-5', 'user-6']
  }
];

// Mock WebRTC stats
export const mockWebRTCStats = {
  callStart: '10:32:01',
  duration: '00:15:23',
  iceState: ICE_STATES.CONNECTED,
  connectionState: CONNECTION_STATES.CONNECTED,
  candidateType: CANDIDATE_TYPES.RELAY,
  localCandidate: {
    type: 'relay',
    protocol: 'udp',
    address: '192.168.1.100',
    port: 54321
  },
  remoteCandidate: {
    type: 'relay',
    protocol: 'udp',
    address: '203.0.113.50',
    port: 12345
  },
  bytesReceived: 15234567,
  bytesSent: 12456789,
  packetsReceived: 125678,
  packetsSent: 98765,
  packetsLost: 23,
  jitter: 0.012,
  roundTripTime: 45,
  availableOutgoingBitrate: 2500000,
  availableIncomingBitrate: 2800000,
  videoResolution: {
    width: 1280,
    height: 720,
    frameRate: 30
  },
  audioCodec: 'opus',
  videoCodec: 'VP8'
};

// Generate random room ID
export const generateRoomId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const segments = [];
  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 3; j++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }
  return segments.join('-');
};

// Get status color based on connection state
export const getStatusColor = (state) => {
  switch (state) {
    case CONNECTION_STATES.NEW:
      return 'bg-gray-500';
    case CONNECTION_STATES.CONNECTING:
      return 'bg-meet-yellow';
    case CONNECTION_STATES.CONNECTED:
      return 'bg-meet-green';
    case CONNECTION_STATES.FAILED:
    case CONNECTION_STATES.DISCONNECTED:
    case CONNECTION_STATES.CLOSED:
      return 'bg-meet-red';
    default:
      return 'bg-gray-500';
  }
};

// Get status text
export const getStatusText = (state) => {
  switch (state) {
    case CONNECTION_STATES.NEW:
      return 'New';
    case CONNECTION_STATES.CONNECTING:
      return 'Connecting';
    case CONNECTION_STATES.CONNECTED:
      return 'Connected';
    case CONNECTION_STATES.FAILED:
      return 'Failed';
    case CONNECTION_STATES.DISCONNECTED:
      return 'Disconnected';
    case CONNECTION_STATES.CLOSED:
      return 'Closed';
    default:
      return 'Unknown';
  }
};

// Format bytes to human readable
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format bitrate
export const formatBitrate = (bitrate) => {
  if (bitrate >= 1000000) {
    return (bitrate / 1000000).toFixed(2) + ' Mbps';
  }
  return (bitrate / 1000).toFixed(0) + ' Kbps';
};
