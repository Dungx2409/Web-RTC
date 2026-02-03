/**
 * WebRTC Service
 * Handles all WebRTC related operations including:
 * - ICE servers configuration (STUN/TURN)
 * - Peer connections management (mesh topology)
 * - Media stream handling
 * - Connection statistics
 * - Automatic TURN fallback
 */

import { config } from './config';

class WebRTCService {
  constructor() {
    // Peer connections: peerId -> RTCPeerConnection
    this.peerConnections = new Map();
    
    // Remote streams: peerId -> MediaStream
    this.remoteStreams = new Map();
    
    // Local stream
    this.localStream = null;
    
    // Stats tracking
    this.stats = new Map(); // peerId -> stats object
    this.callStartTime = null;
    
    // Callbacks
    this.onRemoteStream = null;
    this.onRemoteStreamRemoved = null;
    this.onConnectionStateChange = null;
    this.onIceStateChange = null;
    this.onStatsUpdate = null;
    this.onTurnFallback = null;
    
    // Stats interval
    this.statsInterval = null;
    
    // P2P timeout tracking
    this.p2pTimeouts = new Map();
    this.P2P_TIMEOUT = config.P2P_TIMEOUT_MS;
  }

  /**
   * Get ICE servers configuration
   */
  getIceServers() {
    return config.iceServers;
  }

  /**
   * Get local media stream
   */
  async getLocalStream(constraints = null) {
    const defaultConstraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    };

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(
        constraints || defaultConstraints
      );
      console.log('📹 Local stream acquired');
      return this.localStream;
    } catch (error) {
      console.error('Failed to get local stream:', error);
      throw error;
    }
  }

  /**
   * Stop local stream
   */
  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
      console.log('📹 Local stream stopped');
    }
  }

  /**
   * Toggle local audio
   */
  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
      return enabled;
    }
    return false;
  }

  /**
   * Toggle local video
   */
  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
      return enabled;
    }
    return false;
  }

  /**
   * Create a new peer connection
   */
  createPeerConnection(peerId, peerName) {
    if (this.peerConnections.has(peerId)) {
      console.warn(`Peer connection already exists for ${peerId}`);
      return this.peerConnections.get(peerId);
    }

    console.log(`🔗 Creating peer connection to ${peerName} (${peerId})`);

    const pc = new RTCPeerConnection({
      iceServers: this.getIceServers()
    });

    // Add local tracks to connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log(`📺 Received remote track from ${peerName}`);
      const [remoteStream] = event.streams;
      this.remoteStreams.set(peerId, remoteStream);
      
      if (this.onRemoteStream) {
        this.onRemoteStream(peerId, peerName, remoteStream);
      }
    };

    // Connection state change
    pc.onconnectionstatechange = () => {
      console.log(`🔌 Connection state [${peerName}]: ${pc.connectionState}`);
      
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(peerId, peerName, pc.connectionState);
      }

      // Clear P2P timeout if connected
      if (pc.connectionState === 'connected') {
        this.clearP2PTimeout(peerId);
      }

      // Clean up on failed/closed
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.handleConnectionFailed(peerId, peerName);
      }
    };

    // ICE connection state change
    pc.oniceconnectionstatechange = () => {
      console.log(`🧊 ICE state [${peerName}]: ${pc.iceConnectionState}`);
      
      if (this.onIceStateChange) {
        this.onIceStateChange(peerId, peerName, pc.iceConnectionState);
      }

      // Check for TURN fallback
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        this.checkCandidateType(peerId, peerName, pc);
      }
    };

    // ICE gathering state change
    pc.onicegatheringstatechange = () => {
      console.log(`🧊 ICE gathering state [${peerName}]: ${pc.iceGatheringState}`);
    };

    this.peerConnections.set(peerId, pc);
    
    // Start P2P timeout for TURN fallback notification
    this.startP2PTimeout(peerId, peerName);
    
    return pc;
  }

  /**
   * Start P2P timeout - notify if taking too long (likely needs TURN)
   */
  startP2PTimeout(peerId, peerName) {
    const timeout = setTimeout(() => {
      const pc = this.peerConnections.get(peerId);
      if (pc && pc.connectionState !== 'connected') {
        console.log(`⏰ P2P timeout for ${peerName}, likely using TURN relay`);
        if (this.onTurnFallback) {
          this.onTurnFallback(peerId, peerName);
        }
      }
    }, this.P2P_TIMEOUT);
    
    this.p2pTimeouts.set(peerId, timeout);
  }

  /**
   * Clear P2P timeout
   */
  clearP2PTimeout(peerId) {
    const timeout = this.p2pTimeouts.get(peerId);
    if (timeout) {
      clearTimeout(timeout);
      this.p2pTimeouts.delete(peerId);
    }
  }

  /**
   * Check what type of ICE candidate was selected (host/srflx/relay)
   */
  async checkCandidateType(peerId, peerName, pc) {
    try {
      const stats = await pc.getStats();
      let candidateType = 'unknown';
      let localCandidate = null;
      let remoteCandidate = null;

      stats.forEach(report => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          const localCandidateId = report.localCandidateId;
          const remoteCandidateId = report.remoteCandidateId;

          stats.forEach(stat => {
            if (stat.id === localCandidateId) {
              localCandidate = stat;
              candidateType = stat.candidateType;
            }
            if (stat.id === remoteCandidateId) {
              remoteCandidate = stat;
            }
          });
        }
      });

      console.log(`📊 Candidate type for ${peerName}: ${candidateType}`);
      
      // Store stats
      this.stats.set(peerId, {
        candidateType,
        localCandidate,
        remoteCandidate,
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState
      });

      // Notify if using relay (TURN)
      if (candidateType === 'relay') {
        console.log(`🔄 ${peerName} is connected via TURN relay`);
        if (this.onStatsUpdate) {
          this.onStatsUpdate(peerId, { candidateType, isRelay: true });
        }
      }

      return { candidateType, localCandidate, remoteCandidate };
    } catch (error) {
      console.error('Failed to get candidate stats:', error);
      return { candidateType: 'unknown' };
    }
  }

  /**
   * Handle connection failure
   */
  handleConnectionFailed(peerId, peerName) {
    this.clearP2PTimeout(peerId);
    this.remoteStreams.delete(peerId);
    
    if (this.onRemoteStreamRemoved) {
      this.onRemoteStreamRemoved(peerId, peerName);
    }
  }

  /**
   * Create offer for a peer
   */
  async createOffer(peerId) {
    const pc = this.peerConnections.get(peerId);
    if (!pc) {
      console.error(`No peer connection for ${peerId}`);
      return null;
    }

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);
      console.log(`📤 Created offer for ${peerId}`);
      return offer;
    } catch (error) {
      console.error(`Failed to create offer for ${peerId}:`, error);
      throw error;
    }
  }

  /**
   * Handle received offer
   */
  async handleOffer(peerId, peerName, offer) {
    let pc = this.peerConnections.get(peerId);
    if (!pc) {
      pc = this.createPeerConnection(peerId, peerName);
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      console.log(`📥 Set remote offer from ${peerName}`);
      return pc;
    } catch (error) {
      console.error(`Failed to handle offer from ${peerId}:`, error);
      throw error;
    }
  }

  /**
   * Create answer for a peer
   */
  async createAnswer(peerId) {
    const pc = this.peerConnections.get(peerId);
    if (!pc) {
      console.error(`No peer connection for ${peerId}`);
      return null;
    }

    try {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log(`📤 Created answer for ${peerId}`);
      return answer;
    } catch (error) {
      console.error(`Failed to create answer for ${peerId}:`, error);
      throw error;
    }
  }

  /**
   * Handle received answer
   */
  async handleAnswer(peerId, answer) {
    const pc = this.peerConnections.get(peerId);
    if (!pc) {
      console.error(`No peer connection for ${peerId}`);
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log(`📥 Set remote answer from ${peerId}`);
    } catch (error) {
      console.error(`Failed to handle answer from ${peerId}:`, error);
      throw error;
    }
  }

  /**
   * Handle received ICE candidate
   */
  async handleCandidate(peerId, candidate) {
    const pc = this.peerConnections.get(peerId);
    if (!pc) {
      console.error(`No peer connection for ${peerId}`);
      return;
    }

    try {
      if (candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error(`Failed to add ICE candidate from ${peerId}:`, error);
    }
  }

  /**
   * Get ICE candidates for a peer
   */
  onIceCandidate(peerId, callback) {
    const pc = this.peerConnections.get(peerId);
    if (!pc) return;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        callback(event.candidate);
      }
    };
  }

  /**
   * Close a specific peer connection
   */
  closePeerConnection(peerId) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
      this.remoteStreams.delete(peerId);
      this.stats.delete(peerId);
      this.clearP2PTimeout(peerId);
      console.log(`🔌 Closed peer connection: ${peerId}`);
    }
  }

  /**
   * Close all peer connections
   */
  closeAllConnections() {
    this.peerConnections.forEach((pc, peerId) => {
      pc.close();
      this.clearP2PTimeout(peerId);
    });
    this.peerConnections.clear();
    this.remoteStreams.clear();
    this.stats.clear();
    this.stopStatsCollection();
    console.log('🔌 Closed all peer connections');
  }

  /**
   * Start collecting stats for all connections
   */
  startStatsCollection(interval = 2000) {
    this.callStartTime = new Date();
    
    this.statsInterval = setInterval(async () => {
      for (const [peerId, pc] of this.peerConnections) {
        try {
          const stats = await this.getDetailedStats(pc);
          const existingStats = this.stats.get(peerId) || {};
          this.stats.set(peerId, { ...existingStats, ...stats });
          
          if (this.onStatsUpdate) {
            this.onStatsUpdate(peerId, stats);
          }
        } catch (error) {
          console.error(`Failed to get stats for ${peerId}:`, error);
        }
      }
    }, interval);
  }

  /**
   * Stop collecting stats
   */
  stopStatsCollection() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  /**
   * Get detailed stats from a peer connection
   */
  async getDetailedStats(pc) {
    const stats = await pc.getStats();
    const result = {
      bytesReceived: 0,
      bytesSent: 0,
      packetsReceived: 0,
      packetsSent: 0,
      packetsLost: 0,
      jitter: 0,
      roundTripTime: 0,
      availableOutgoingBitrate: 0,
      availableIncomingBitrate: 0,
      videoResolution: { width: 0, height: 0, frameRate: 0 },
      audioCodec: '',
      videoCodec: '',
      candidateType: 'unknown',
      localCandidate: null,
      remoteCandidate: null,
      callStart: this.callStartTime?.toLocaleTimeString() || '',
      duration: this.getCallDuration()
    };

    stats.forEach(report => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        result.bytesReceived += report.bytesReceived || 0;
        result.packetsReceived += report.packetsReceived || 0;
        result.packetsLost += report.packetsLost || 0;
        result.jitter = report.jitter || 0;
        
        if (report.frameWidth && report.frameHeight) {
          result.videoResolution = {
            width: report.frameWidth,
            height: report.frameHeight,
            frameRate: report.framesPerSecond || 0
          };
        }
      }
      
      if (report.type === 'outbound-rtp' && report.kind === 'video') {
        result.bytesSent += report.bytesSent || 0;
        result.packetsSent += report.packetsSent || 0;
      }

      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        result.roundTripTime = (report.currentRoundTripTime || 0) * 1000;
        result.availableOutgoingBitrate = report.availableOutgoingBitrate || 0;
        result.availableIncomingBitrate = report.availableIncomingBitrate || 0;
        
        // Get candidate details
        stats.forEach(stat => {
          if (stat.id === report.localCandidateId) {
            result.localCandidate = {
              type: stat.candidateType,
              protocol: stat.protocol,
              address: stat.address || stat.ip,
              port: stat.port
            };
            result.candidateType = stat.candidateType;
          }
          if (stat.id === report.remoteCandidateId) {
            result.remoteCandidate = {
              type: stat.candidateType,
              protocol: stat.protocol,
              address: stat.address || stat.ip,
              port: stat.port
            };
          }
        });
      }

      if (report.type === 'codec') {
        if (report.mimeType?.includes('audio')) {
          result.audioCodec = report.mimeType.split('/')[1] || '';
        }
        if (report.mimeType?.includes('video')) {
          result.videoCodec = report.mimeType.split('/')[1] || '';
        }
      }
    });

    return result;
  }

  /**
   * Get call duration
   */
  getCallDuration() {
    if (!this.callStartTime) return '00:00:00';
    
    const now = new Date();
    const diff = now - this.callStartTime;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get aggregated stats for all connections
   */
  getAllStats() {
    const allStats = {};
    this.stats.forEach((stats, peerId) => {
      allStats[peerId] = stats;
    });
    return allStats;
  }

  /**
   * Get connection count
   */
  getConnectionCount() {
    return this.peerConnections.size;
  }

  /**
   * Check if all connections are stable
   */
  areAllConnectionsStable() {
    for (const pc of this.peerConnections.values()) {
      if (pc.connectionState !== 'connected') {
        return false;
      }
    }
    return true;
  }
}

// Singleton instance
export const webRTCService = new WebRTCService();
export default webRTCService;
