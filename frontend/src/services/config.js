/**
 * Configuration for WebRTC Application
 * All configurable values should be here - no hardcoded IPs in code
 */

// Environment-based configuration
const getEnvVar = (key, defaultValue) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  return defaultValue;
};

export const config = {
  // Signaling server URL
  SIGNALING_URL: getEnvVar('VITE_SIGNALING_URL', 'ws://localhost:3001'),
  
  // P2P timeout before TURN fallback notification (ms)
  P2P_TIMEOUT_MS: parseInt(getEnvVar('VITE_P2P_TIMEOUT', '10000')),
  
  // ICE servers configuration
  iceServers: [
    // STUN server (Google's public STUN)
    {
      urls: getEnvVar('VITE_STUN_URL', 'stun:stun.l.google.com:19302')
    },
    // Additional STUN servers for redundancy
    {
      urls: 'stun:stun1.l.google.com:19302'
    },
    {
      urls: 'stun:stun2.l.google.com:19302'
    },
    // TURN server (UDP)
    {
      urls: getEnvVar('VITE_TURN_UDP_URL', 'turn:localhost:3478?transport=udp'),
      username: getEnvVar('VITE_TURN_USERNAME', 'webrtc'),
      credential: getEnvVar('VITE_TURN_PASSWORD', 'webrtc123')
    },
    // TURN server (TCP)
    {
      urls: getEnvVar('VITE_TURN_TCP_URL', 'turn:localhost:3478?transport=tcp'),
      username: getEnvVar('VITE_TURN_USERNAME', 'webrtc'),
      credential: getEnvVar('VITE_TURN_PASSWORD', 'webrtc123')
    },
    // TURN server (TLS - secure)
    {
      urls: getEnvVar('VITE_TURN_TLS_URL', 'turns:localhost:5349?transport=tcp'),
      username: getEnvVar('VITE_TURN_USERNAME', 'webrtc'),
      credential: getEnvVar('VITE_TURN_PASSWORD', 'webrtc123')
    }
  ],
  
  // Media constraints
  mediaConstraints: {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 }
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  },
  
  // Stats collection interval (ms)
  STATS_INTERVAL_MS: 2000,
  
  // Reconnection settings
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY_MS: 2000
};

export default config;
