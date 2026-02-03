/**
 * WebRTC Signaling Server
 * Supports: HTTPS + WebSocket, Room management, Group calls (mesh topology)
 * 
 * Signaling Protocol Messages:
 * - register: { type: 'register', name: string }
 * - createRoom: { type: 'createRoom', roomId: string, name: string }
 * - joinRoom: { type: 'joinRoom', roomId: string, name: string }
 * - roomMembers: { type: 'roomMembers', roomId: string, members: [] }
 * - offer: { type: 'offer', roomId: string, sender: string, target: string, offer: RTCSessionDescription }
 * - answer: { type: 'answer', roomId: string, sender: string, target: string, answer: RTCSessionDescription }
 * - candidate: { type: 'candidate', roomId: string, sender: string, target: string, candidate: RTCIceCandidate }
 * - leaveRoom: { type: 'leaveRoom', roomId: string, sender: string }
 * - memberLeft: { type: 'memberLeft', roomId: string, name: string }
 * - endCall: { type: 'endCall', roomId: string, sender: string }
 * - startCall: { type: 'startCall', roomId: string, sender: string }
 * - callStarted: { type: 'callStarted', roomId: string, initiator: string }
 */

const express = require('express');
const https = require('https');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.PORT || 3001;
const USE_HTTPS = process.env.USE_HTTPS === 'true';

const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP or HTTPS server
let server;
if (USE_HTTPS) {
  const certPath = process.env.CERT_PATH || './cert.pem';
  const keyPath = process.env.KEY_PATH || './key.pem';
  
  try {
    const options = {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath)
    };
    server = https.createServer(options, app);
    console.log('🔒 Running with HTTPS');
  } catch (err) {
    console.warn('⚠️  Could not load SSL certificates, falling back to HTTP');
    console.warn('   Run: npm run generate-certs to create self-signed certificates');
    server = http.createServer(app);
  }
} else {
  server = http.createServer(app);
  console.log('🌐 Running with HTTP');
}

// WebSocket server
const wss = new WebSocket.Server({ server });

// State management
const clients = new Map(); // clientId -> { ws, name, roomId }
const rooms = new Map();   // roomId -> { id, members: Map(clientId -> {name, isHost}), callActive: boolean }

// Utility functions
const generateClientId = () => uuidv4();

const broadcast = (roomId, message, excludeClientId = null) => {
  const room = rooms.get(roomId);
  if (!room) return;
  
  room.members.forEach((memberInfo, clientId) => {
    if (clientId !== excludeClientId) {
      const client = clients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    }
  });
};

const sendToClient = (clientId, message) => {
  const client = clients.get(clientId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
  }
};

const getRoomMembers = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return [];
  
  const members = [];
  room.members.forEach((memberInfo, clientId) => {
    members.push({
      id: clientId,
      name: memberInfo.name,
      isHost: memberInfo.isHost
    });
  });
  return members;
};

const cleanupClient = (clientId) => {
  const client = clients.get(clientId);
  if (!client) return;
  
  const { roomId, name } = client;
  
  if (roomId) {
    const room = rooms.get(roomId);
    if (room) {
      room.members.delete(clientId);
      
      // Notify remaining members
      broadcast(roomId, {
        type: 'memberLeft',
        roomId,
        name,
        memberId: clientId
      });
      
      // Update room members list
      broadcast(roomId, {
        type: 'roomMembers',
        roomId,
        members: getRoomMembers(roomId)
      });
      
      // Clean up empty room
      if (room.members.size === 0) {
        rooms.delete(roomId);
        console.log(`🗑️  Room ${roomId} deleted (empty)`);
      }
    }
  }
  
  clients.delete(clientId);
  console.log(`👋 Client disconnected: ${name || clientId}`);
};

// WebSocket connection handler
wss.on('connection', (ws) => {
  const clientId = generateClientId();
  clients.set(clientId, { ws, name: null, roomId: null });
  
  console.log(`🔌 New connection: ${clientId}`);
  
  // Send client their ID
  ws.send(JSON.stringify({
    type: 'connected',
    clientId
  }));
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleMessage(clientId, message);
    } catch (err) {
      console.error('Failed to parse message:', err);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });
  
  ws.on('close', () => {
    cleanupClient(clientId);
  });
  
  ws.on('error', (err) => {
    console.error(`WebSocket error for ${clientId}:`, err);
    cleanupClient(clientId);
  });
});

// Message handler
const handleMessage = (clientId, message) => {
  const client = clients.get(clientId);
  if (!client) return;
  
  console.log(`📨 [${client.name || clientId}] ${message.type}`);
  
  switch (message.type) {
    case 'register':
      handleRegister(clientId, message);
      break;
    case 'createRoom':
      handleCreateRoom(clientId, message);
      break;
    case 'joinRoom':
      handleJoinRoom(clientId, message);
      break;
    case 'leaveRoom':
      handleLeaveRoom(clientId, message);
      break;
    case 'startCall':
      handleStartCall(clientId, message);
      break;
    case 'offer':
      handleOffer(clientId, message);
      break;
    case 'answer':
      handleAnswer(clientId, message);
      break;
    case 'candidate':
      handleCandidate(clientId, message);
      break;
    case 'endCall':
      handleEndCall(clientId, message);
      break;
    default:
      console.warn(`Unknown message type: ${message.type}`);
  }
};

// Handler functions
const handleRegister = (clientId, message) => {
  const client = clients.get(clientId);
  if (client) {
    client.name = message.name;
    console.log(`✅ Registered: ${message.name} (${clientId})`);
    
    sendToClient(clientId, {
      type: 'registered',
      name: message.name,
      clientId
    });
  }
};

const handleCreateRoom = (clientId, message) => {
  const client = clients.get(clientId);
  if (!client) return;
  
  const roomId = message.roomId || uuidv4().substring(0, 8);
  
  // Check if room already exists
  if (rooms.has(roomId)) {
    sendToClient(clientId, {
      type: 'error',
      message: 'Room already exists',
      roomId
    });
    return;
  }
  
  // Create new room
  const room = {
    id: roomId,
    members: new Map(),
    callActive: false,
    createdAt: new Date().toISOString()
  };
  
  room.members.set(clientId, {
    name: message.name || client.name,
    isHost: true
  });
  
  rooms.set(roomId, room);
  client.roomId = roomId;
  client.name = message.name || client.name;
  
  console.log(`🏠 Room created: ${roomId} by ${client.name}`);
  
  sendToClient(clientId, {
    type: 'roomCreated',
    roomId,
    isHost: true,
    members: getRoomMembers(roomId)
  });
};

const handleJoinRoom = (clientId, message) => {
  const client = clients.get(clientId);
  if (!client) return;
  
  const { roomId, name } = message;
  
  // Check if room exists
  if (!rooms.has(roomId)) {
    sendToClient(clientId, {
      type: 'error',
      message: 'Room not found',
      roomId
    });
    return;
  }
  
  const room = rooms.get(roomId);
  
  // Add client to room
  room.members.set(clientId, {
    name: name || client.name,
    isHost: false
  });
  
  client.roomId = roomId;
  client.name = name || client.name;
  
  console.log(`➡️  ${client.name} joined room ${roomId}`);
  
  // Notify the joining client
  sendToClient(clientId, {
    type: 'roomJoined',
    roomId,
    isHost: false,
    members: getRoomMembers(roomId),
    callActive: room.callActive
  });
  
  // Notify existing members about new member
  broadcast(roomId, {
    type: 'memberJoined',
    roomId,
    member: {
      id: clientId,
      name: client.name,
      isHost: false
    }
  }, clientId);
  
  // Send updated member list to all
  broadcast(roomId, {
    type: 'roomMembers',
    roomId,
    members: getRoomMembers(roomId)
  });
};

const handleLeaveRoom = (clientId, message) => {
  const client = clients.get(clientId);
  if (!client || !client.roomId) return;
  
  const { roomId } = client;
  const room = rooms.get(roomId);
  
  if (room) {
    room.members.delete(clientId);
    
    // Notify remaining members
    broadcast(roomId, {
      type: 'memberLeft',
      roomId,
      name: client.name,
      memberId: clientId
    });
    
    // Update room members
    broadcast(roomId, {
      type: 'roomMembers',
      roomId,
      members: getRoomMembers(roomId)
    });
    
    // Clean up empty room
    if (room.members.size === 0) {
      rooms.delete(roomId);
      console.log(`🗑️  Room ${roomId} deleted (empty)`);
    }
  }
  
  client.roomId = null;
  console.log(`⬅️  ${client.name} left room ${roomId}`);
  
  sendToClient(clientId, {
    type: 'leftRoom',
    roomId
  });
};

const handleStartCall = (clientId, message) => {
  const client = clients.get(clientId);
  if (!client || !client.roomId) return;
  
  const { roomId } = client;
  const room = rooms.get(roomId);
  
  if (room) {
    room.callActive = true;
    
    // Notify all members that call has started
    broadcast(roomId, {
      type: 'callStarted',
      roomId,
      initiator: clientId,
      initiatorName: client.name
    });
    
    console.log(`📞 Call started in room ${roomId} by ${client.name}`);
  }
};

const handleOffer = (clientId, message) => {
  const { roomId, target, offer } = message;
  const client = clients.get(clientId);
  
  if (!client) return;
  
  // Forward offer to target
  sendToClient(target, {
    type: 'offer',
    roomId,
    sender: clientId,
    senderName: client.name,
    target,
    offer
  });
  
  console.log(`📤 Offer: ${client.name} -> ${target}`);
};

const handleAnswer = (clientId, message) => {
  const { roomId, target, answer } = message;
  const client = clients.get(clientId);
  
  if (!client) return;
  
  // Forward answer to target
  sendToClient(target, {
    type: 'answer',
    roomId,
    sender: clientId,
    senderName: client.name,
    target,
    answer
  });
  
  console.log(`📥 Answer: ${client.name} -> ${target}`);
};

const handleCandidate = (clientId, message) => {
  const { roomId, target, candidate } = message;
  const client = clients.get(clientId);
  
  if (!client) return;
  
  // Forward ICE candidate to target
  sendToClient(target, {
    type: 'candidate',
    roomId,
    sender: clientId,
    senderName: client.name,
    target,
    candidate
  });
};

const handleEndCall = (clientId, message) => {
  const client = clients.get(clientId);
  if (!client || !client.roomId) return;
  
  const { roomId } = client;
  const room = rooms.get(roomId);
  
  if (room) {
    room.callActive = false;
    
    // Notify all members that call has ended
    broadcast(roomId, {
      type: 'callEnded',
      roomId,
      endedBy: clientId,
      endedByName: client.name
    });
    
    console.log(`📴 Call ended in room ${roomId} by ${client.name}`);
  }
};

// REST API endpoints for health check and room info
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    rooms: rooms.size,
    clients: clients.size
  });
});

app.get('/api/rooms', (req, res) => {
  const roomList = [];
  rooms.forEach((room, roomId) => {
    roomList.push({
      id: roomId,
      memberCount: room.members.size,
      callActive: room.callActive,
      createdAt: room.createdAt
    });
  });
  res.json(roomList);
});

app.get('/api/rooms/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({
    id: room.id,
    memberCount: room.members.size,
    callActive: room.callActive,
    createdAt: room.createdAt,
    members: getRoomMembers(room.id)
  });
});

// Start server
server.listen(PORT, () => {
  const protocol = USE_HTTPS ? 'https' : 'http';
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                 WebRTC Signaling Server                    ║
╠════════════════════════════════════════════════════════════╣
║  🚀 Server running at ${protocol}://localhost:${PORT}              
║  🔌 WebSocket endpoint: ws${USE_HTTPS ? 's' : ''}://localhost:${PORT}          
║  📊 Health check: ${protocol}://localhost:${PORT}/health           
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = { app, server, wss };
