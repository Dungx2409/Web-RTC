/**
 * WebSocket Signaling Service
 * Handles communication with the signaling server
 */

import { config } from './config';

class SignalingService {
  constructor() {
    this.ws = null;
    this.clientId = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    
    // Message handlers
    this.handlers = new Map();
    
    // Pending messages queue (for when connection is not ready)
    this.pendingMessages = [];
    
    // Callbacks
    this.onConnected = null;
    this.onDisconnected = null;
    this.onError = null;
    this.onReconnecting = null;
  }

  /**
   * Connect to signaling server
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      console.log(`🔌 Connecting to signaling server: ${config.SIGNALING_URL}`);
      
      try {
        this.ws = new WebSocket(config.SIGNALING_URL);
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        reject(error);
        return;
      }

      this.ws.onopen = () => {
        console.log('✅ Connected to signaling server');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Send pending messages
        this.flushPendingMessages();
        
        if (this.onConnected) {
          this.onConnected();
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
          
          // Resolve on connected message
          if (message.type === 'connected') {
            this.clientId = message.clientId;
            resolve();
          }
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`🔌 Disconnected from signaling server (code: ${event.code})`);
        this.isConnected = false;
        
        if (this.onDisconnected) {
          this.onDisconnected(event);
        }
        
        // Attempt reconnect if not intentional close
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (this.onError) {
          this.onError(error);
        }
        reject(error);
      };
    });
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    if (this.onReconnecting) {
      this.onReconnecting(this.reconnectAttempts);
    }
    
    setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  /**
   * Disconnect from signaling server
   */
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
      this.isConnected = false;
      this.clientId = null;
    }
  }

  /**
   * Send message to server
   */
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, queueing message');
      this.pendingMessages.push(message);
    }
  }

  /**
   * Flush pending messages
   */
  flushPendingMessages() {
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      this.send(message);
    }
  }

  /**
   * Register message handler
   */
  on(type, handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type).push(handler);
  }

  /**
   * Remove message handler
   */
  off(type, handler) {
    if (this.handlers.has(type)) {
      const handlers = this.handlers.get(type);
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Handle incoming message
   */
  handleMessage(message) {
    console.log(`📩 Received: ${message.type}`, message);
    
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
    
    // Also emit to 'all' handlers
    const allHandlers = this.handlers.get('*');
    if (allHandlers) {
      allHandlers.forEach(handler => handler(message));
    }
  }

  // === Signaling Protocol Methods ===

  /**
   * Register user with name
   */
  register(name) {
    this.send({
      type: 'register',
      name
    });
  }

  /**
   * Create a new room
   */
  createRoom(roomId, name) {
    this.send({
      type: 'createRoom',
      roomId,
      name
    });
  }

  /**
   * Join existing room
   */
  joinRoom(roomId, name) {
    this.send({
      type: 'joinRoom',
      roomId,
      name
    });
  }

  /**
   * Leave room
   */
  leaveRoom(roomId) {
    this.send({
      type: 'leaveRoom',
      roomId,
      sender: this.clientId
    });
  }

  /**
   * Start group call in room
   */
  startCall(roomId) {
    this.send({
      type: 'startCall',
      roomId,
      sender: this.clientId
    });
  }

  /**
   * Send offer to peer
   */
  sendOffer(roomId, target, offer) {
    this.send({
      type: 'offer',
      roomId,
      sender: this.clientId,
      target,
      offer
    });
  }

  /**
   * Send answer to peer
   */
  sendAnswer(roomId, target, answer) {
    this.send({
      type: 'answer',
      roomId,
      sender: this.clientId,
      target,
      answer
    });
  }

  /**
   * Send ICE candidate to peer
   */
  sendCandidate(roomId, target, candidate) {
    this.send({
      type: 'candidate',
      roomId,
      sender: this.clientId,
      target,
      candidate
    });
  }

  /**
   * End call
   */
  endCall(roomId) {
    this.send({
      type: 'endCall',
      roomId,
      sender: this.clientId
    });
  }

  /**
   * Get client ID
   */
  getClientId() {
    return this.clientId;
  }

  /**
   * Check if connected
   */
  isReady() {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const signalingService = new SignalingService();
export default signalingService;
