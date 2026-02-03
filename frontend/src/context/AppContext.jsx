/**
 * WebRTC Context - Real Implementation
 * Manages WebRTC peer connections, signaling, and call state
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { APP_STATES, generateRoomId } from '../data/mockData';
import { webRTCService } from '../services/webrtc';
import { signalingService } from '../services/signaling';
import { config } from '../services/config';

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
    id: null,
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
  
  // Local stream
  const [localStream, setLocalStream] = useState(null);
  
  // Connection status
  const [connectionState, setConnectionState] = useState('new');
  const [iceState, setIceState] = useState('new');
  
  // WebRTC stats
  const [callStats, setCallStats] = useState(null);
  const [callDuration, setCallDuration] = useState('00:00:00');
  
  // UI states
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Signaling connected state
  const [signalingConnected, setSignalingConnected] = useState(false);
  
  // Call duration timer
  const callTimerRef = useRef(null);
  const callStartTimeRef = useRef(null);
  
  // Refs for callbacks to access latest state
  const appStateRef = useRef(appState);
  const currentUserRef = useRef(currentUser);
  const roomIdRef = useRef(roomId);
  
  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);
  
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);
  
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  // Start call timer
  const startCallTimer = useCallback(() => {
    callStartTimeRef.current = new Date();
    callTimerRef.current = setInterval(() => {
      const now = new Date();
      const diff = now - callStartTimeRef.current;
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setCallDuration(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);
  }, []);

  // Stop call timer
  const stopCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    callStartTimeRef.current = null;
    setCallDuration('00:00:00');
  }, []);

  // Cleanup call
  const cleanupCall = useCallback(() => {
    webRTCService.closeAllConnections();
    webRTCService.stopLocalStream();
    stopCallTimer();
    setLocalStream(null);
    setParticipants([]);
    setConnectionState('new');
    setIceState('new');
    setCallStats(null);
  }, [stopCallTimer]);

  // Update overall connection state
  const updateOverallConnectionState = useCallback(() => {
    const states = [];
    webRTCService.peerConnections.forEach(pc => {
      states.push(pc.connectionState);
    });
    
    if (states.length === 0) {
      setConnectionState('new');
    } else if (states.every(s => s === 'connected')) {
      setConnectionState('connected');
    } else if (states.some(s => s === 'failed')) {
      setConnectionState('failed');
    } else if (states.some(s => s === 'connecting')) {
      setConnectionState('connecting');
    } else {
      setConnectionState('new');
    }
  }, []);

  // Update overall ICE state
  const updateOverallIceState = useCallback(() => {
    const states = [];
    webRTCService.peerConnections.forEach(pc => {
      states.push(pc.iceConnectionState);
    });
    
    if (states.length === 0) {
      setIceState('new');
    } else if (states.every(s => s === 'connected' || s === 'completed')) {
      setIceState('connected');
    } else if (states.some(s => s === 'failed')) {
      setIceState('failed');
    } else if (states.some(s => s === 'checking')) {
      setIceState('checking');
    } else {
      setIceState('new');
    }
  }, []);

  // Initiate call to a specific peer
  const initiateCallToPeer = useCallback(async (targetRoomId, peerId, peerName) => {
    console.log(`📞 Initiating call to ${peerName}`);
    
    // Create peer connection
    webRTCService.createPeerConnection(peerId, peerName);
    
    // Set up ICE candidate handler
    webRTCService.onIceCandidate(peerId, (candidate) => {
      signalingService.sendCandidate(targetRoomId, peerId, candidate);
    });
    
    // Create and send offer
    const offer = await webRTCService.createOffer(peerId);
    signalingService.sendOffer(targetRoomId, peerId, offer);
  }, []);

  // Handle receive offer
  const handleReceiveOffer = useCallback(async (msg) => {
    const { sender, senderName, roomId: msgRoomId, offer } = msg;
    
    console.log(`📥 Received offer from ${senderName}`);
    
    // Get local stream if not already
    if (!webRTCService.localStream) {
      try {
        const stream = await webRTCService.getLocalStream();
        setLocalStream(stream);
        setParticipants(prev => {
          const localExists = prev.find(p => p.isLocal);
          if (!localExists) {
            return [{
              id: signalingService.getClientId(),
              name: currentUserRef.current.name,
              isLocal: true,
              stream,
              connectionState: 'connected',
              iceState: 'connected',
              isMuted: currentUserRef.current.isMuted,
              isCameraOff: currentUserRef.current.isCameraOff
            }, ...prev];
          }
          return prev;
        });
      } catch (error) {
        console.error('Failed to get local stream:', error);
        return;
      }
    }
    
    // Handle offer and create answer
    await webRTCService.handleOffer(sender, senderName, offer);
    
    // Set up ICE candidate handler
    webRTCService.onIceCandidate(sender, (candidate) => {
      signalingService.sendCandidate(msgRoomId, sender, candidate);
    });
    
    // Create and send answer
    const answer = await webRTCService.createAnswer(sender);
    signalingService.sendAnswer(msgRoomId, sender, answer);
    
    // Switch to calling state if not already
    if (appStateRef.current !== APP_STATES.CALLING) {
      setAppState(APP_STATES.CALLING);
      startCallTimer();
      webRTCService.startStatsCollection(config.STATS_INTERVAL_MS);
    }
  }, [startCallTimer]);

  // Initialize signaling connection
  useEffect(() => {
    const initializeSignaling = async () => {
      try {
        await signalingService.connect();
        setSignalingConnected(true);
        
        // Update client ID when received
        signalingService.on('connected', (msg) => {
          setCurrentUser(prev => ({ ...prev, id: msg.clientId }));
        });
        
        // Room created
        signalingService.on('roomCreated', (msg) => {
          setRoomId(msg.roomId);
          setIsHost(msg.isHost);
          setRoomMembers(msg.members.map(m => ({
            ...m,
            isLocal: m.id === signalingService.getClientId()
          })));
          setAppState(APP_STATES.IN_ROOM);
        });
        
        // Room joined
        signalingService.on('roomJoined', (msg) => {
          setRoomId(msg.roomId);
          setIsHost(msg.isHost);
          setRoomMembers(msg.members.map(m => ({
            ...m,
            isLocal: m.id === signalingService.getClientId()
          })));
          setAppState(APP_STATES.IN_ROOM);
          
          // If call is already active, we'll receive offers from existing members
        });
        
        // Room members updated
        signalingService.on('roomMembers', (msg) => {
          setRoomMembers(msg.members.map(m => ({
            ...m,
            isLocal: m.id === signalingService.getClientId()
          })));
        });
        
        // New member joined
        signalingService.on('memberJoined', (msg) => {
          setNotification({
            type: 'info',
            message: `${msg.member.name} joined the room`
          });
          setTimeout(() => setNotification(null), 3000);
        });
        
        // Member left
        signalingService.on('memberLeft', (msg) => {
          // Close peer connection to this member
          webRTCService.closePeerConnection(msg.memberId);
          
          // Remove from participants
          setParticipants(prev => prev.filter(p => p.id !== msg.memberId));
          
          setNotification({
            type: 'warning',
            message: `${msg.name} left the room`
          });
          setTimeout(() => setNotification(null), 3000);
        });
        
        // Left room confirmation
        signalingService.on('leftRoom', () => {
          setAppState(APP_STATES.IDLE);
        });
        
        // Call started by someone
        signalingService.on('callStarted', (msg) => {
          if (msg.initiator !== signalingService.getClientId()) {
            setNotification({
              type: 'info',
              message: `${msg.initiatorName} started a call`
            });
            setTimeout(() => setNotification(null), 3000);
          }
        });
        
        // Receive offer
        signalingService.on('offer', async (msg) => {
          await handleReceiveOffer(msg);
        });
        
        // Receive answer
        signalingService.on('answer', async (msg) => {
          await webRTCService.handleAnswer(msg.sender, msg.answer);
        });
        
        // Receive ICE candidate
        signalingService.on('candidate', async (msg) => {
          await webRTCService.handleCandidate(msg.sender, msg.candidate);
        });
        
        // Call ended
        signalingService.on('callEnded', (msg) => {
          setNotification({
            type: 'info',
            message: `Call ended by ${msg.endedByName}`
          });
          setTimeout(() => setNotification(null), 3000);
          
          webRTCService.closeAllConnections();
          webRTCService.stopLocalStream();
          setLocalStream(null);
          setParticipants([]);
          setConnectionState('new');
          setIceState('new');
          setCallStats(null);
          
          setAppState(APP_STATES.IN_ROOM);
        });
        
        // Handle errors
        signalingService.on('error', (msg) => {
          setNotification({
            type: 'error',
            message: msg.message
          });
          setTimeout(() => setNotification(null), 3000);
        });
        
      } catch (error) {
        console.error('Failed to connect to signaling server:', error);
        setNotification({
          type: 'error',
          message: 'Failed to connect to server. Please check your connection.'
        });
      }
    };

    initializeSignaling();
    
    return () => {
      signalingService.disconnect();
      webRTCService.closeAllConnections();
      webRTCService.stopLocalStream();
    };
  }, [handleReceiveOffer]);

  // Setup WebRTC callbacks
  useEffect(() => {
    // Remote stream received
    webRTCService.onRemoteStream = (peerId, peerName, stream) => {
      setParticipants(prev => {
        const existing = prev.find(p => p.id === peerId);
        if (existing) {
          return prev.map(p => 
            p.id === peerId 
              ? { ...p, stream, connectionState: 'connected' }
              : p
          );
        }
        return [...prev, {
          id: peerId,
          name: peerName,
          isLocal: false,
          stream,
          connectionState: 'connected',
          iceState: 'connected',
          isMuted: false,
          isCameraOff: false
        }];
      });
    };

    // Remote stream removed
    webRTCService.onRemoteStreamRemoved = (peerId) => {
      setParticipants(prev => prev.filter(p => p.id !== peerId));
    };

    // Connection state change
    webRTCService.onConnectionStateChange = (peerId, peerName, state) => {
      setParticipants(prev => prev.map(p => 
        p.id === peerId ? { ...p, connectionState: state } : p
      ));
      
      // Update overall connection state
      updateOverallConnectionState();
    };

    // ICE state change
    webRTCService.onIceStateChange = (peerId, peerName, state) => {
      setParticipants(prev => prev.map(p => 
        p.id === peerId ? { ...p, iceState: state } : p
      ));
      
      // Update overall ICE state
      updateOverallIceState();
    };

    // TURN fallback notification
    webRTCService.onTurnFallback = (peerId, peerName) => {
      setNotification({
        type: 'warning',
        message: `P2P failed with ${peerName}, trying TURN relay...`
      });
      setTimeout(() => setNotification(null), 3000);
    };

    // Stats update
    webRTCService.onStatsUpdate = (peerId, stats) => {
      setCallStats(prev => ({
        ...prev,
        [peerId]: stats
      }));
      
      // Check if connected via relay
      if (stats.isRelay) {
        setNotification({
          type: 'success',
          message: `Connected via TURN relay`
        });
        setTimeout(() => setNotification(null), 3000);
      }
    };
  }, [updateOverallConnectionState, updateOverallIceState]);

  // Create room
  const createRoom = useCallback(async (nickname) => {
    const newRoomId = generateRoomId();
    setCurrentUser(prev => ({ ...prev, name: nickname }));
    signalingService.register(nickname);
    signalingService.createRoom(newRoomId, nickname);
  }, []);

  // Join room
  const joinRoom = useCallback(async (nickname, roomIdInput) => {
    setCurrentUser(prev => ({ ...prev, name: nickname }));
    signalingService.register(nickname);
    signalingService.joinRoom(roomIdInput, nickname);
  }, []);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (roomIdRef.current) {
      signalingService.leaveRoom(roomIdRef.current);
    }
    cleanupCall();
    setRoomId('');
    setRoomMembers([]);
    setIsHost(false);
    setAppState(APP_STATES.IDLE);
  }, [cleanupCall]);

  // Start group call
  const startGroupCall = useCallback(async () => {
    try {
      // Get local media stream
      const stream = await webRTCService.getLocalStream();
      setLocalStream(stream);
      
      // Add local participant
      const localParticipant = {
        id: signalingService.getClientId(),
        name: currentUserRef.current.name,
        isLocal: true,
        stream,
        connectionState: 'connected',
        iceState: 'connected',
        isMuted: currentUserRef.current.isMuted,
        isCameraOff: currentUserRef.current.isCameraOff
      };
      setParticipants([localParticipant]);
      
      // Switch to calling state
      setAppState(APP_STATES.CALLING);
      setConnectionState('connecting');
      setIceState('checking');
      
      // Notify server
      signalingService.startCall(roomIdRef.current);
      
      // Start call timer and stats collection
      startCallTimer();
      webRTCService.startStatsCollection(config.STATS_INTERVAL_MS);
      
      // Create peer connections to all room members
      const myId = signalingService.getClientId();
      const currentRoomMembers = roomMembers;
      const currentRoomId = roomIdRef.current;
      const otherMembers = currentRoomMembers.filter(m => m.id !== myId);
      
      for (const member of otherMembers) {
        await initiateCallToPeer(currentRoomId, member.id, member.name);
      }
      
    } catch (error) {
      console.error('Failed to start group call:', error);
      setNotification({
        type: 'error',
        message: 'Failed to access camera/microphone. Please check permissions.'
      });
      setTimeout(() => setNotification(null), 5000);
    }
  }, [roomMembers, initiateCallToPeer, startCallTimer]);

  // End call
  const endCall = useCallback(() => {
    // Notify server
    if (roomIdRef.current) {
      signalingService.endCall(roomIdRef.current);
    }
    
    // Log call stats to console
    console.log('📊 Call ended. Final stats:', webRTCService.getAllStats());
    console.log('📊 Call start time:', callStartTimeRef.current?.toISOString());
    console.log('📊 Call end time:', new Date().toISOString());
    console.log('📊 Call duration:', callDuration);
    
    // Cleanup
    cleanupCall();
    
    // Show ended screen briefly
    setAppState(APP_STATES.ENDED);
    
    // Return to room after delay
    setTimeout(() => {
      setAppState(APP_STATES.IN_ROOM);
    }, 2000);
  }, [callDuration, cleanupCall]);

  // Toggle mic
  const toggleMic = useCallback(() => {
    const newMuted = !currentUserRef.current.isMuted;
    setCurrentUser(prev => ({ ...prev, isMuted: newMuted }));
    webRTCService.toggleAudio(!newMuted);
    
    setParticipants(prev => prev.map(p => 
      p.isLocal ? { ...p, isMuted: newMuted } : p
    ));
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    const newCameraOff = !currentUserRef.current.isCameraOff;
    setCurrentUser(prev => ({ ...prev, isCameraOff: newCameraOff }));
    webRTCService.toggleVideo(!newCameraOff);
    
    setParticipants(prev => prev.map(p => 
      p.isLocal ? { ...p, isCameraOff: newCameraOff } : p
    ));
  }, []);

  // Get aggregated stats
  const getAggregatedStats = useCallback(() => {
    if (!callStats || Object.keys(callStats).length === 0) {
      return null;
    }
    
    // Aggregate stats from all peer connections
    const stats = Object.values(callStats)[0] || {};
    return {
      callStart: stats.callStart || callStartTimeRef.current?.toLocaleTimeString() || '',
      duration: callDuration,
      iceState: iceState,
      connectionState: connectionState,
      candidateType: stats.candidateType || 'unknown',
      localCandidate: stats.localCandidate || { type: 'unknown', protocol: 'unknown', address: '', port: '' },
      remoteCandidate: stats.remoteCandidate || { type: 'unknown', protocol: 'unknown', address: '', port: '' },
      bytesReceived: stats.bytesReceived || 0,
      bytesSent: stats.bytesSent || 0,
      packetsReceived: stats.packetsReceived || 0,
      packetsSent: stats.packetsSent || 0,
      packetsLost: stats.packetsLost || 0,
      jitter: stats.jitter || 0,
      roundTripTime: stats.roundTripTime || 0,
      availableOutgoingBitrate: stats.availableOutgoingBitrate || 0,
      availableIncomingBitrate: stats.availableIncomingBitrate || 0,
      videoResolution: stats.videoResolution || { width: 0, height: 0, frameRate: 0 },
      audioCodec: stats.audioCodec || 'unknown',
      videoCodec: stats.videoCodec || 'unknown'
    };
  }, [callStats, callDuration, iceState, connectionState]);

  const value = {
    // State
    appState,
    currentUser,
    roomId,
    roomMembers,
    participants,
    localStream,
    connectionState,
    iceState,
    callStats,
    callDuration,
    showStats,
    showSettings,
    notification,
    isHost,
    signalingConnected,
    
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
    getAggregatedStats,
    
    // Services (for advanced use)
    webRTCService,
    signalingService
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
